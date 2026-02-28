import express from "express";
import path from "path";
import bcrypt from "bcryptjs";
import cors from "cors";
import multer from "multer";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";
import fs from "fs";
import crypto from "crypto";
import session from "express-session";
import passport from "passport";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import rateLimit from 'express-rate-limit';
import Joi from "joi";

// Schemas
import { isGoogleOAuthConfigured } from "./passport.js";
import Itinerary from "./models/Itinerary.js";
import User from './models/User.js';
import Review from "./models/Review.js";
import Message from "./models/message.js";
import Profile from "./models/profile.js";
import { isFirebaseConfigured } from "./lib/firebaseAdmin.js";
import { sortDocs } from "./lib/firestoreModel.js";
dotenv.config();
const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(48).toString("hex");
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(48).toString("hex");
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
if (!process.env.JWT_SECRET) console.warn("⚠️ JWT_SECRET missing. Using runtime-generated secret.");
if (!process.env.SESSION_SECRET) console.warn("⚠️ SESSION_SECRET missing. Using runtime-generated secret.");
if (!isFirebaseConfigured) {
  console.error("❌ Firebase is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_* service-account vars.");
  process.exit(1);
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "uploads");
const frontendDistDir = path.join(__dirname, "frontend", "dist");
const hasFrontendDist = fs.existsSync(frontendDistDir);

const HTML_ESCAPE_MAP = Object.freeze({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#39;",
  "`": "&#96;",
});

function sanitizeText(value) {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .replace(/[&<>"'`]/g, (char) => HTML_ESCAPE_MAP[char]);
}

function sanitizeCsvToArray(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeText).filter(Boolean);
  }
  if (typeof value !== "string") return [];
  return value.split(",").map((item) => sanitizeText(item)).filter(Boolean);
}

function normalizeExternalUrl(value) {
  const clean = sanitizeText(value);
  if (!clean) return "";
  if (clean.startsWith("@")) return clean;
  try {
    const parsed = new URL(clean);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    return "";
  }
  return "";
}

function sanitizeFilename(value) {
  if (typeof value !== "string") return "";
  const file = path.basename(value).trim();
  if (!file || file.includes("..") || file.includes("/") || file.includes("\\")) return "";
  return file;
}

function sanitizeNextPath(value) {
  if (typeof value !== "string") return "/matches";
  const next = value.trim();
  if (!next.startsWith("/") || next.startsWith("//")) return "/matches";
  return next;
}

function appendToken(pathname, token) {
  const separator = pathname.includes("?") ? "&" : "?";
  return `${pathname}${separator}token=${encodeURIComponent(token)}`;
}

function isSelfRequest(req, userId) {
  return String(req.user?.userId || "") === String(userId || "");
}

function userRoom(email) {
  return `user:${email}`;
}

function toMapUrl(query) {
  const clean = sanitizeText(query);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clean)}`;
}

function buildFallbackItinerary({ destination, days, interests, budget, travelType }) {
  const themedSpots = {
    history: ["Old Town", "City Museum", "Fort Viewpoint"],
    food: ["Local Street Food Lane", "Night Market", "Traditional Kitchen"],
    nature: ["Central Park", "Sunset Point", "Lakeside Trail"],
    art: ["Art District", "Craft Market", "Gallery Street"],
    adventure: ["Adventure Park", "Scenic Trek Base", "Zipline Zone"],
    shopping: ["Main Bazaar", "Design Street", "Souvenir Market"],
  };
  const defaultSpots = ["City Center", "Riverside", "Panorama Point"];

  const interestKeys = (Array.isArray(interests) ? interests : [])
    .map((v) => String(v).toLowerCase().trim());
  const pool = interestKeys.flatMap((key) => themedSpots[key] || []);
  const baseSpots = pool.length ? pool : defaultSpots;

  const dayPlans = [];
  for (let i = 1; i <= days; i += 1) {
    const offset = (i - 1) * 3;
    const spots = [0, 1, 2].map((n) => {
      const name = baseSpots[(offset + n) % baseSpots.length];
      const query = `${name}, ${destination}`;
      return {
        name,
        why: `Great for ${interestKeys[n % (interestKeys.length || 1)] || "exploring local vibes"}.`,
        timeSlot: n === 0 ? "Morning" : n === 1 ? "Afternoon" : "Evening",
        mapQuery: query,
        mapUrl: toMapUrl(query),
      };
    });

    dayPlans.push({
      day: i,
      title: `Day ${i}: ${destination} Highlights`,
      summary: `Balanced plan for ${travelType || "general"} travel with ${budget || "flexible"} budget focus.`,
      vibe: travelType || "Flexible",
      estimatedBudget: budget || "Medium",
      places: spots,
      food: [
        {
          name: `Local Food Stop ${i}`,
          mapQuery: `Popular local food in ${destination}`,
          mapUrl: toMapUrl(`Popular local food in ${destination}`),
        }
      ],
      transportTip: "Use nearby transit/ride-share and keep offline maps downloaded.",
      mustCarry: ["Water bottle", "Power bank", "Comfortable shoes"],
    });
  }

  return {
    destination,
    totalDays: days,
    generatedBy: "fallback",
    budgetAdvice: `Target a ${budget || "moderate"} daily spend and pre-book major attractions.`,
    overallTips: [
      "Start early to avoid crowds.",
      "Keep one flexible hour every evening.",
      "Share live location with a trusted contact.",
    ],
    days: dayPlans,
  };
}

function extractJsonObject(rawText) {
  if (!rawText || typeof rawText !== "string") return null;
  const start = rawText.indexOf("{");
  const end = rawText.lastIndexOf("}");
  if (start < 0 || end < 0 || end <= start) return null;
  const candidate = rawText.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

async function callOpenAIItinerary({ destination, days, interests, budget, travelType, companionStyle }) {
  if (!OPENAI_API_KEY) return null;

  const prompt = {
    destination,
    days,
    interests,
    budget,
    travelType,
    companionStyle,
  };

  const system = [
    "You are a travel itinerary assistant.",
    "Respond ONLY JSON. No markdown.",
    "Output schema:",
    "{",
    "\"destination\": string,",
    "\"totalDays\": number,",
    "\"generatedBy\": \"ai\",",
    "\"budgetAdvice\": string,",
    "\"overallTips\": string[],",
    "\"days\": [{",
    "  \"day\": number,",
    "  \"title\": string,",
    "  \"summary\": string,",
    "  \"vibe\": string,",
    "  \"estimatedBudget\": string,",
    "  \"mustCarry\": string[],",
    "  \"transportTip\": string,",
    "  \"places\": [{\"name\": string, \"why\": string, \"timeSlot\": string, \"mapQuery\": string}],",
    "  \"food\": [{\"name\": string, \"mapQuery\": string}]",
    "}]",
    "}",
    "Every mapQuery must be specific enough for Google Maps.",
    "Keep text concise and practical.",
  ].join("\n");

  const user = `Plan a ${days}-day itinerary in ${destination}. Preferences: ${JSON.stringify(prompt)}.`;

  const resp = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.7,
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`OpenAI request failed: ${resp.status} ${t}`);
  }

  const data = await resp.json();
  const textFromOutputArray = Array.isArray(data.output)
    ? data.output
        .flatMap((item) => Array.isArray(item.content) ? item.content : [])
        .map((part) => part.text || "")
        .join("\n")
    : "";
  const rawText = data.output_text || textFromOutputArray;
  const parsed = extractJsonObject(rawText);
  return parsed;
}

async function callGroqItinerary({ destination, days, interests, budget, travelType, companionStyle }) {
  if (!GROQ_API_KEY) return null;

  const prompt = {
    destination,
    days,
    interests,
    budget,
    travelType,
    companionStyle,
  };

  const system = [
    "You are a travel itinerary assistant.",
    "Respond ONLY JSON. No markdown.",
    "Output schema:",
    "{",
    "\"destination\": string,",
    "\"totalDays\": number,",
    "\"generatedBy\": \"ai\",",
    "\"budgetAdvice\": string,",
    "\"overallTips\": string[],",
    "\"days\": [{",
    "  \"day\": number,",
    "  \"title\": string,",
    "  \"summary\": string,",
    "  \"vibe\": string,",
    "  \"estimatedBudget\": string,",
    "  \"mustCarry\": string[],",
    "  \"transportTip\": string,",
    "  \"places\": [{\"name\": string, \"why\": string, \"timeSlot\": string, \"mapQuery\": string}],",
    "  \"food\": [{\"name\": string, \"mapQuery\": string}]",
    "}]",
    "}",
    "Every mapQuery must be specific enough for Google Maps.",
    "Keep text concise and practical.",
  ].join("\n");

  const user = `Plan a ${days}-day itinerary in ${destination}. Preferences: ${JSON.stringify(prompt)}.`;

  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Groq request failed: ${resp.status} ${t}`);
  }

  const data = await resp.json();
  const text = data?.choices?.[0]?.message?.content || "";
  const parsed = extractJsonObject(text);
  return parsed;
}

function normalizeAiItinerary(raw, fallbackInput) {
  const fallback = buildFallbackItinerary(fallbackInput);
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.days) || raw.days.length === 0) {
    return fallback;
  }

  const normalizedDays = raw.days.map((d, idx) => {
    const places = Array.isArray(d.places) ? d.places : [];
    const foods = Array.isArray(d.food) ? d.food : [];

    return {
      day: Number(d.day) || idx + 1,
      title: sanitizeText(d.title || `Day ${idx + 1}`),
      summary: sanitizeText(d.summary || ""),
      vibe: sanitizeText(d.vibe || fallbackInput.travelType || "Flexible"),
      estimatedBudget: sanitizeText(d.estimatedBudget || fallbackInput.budget || "Medium"),
      mustCarry: Array.isArray(d.mustCarry) ? d.mustCarry.map(sanitizeText).filter(Boolean) : [],
      transportTip: sanitizeText(d.transportTip || ""),
      places: places.map((p) => {
        const mapQuery = sanitizeText(p.mapQuery || `${p.name || "Place"}, ${fallbackInput.destination}`);
        return {
          name: sanitizeText(p.name || "Place"),
          why: sanitizeText(p.why || ""),
          timeSlot: sanitizeText(p.timeSlot || ""),
          mapQuery,
          mapUrl: toMapUrl(mapQuery),
        };
      }),
      food: foods.map((f) => {
        const mapQuery = sanitizeText(f.mapQuery || `${f.name || "Food"}, ${fallbackInput.destination}`);
        return {
          name: sanitizeText(f.name || "Food Spot"),
          mapQuery,
          mapUrl: toMapUrl(mapQuery),
        };
      }),
    };
  });

  return {
    destination: sanitizeText(raw.destination || fallbackInput.destination),
    totalDays: Number(raw.totalDays) || normalizedDays.length,
    generatedBy: "ai",
    budgetAdvice: sanitizeText(raw.budgetAdvice || ""),
    overallTips: Array.isArray(raw.overallTips) ? raw.overallTips.map(sanitizeText).filter(Boolean) : [],
    days: normalizedDays,
  };
}

function frontendRedirectUrl(originalUrl) {
  return `${FRONTEND_URL}${originalUrl || "/"}`;
}

function serveFrontendEntry(req, res) {
  if (hasFrontendDist) {
    return res.sendFile(path.join(frontendDistDir, "index.html"));
  }
  return res.redirect(frontendRedirectUrl(req.originalUrl));
}

async function areUsersMatched(emailA, emailB) {
  const first = await User.findOne({ email: emailA });
  if (!first) return false;
  return Array.isArray(first.matches) && first.matches.includes(emailB);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use("/static", express.static(path.join(__dirname, "static")));
app.use("/uploads", express.static(uploadsDir));
if (hasFrontendDist) {
  app.use(express.static(frontendDistDir));
}
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
}));
app.use(passport.initialize());
app.use(passport.session());

// Frontend app routes
app.get([
  "/",
  "/login",
  "/signup",
  "/matches",
  "/profile-setup",
  "/set-password",
  "/itinerary-form",
  "/profile",
  "/messages",
  "/matches-list",
  "/view-profile",
], serveFrontendEntry);

// Google OAuth
app.get("/auth/google", (req, res, next) => {
  const nextPath = sanitizeNextPath(String(req.query.next || "/matches"));
  if (!isGoogleOAuthConfigured) {
    const loginUrl = `${FRONTEND_URL}/login?error=oauth_not_configured&next=${encodeURIComponent(nextPath)}`;
    return res.redirect(loginUrl);
  }
  return passport.authenticate("google", {
    scope: ["profile", "email"],
    state: nextPath,
  })(req, res, next);
});
app.get("/auth/logout", (req, res) => {
  req.logout(() => res.redirect(`${FRONTEND_URL}/login`));
});
app.get("/auth/google/callback",
  (req, res, next) => {
    if (!isGoogleOAuthConfigured) {
      return res.redirect(`${FRONTEND_URL}/login?error=oauth_not_configured`);
    }
    return next();
  },
  passport.authenticate("google", {
    failureRedirect: `${FRONTEND_URL}/login`,
    session: false
  }),
  async (req, res) => {
    const nextPath = sanitizeNextPath(String(req.query.state || "/matches"));
    const token = jwt.sign(
      { userId: req.user._id, email: req.user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const profile = await Profile.findOne({ email: req.user.email });

    if (!req.user.passwordHash) {
      const setPasswordPath = appendToken(`/set-password?next=${encodeURIComponent(nextPath)}`, token);
      return res.redirect(`${FRONTEND_URL}${setPasswordPath}`);
    }

    if (!profile) {
      const setupPath = appendToken(`/profile-setup?next=${encodeURIComponent(nextPath)}`, token);
      return res.redirect(`${FRONTEND_URL}${setupPath}`);
    }

    res.redirect(`${FRONTEND_URL}${appendToken(nextPath, token)}`);
  }
);

app.get('/login-success', (req, res) => {
  const token = req.query.token;
  if (token) return res.redirect(`${FRONTEND_URL}/login?token=${token}`);
  return res.redirect(`${FRONTEND_URL}/login?error=missing_token`);
});
// JWT Middleware (updated with better logging)
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: "Missing authorization header" });
  }

  const token = authHeader.split(' ')[1]; // expecting "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: "Token missing after Bearer" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    req.user = user;
    next();
  });
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: "Too many requests. Try again later.",
});
app.use("/auth", authLimiter);

// ✅ Auth: Signup
app.post('/auth/signup', async (req, res) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
    });
    const { value, error } = schema.validate(req.body || {}, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.details[0].message });

    const email = value.email.toLowerCase().trim();
    const password = value.password;
    const existing = await User.findOne({ email });
    if (existing && existing.passwordHash) {
      return res.status(400).json({ message: 'User already exists' });
    }
    if (existing && !existing.passwordHash) {
      return res.status(400).json({ message: 'Email already linked with Google account. Please use Google login.' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = existing ? Object.assign(existing, { passwordHash }) : new User({ email, passwordHash });
    await newUser.save();
    // 🔐 Issue token immediately after signup
    const token = jwt.sign({ userId: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, userId: newUser._id, email: newUser.email });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// ✅ Auth: Login
// ✅ Auth: Login
app.post('/auth/login', async (req, res) => {
  try {
    const email = sanitizeText(req.body?.email).toLowerCase();
    const password = String(req.body?.password || "");
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    if (!user.passwordHash) {
      return res.status(400).json({
        message: "This account uses Google sign-in. Continue with Google to access or set a password."
      });
    }
    if (user.passwordHash === "GOOGLE_AUTH") {
      return res.status(400).json({
        message: "This account uses Google sign-in. Continue with Google to access or set a password."
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    // ✅ NEW: Check if profile exists
    const profile = await Profile.findOne({ email });
    const needsProfileSetup = !profile;

    res.json({
      token,
      userId: user._id,
      email: user.email,
      profileSetupComplete: !needsProfileSetup  // 👈 include this
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Set/Update Password for Google Users
app.post("/auth/set-password", authenticateToken, async (req, res) => {
  try {
    const password = String(req.body?.password || "");
    if (!password || password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.passwordHash && user.passwordHash !== "GOOGLE_AUTH") {
      return res.status(400).json({ message: "Password is already set. Use a dedicated change-password flow." });
    }
    user.passwordHash = await bcrypt.hash(password, 10);
    await user.save();
    res.status(200).json({ message: "Password set successfully" });
  } catch (err) {
    console.error("Set password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// 🔍 Fetch Authenticated User Profile
app.get("/api/profile", authenticateToken, async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      console.log("❌ No user info found in token");
      return res.status(401).json({ message: "Unauthorized or missing token data" });
    }
    const profile = await Profile.findOne({ email: req.user.email });
    if (!profile) {
      console.log("❌ Profile not found for email:", req.user.email);
      return res.status(404).json({ message: "Profile not found" });
    }
    res.status(200).json(profile);
  } catch (err) {
    console.error("❌ Error fetching profile:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// 🧾 Save or Update Profile
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`);
  }
});
const upload = multer({ storage });
app.post("/auth/profile-setup", authenticateToken, upload.array("photos[]", 6), async (req, res) => {
  try {
    const {
      firstName = "",
      dob_day = "01",
      dob_month = "01",
      dob_year = "2000",
      gender = "",
      showGender = false,
      interestedIn = "",
      travelType = "",
      interests = "",
      bio = "",
      location = "",
    } = req.body;

    const email = req.user.email;

    // Format DOB safely
    const dob = `${dob_year.padStart(4, '0')}-${dob_month.padStart(2, '0')}-${dob_day.padStart(2, '0')}`;

    // Handle photo uploads
    const photos = req.files?.map(file => file.filename) || [];

    // ✅ Handle social links from form fields like: socialLinks[instagram]
    const socialLinks = {
      instagram: normalizeExternalUrl(req.body["socialLinks[instagram]"] || ""),
      linkedin: normalizeExternalUrl(req.body["socialLinks[linkedin]"] || "")
    };

    // Final profile data
    const profileData = {
      userId: req.user.userId,
      email,
      firstName: sanitizeText(firstName),
      dob,
      gender: sanitizeText(gender),
      showGender: showGender === "on" || showGender === true,
      interestedIn: sanitizeText(interestedIn),
      travelType: sanitizeText(travelType),
      interests: sanitizeCsvToArray(interests),
      photos,
      bio: sanitizeText(bio),
      location: sanitizeText(location),
      socialLinks
    };

    // Check if user already has a profile
    const existingProfile = await Profile.findOne({ email });
    if (existingProfile) {
      await Profile.updateOne({ email }, profileData);
      res.status(200).json({ message: "Profile updated" });
    } else {
      const newProfile = new Profile(profileData);
      await newProfile.save();
      res.status(201).json({ message: "Profile created" });
    }

  } catch (err) {
    console.error("Profile setup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
app.post('/itinerary/create', authenticateToken, async (req, res) => {
  try {
    const profile = await Profile.findOne({ email: req.user.email });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const { destination, description, startDate, endDate, interests } = req.body;
    const itinerary = new Itinerary({
      user: profile._id,
      destination: sanitizeText(destination),
      description: sanitizeText(description),
      startDate,
      endDate,
      interests: sanitizeCsvToArray(interests),
    });
    await itinerary.save();
    res.redirect('/itineraries');
  } catch (err) {
    console.error("Itinerary create error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
app.post('/api/itinerary', authenticateToken, async (req, res) => {
  try {
    const user = await Profile.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: "User profile not found" });
    const { destination, startDate, endDate, interests, travelType, budget, description } = req.body;
    const newItinerary = new Itinerary({
      user: user._id,
      destination: sanitizeText(destination),
      startDate,
      endDate,
      interests: sanitizeCsvToArray(interests),
      travelType: sanitizeText(travelType),
      budget: sanitizeText(budget),
      description: sanitizeText(description),
    });
    await newItinerary.save();
    res.status(201).json({ message: "Itinerary saved!" });
  } catch (err) {
    console.error("Itinerary save error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/ai/itinerary", authenticateToken, async (req, res) => {
  try {
    const schema = Joi.object({
      destination: Joi.string().min(2).max(120).required(),
      days: Joi.number().integer().min(1).max(14).default(3),
      interests: Joi.alternatives().try(
        Joi.array().items(Joi.string().max(40)).max(10),
        Joi.string().allow("")
      ).default([]),
      budget: Joi.string().max(40).allow("").default("Medium"),
      travelType: Joi.string().max(40).allow("").default("Flexible"),
      companionStyle: Joi.string().max(40).allow("").default("Friendly"),
    });

    const { value, error } = schema.validate(req.body || {}, { stripUnknown: true });
    if (error) return res.status(400).json({ message: error.details[0].message });

    const payload = {
      destination: sanitizeText(value.destination),
      days: Number(value.days) || 3,
      interests: Array.isArray(value.interests) ? value.interests.map(sanitizeText) : sanitizeCsvToArray(value.interests),
      budget: sanitizeText(value.budget),
      travelType: sanitizeText(value.travelType),
      companionStyle: sanitizeText(value.companionStyle),
    };

    let aiRaw = null;
    let provider = "fallback";
    try {
      aiRaw = await callGroqItinerary(payload);
      if (aiRaw) provider = "groq";
      if (!aiRaw) {
        aiRaw = await callOpenAIItinerary(payload);
        if (aiRaw) provider = "openai";
      }
    } catch (aiErr) {
      console.error("AI itinerary generation failed, using fallback:", aiErr.message);
    }

    const itinerary = normalizeAiItinerary(aiRaw, payload);
    itinerary.generatedBy = provider === "fallback" ? itinerary.generatedBy : provider;
    res.status(200).json(itinerary);
  } catch (err) {
    console.error("AI itinerary route error:", err);
    res.status(500).json({ message: "Failed to generate itinerary" });
  }
});

app.get('/api/itineraries', authenticateToken, async (req, res) => {
  try {
    const { destination = "", budget = "" } = req.query;

    const user = await User.findOne({ email: req.user.email });
    const profile = await Profile.findOne({ email: req.user.email });

    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const dislikedEmails = user?.dislikes || [];

    const query = {
      user: { $ne: profile._id },
      ...(destination && { destination: { $regex: destination, $options: "i" } })
    };

    const itineraries = sortDocs(await Itinerary.find(query), { createdAt: -1 }).slice(0, 20);
    const withUsers = await Promise.all(
      itineraries.map(async (itineraryDoc) => {
        const itinerary = itineraryDoc.toObject();
        const owner = await Profile.findById(itinerary.user);
        return {
          ...itinerary,
          user: owner ? owner.toObject() : null,
        };
      })
    );

    const filtered = withUsers.filter((itinerary) => itinerary.user && !dislikedEmails.includes(itinerary.user.email));
    res.json(filtered);
  } catch (err) {
    console.error("Error fetching itineraries:", err);
    res.status(500).json({ message: "Server error" });
  }
});


app.get("/api/user/:id", async (req, res) => {
  try {
    const profileDoc = await Profile.findOne({ userId: req.params.id });
    if (!profileDoc) return res.status(404).json({ message: "Profile not found" });

    const profile = profileDoc.toObject();
    const itineraries = sortDocs(await Itinerary.find({ user: profileDoc._id }), { createdAt: -1 }).map((doc) => doc.toObject());
    const reviewsRaw = sortDocs(await Review.find({ target: profileDoc._id }), { createdAt: -1 });

    const reviews = await Promise.all(
      reviewsRaw.map(async (reviewDoc) => {
        const reviewer = await User.findById(reviewDoc.reviewer);
        return {
          reviewerName: reviewer?.email || "Anonymous",
          rating: reviewDoc.rating,
          comment: reviewDoc.comment,
          date: reviewDoc.createdAt,
        };
      })
    );

    res.json({ profile, itineraries, reviews });
  } catch (err) {
    console.error("User profile fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.patch("/api/user/:id", authenticateToken, async (req, res) => {
  try {
    if (!isSelfRequest(req, req.params.id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const profile = await Profile.findOne({ userId: req.params.id });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const { profilePhoto } = req.body;

    if (req.body.firstName !== undefined) profile.firstName = sanitizeText(req.body.firstName);
    if (req.body.gender !== undefined) profile.gender = sanitizeText(req.body.gender);
    if (req.body.travelType !== undefined) profile.travelType = sanitizeText(req.body.travelType);
    if (req.body.interestedIn !== undefined) profile.interestedIn = sanitizeText(req.body.interestedIn);
    if (req.body.bio !== undefined) profile.bio = sanitizeText(req.body.bio);
    if (req.body.location !== undefined) profile.location = sanitizeText(req.body.location);
    if (req.body.dob !== undefined) profile.dob = sanitizeText(req.body.dob);
    if (req.body.showGender !== undefined) profile.showGender = Boolean(req.body.showGender);

    if (req.body.interests !== undefined) {
      profile.interests = sanitizeCsvToArray(req.body.interests);
    }
    if (req.body.socialLinks && typeof req.body.socialLinks === "object") {
      profile.socialLinks = {
        instagram: normalizeExternalUrl(req.body.socialLinks.instagram || ""),
        linkedin: normalizeExternalUrl(req.body.socialLinks.linkedin || ""),
      };
    }

    const safeProfilePhoto = sanitizeFilename(profilePhoto);
    if (safeProfilePhoto && profile.photos.includes(safeProfilePhoto)) {
      profile.profilePhoto = safeProfilePhoto;
    } else if (profilePhoto) {
      return res.status(400).json({ message: "Invalid profile photo selection" });
    }

    if (req.body.photos && Array.isArray(req.body.photos)) {
      return res.status(400).json({ message: "Photos can only be changed through upload endpoints" });
    }

    if (req.body.profilePhoto === "") {
      profile.profilePhoto = profilePhoto;
    }

    profile.updatedAt = new Date();
    await profile.save();

    res.json({ message: "Profile updated", profile });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

//  Safe new route 
app.get("/api/profile/:id", async (req, res) => {
  try {
    const profileDoc = await Profile.findById(req.params.id);
    if (!profileDoc) return res.status(404).json({ message: "Profile not found" });
    res.json({ profile: profileDoc.toObject() });
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/review/:userId", authenticateToken, async (req, res) => {
  try {
    const reviewerUser = await User.findOne({ email: req.user.email });
    const targetProfile = await Profile.findOne({ userId: req.params.userId });

    if (!reviewerUser || !targetProfile) {
      return res.status(404).json({ message: "User not found" });
    }

    const { rating } = req.body;
    const comment = sanitizeText(req.body?.comment);
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const review = new Review({
      reviewer: reviewerUser._id,
      target: targetProfile._id,
      rating,
      comment,
      createdAt: new Date()
    });

    await review.save();
    res.status(201).json({ message: "Review submitted" });
  } catch (err) {
    console.error("Review submission error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🧑‍🤝‍🧑 Matchmaking API
app.get("/api/matches", authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const currentUser = await User.findOne({ email: userEmail });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadyLiked = currentUser.likes || [];
    const alreadyDisliked = currentUser.dislikes || [];

    const profiles = await Profile.find({
      email: {
        $ne: userEmail,
        $nin: [...alreadyLiked, ...alreadyDisliked]
      }
    });

    console.log("🧠 Profiles found:", profiles.length);

    const enriched = await Promise.all(
      profiles.map(async (profileDoc) => {
        const profile = profileDoc.toObject();
        const itineraryDoc = await Itinerary.findOne({ user: profileDoc._id });
        const itinerary = itineraryDoc ? itineraryDoc.toObject() : null;

        const profilePhoto = profile.profilePhoto
          ? `/uploads/${profile.profilePhoto}`
          : (profile.photos?.length
            ? `/uploads/${profile.photos.at(-1)}`
            : "/static/images/default-avatar.png");

        return {
          ...profile,
          profilePhoto,
          itinerary
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error("❌ Fetch matches error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/mutual-matches", authenticateToken, async (req, res) => {
  try {
    const loggedInUser = await User.findOne({ email: req.user.email });

    const mutuals = await User.find({
      email: { $in: loggedInUser.matches },
      matches: req.user.email
    });

    const emails = mutuals.map(u => u.email);
    const profiles = await Profile.find({ email: { $in: emails } });

    const merged = profiles.map(profile => {
      const matchUser = mutuals.find(u => u.email === profile.email);

      return {
        userId: profile.userId.toString(),        // 👈  ADD THIS LINE
        _id: profile._id,                      //   (profile doc id – kept if you still need it)
        email: profile.email,
        name: profile.firstName || "Unknown",
        image: profile.profilePhoto
          ? `/uploads/${profile.profilePhoto}`
          : (profile.photos?.length
            ? `/uploads/${profile.photos.at(-1)}`
            : "/static/images/default-avatar.png"),
        destination: profile.location || "N/A",
        startDate: matchUser?.startDate || "2025‑07‑01",
        endDate: matchUser?.endDate || "2025‑07‑07",
        rating: profile.rating || 4.5,
        matchPercent: 70 + Math.floor(Math.random() * 20),
        interests: profile.interests || []
      };
    });

    res.json(merged);
  } catch (err) {
    console.error("🔥 /api/mutual-matches error:", err);
    res.status(500).json({ error: "Failed to fetch matches" });
  }
});

/* ------------------------------------------------------------------ *
 *  POST  /api/like   – register a “like” without touching itineraries
 * ------------------------------------------------------------------ */
app.post("/api/like", authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { targetEmail } = req.body;
    if (!targetEmail) return res.status(400).json({ message: "Missing targetEmail" });

    const me = await User.findOne({ email: userEmail });
    const target = await User.findOne({ email: targetEmail });
    if (!target) return res.status(404).json({ message: "Target user not found" });

    /* add the like (no duplicates) */
    if (!me.likes.includes(targetEmail)) {
      me.likes.push(targetEmail);
      await me.save();
    }

    /* check for match */
    const isMatch = target.likes.includes(userEmail);
    if (isMatch && !me.matches.includes(targetEmail)) {
      me.matches.push(targetEmail);
      target.matches.push(userEmail);
      await me.save();
      await target.save();
    }

    /* 🚫  NO itinerary deletion here any more */
    return res.json({ match: isMatch });
  } catch (err) {
    console.error("Like route error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ------------------------------------------------------------------ *
 *  POST  /api/dislike   – register a “dislike”  (no itinerary wipe)
 * ------------------------------------------------------------------ */
app.post("/api/dislike", authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const { targetEmail } = req.body;
    if (!targetEmail) return res.status(400).json({ message: "Missing targetEmail" });

    const me = await User.findOne({ email: userEmail });

    if (!me.dislikes.includes(targetEmail)) {
      me.dislikes.push(targetEmail);
      await me.save();
    }

    /* 🚫  NO itinerary deletion here either */
    return res.json({ message: "Disliked" });
  } catch (err) {
    console.error("Dislike route error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Also remove the itinerary of this user


app.get('/api/my-matches', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findOne({ email: req.user.email });
    if (!currentUser || !currentUser.matches.length) {
      return res.json([]);
    }
    // Get profile info of matched users
    const matchedProfiles = await Profile.find({
      email: { $in: currentUser.matches },
    });
    res.json(matchedProfiles);
  } catch (err) {
    console.error("My Matches error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
/* ----------------  GET conversation history  ---------------- */
app.get("/api/messages", authenticateToken, async (req, res) => {
  const me = req.user.email;
  const user2 = sanitizeText(req.query.user2);
  if (!user2) return res.status(400).json({ message: "Missing user2" });
  if (user2 === me) return res.status(400).json({ message: "Cannot query conversation with self" });

  try {
    const matched = await areUsersMatched(me, user2);
    if (!matched) return res.status(403).json({ message: "Only matched users can view chats" });

    const msgs = sortDocs(await Message.find({
      $or: [
        { sender: me, receiver: user2 },
        { sender: user2, receiver: me }
      ]
    }), { createdAt: 1 }).map((doc) => doc.toObject()); // chronological
    res.json(msgs);
  } catch (e) {
    console.error("Fetch messages error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

/* ----------------  POST new message (REST)  ---------------- */
app.post("/api/messages/send", authenticateToken, async (req, res) => {
  const receiver = sanitizeText(req.body?.receiver);
  const content = sanitizeText(req.body?.content);
  const sender = req.user.email;
  if (!receiver || !content) return res.status(400).json({ message: "receiver & content required" });
  if (sender === receiver) return res.status(400).json({ message: "Cannot message yourself" });

  /* confirm they are matched */
  const me = await User.findOne({ email: sender });
  if (!me || !Array.isArray(me.matches) || !me.matches.includes(receiver)) {
    return res.status(403).json({ message: "Only matched users can chat" });
  }

  try {
    const m = await Message.create({ sender, receiver, content });
    io.to(userRoom(sender)).to(userRoom(receiver)).emit("newMessage", m);
    res.status(201).json(m);
  } catch (e) {
    console.error("Send msg error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

/* ----------------  GET my distinct conversation list  ---------------- */
app.get("/api/messages/conversations", authenticateToken, async (req, res) => {
  const me = req.user.email;
  try {
    const msgs = await Message.find({ $or: [{ sender: me }, { receiver: me }] });
    const other = new Set();
    msgs.forEach(m => {
      if (m.sender !== me) other.add(m.sender);
      if (m.receiver !== me) other.add(m.receiver);
    });
    res.json({ users: [...other] });
  } catch (e) {
    console.error("Conversation list error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// 👤 Get Authenticated User Info
app.get("/api/me", authenticateToken, async (req, res) => {
  try {
    const email = req.user.email;
    const profile = await Profile.findOne({ email });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json({
      email: profile.email, // 👈 ADD THIS
      firstName: profile.firstName,
      profilePhoto: profile.profilePhoto ? `/uploads/${profile.profilePhoto}` : "/static/images/default-avatar.png"
    });

  } catch (err) {
    console.error("❌ Error fetching user profile:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.patch("/api/review/:id", authenticateToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    const reviewer = await User.findOne({ email: req.user.email });
    if (!reviewer || String(review.reviewer) !== String(reviewer._id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const { rating } = req.body;
    const comment = req.body?.comment !== undefined ? sanitizeText(req.body.comment) : undefined;
    review.rating = rating ?? review.rating;
    review.comment = comment ?? review.comment;
    await review.save();
    res.json({ message: "Review updated successfully" });
  } catch (err) {
    console.error("Edit review error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Alias to delete authenticated user via ID
app.delete("/api/user/:id", authenticateToken, async (req, res) => {
  try {
    const userIdFromToken = req.user.userId;
    const userIdFromParams = req.params.id;

    if (userIdFromToken !== userIdFromParams) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userIdFromParams);
    if (!user) return res.status(404).json({ message: "User not found" });

    const profile = await Profile.findOne({ email: user.email });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    // Delete profile photos from disk
    for (const photo of profile.photos) {
      const photoPath = path.join(__dirname, "uploads", photo);
      if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
    }

    await Profile.deleteOne({ email: user.email });
    await User.deleteOne({ email: user.email });

    res.json({ message: "✅ Profile and account deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting user:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/review/:id", authenticateToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found" });
    const reviewer = await User.findOne({ email: req.user.email });
    if (!reviewer || String(review.reviewer) !== String(reviewer._id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    await review.deleteOne();
    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    console.error("Delete review error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
app.post("/api/upload-photo", authenticateToken, upload.single("photo"), async (req, res) => {
  try {
    const profile = await Profile.findOne({ email: req.user.email });
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    profile.photos.push(req.file.filename);
    await profile.save();
    res.status(200).json({ message: "Photo added", filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ message: "Failed to upload photo" });
  }
});

// PATCH /api/user/:id/set-profile-photo
app.patch("/api/user/:id/set-profile-photo", authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const filename = sanitizeFilename(req.body?.filename);

    if (!isSelfRequest(req, userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const profile = await Profile.findOne({ userId: userId });
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    if (!filename || !profile.photos.includes(filename)) {
      return res.status(400).json({ message: "Photo not in user's gallery" });
    }

    profile.profilePhoto = filename;
    await profile.save();

    res.json({ message: "✅ Profile photo updated", profilePhoto: filename });
  } catch (err) {
    console.error("Set profile photo error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/user/:id/upload-photo", authenticateToken, upload.single("photo"), async (req, res) => {
  try {
    const userId = req.params.id;
    if (!isSelfRequest(req, userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const profile = await Profile.findOne({ userId: userId });

    if (!profile) return res.status(404).json({ message: "Profile not found" });

    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    profile.photos.push(req.file.filename);
    await profile.save();

    res.status(200).json({ message: "Photo uploaded", filename: req.file.filename });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/photo/:filename", authenticateToken, async (req, res) => {
  try {
    const profile = await Profile.findOne({ email: req.user.email });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const filename = sanitizeFilename(req.params.filename);
    if (!filename || !profile.photos.includes(filename)) {
      return res.status(400).json({ message: "Invalid photo" });
    }

    const filePath = path.join(uploadsDir, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    profile.photos = profile.photos.filter((p) => p !== filename);

    if (profile.profilePhoto === filename) profile.profilePhoto = "";

    await profile.save();
    res.json({ message: "Photo deleted" });
  } catch (err) {
    console.error("Delete photo error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✏️ PATCH - Edit Profile
app.patch("/api/profile/edit", authenticateToken, async (req, res) => {
  try {
    const email = req.user.email;
    const profile = await Profile.findOne({ email });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    const {
      firstName,
      dob_day,
      dob_month,
      dob_year,
      gender,
      showGender,
      interestedIn,
      travelType,
      interests,
    } = req.body;
    if (dob_day && dob_month && dob_year) {
      profile.dob = `${dob_year.padStart(4, '0')}-${dob_month.padStart(2, '0')}-${dob_day.padStart(2, '0')}`;
    }
    if (firstName) profile.firstName = sanitizeText(firstName);
    if (gender) profile.gender = sanitizeText(gender);
    if (typeof showGender !== "undefined") profile.showGender = showGender === "true" || showGender === true;
    if (interestedIn) profile.interestedIn = sanitizeText(interestedIn);
    if (travelType) profile.travelType = sanitizeText(travelType);
    if (interests) {
      profile.interests = sanitizeCsvToArray(interests);
    }
    await profile.save();
    res.json({ message: "Profile updated", profile });
  } catch (err) {
    console.error("Edit profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

//  DELETE - Delete Profile and User (optional)
app.delete("/api/profile/delete", authenticateToken, async (req, res) => {
  try {
    const email = req.user.email;
    const profile = await Profile.findOne({ email });
    const user = await User.findOne({ email });

    if (!profile) return res.status(404).json({ message: "Profile not found" });

    // Delete profile photos
    for (const photo of profile.photos) {
      const photoPath = path.join(__dirname, "uploads", photo);
      if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
    }

    await Profile.deleteOne({ email });
    if (user) await User.deleteOne({ email });

    res.json({ message: "✅ Profile (and user) deleted successfully" });
  } catch (err) {
    console.error("Delete profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.patch("/api/user/:id/delete-photo", authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const filename = sanitizeFilename(req.body?.filename);

    // ✅ Security Check: Ensure the token user matches the profile being edited
    if (!isSelfRequest(req, userId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const profile = await Profile.findOne({ userId: userId });
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    if (!filename || !profile.photos.includes(filename)) {
      return res.status(400).json({ message: "Invalid photo" });
    }

    const filePath = path.join(uploadsDir, filename);

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    profile.photos = profile.photos.filter(p => p !== filename);
    if (profile.profilePhoto === filename) profile.profilePhoto = "";

    await profile.save();
    res.json({ message: "Photo deleted" });
  } catch (err) {
    console.error("Delete photo by ID error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/itinerary/:id
app.delete("/api/itinerary/:id", authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const itinerary = await Itinerary.findById(id);

    if (!itinerary) return res.status(404).json({ message: "Not found" });
    const profile = await Profile.findOne({ email: req.user.email });
    if (!profile || String(itinerary.user) !== String(profile._id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await itinerary.deleteOne();
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Itinerary deletion error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// SPA fallback for frontend routes (excluding API/static/auth paths)
app.get(/^\/(?!api\/|auth\/|uploads\/|static\/).*/, serveFrontendEntry);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found: " + req.method + " " + req.url });
});

// ✅ Wrap Express app with HTTP server
const server = http.createServer(app);

// ✅ Initialize Socket.IO with the server
const io = new Server(server, {
  cors: {
    origin: "*", // you can restrict this in production
    methods: ["GET", "POST"]
  }
});

io.use((socket, next) => {
  const token = socket.handshake?.auth?.token;
  if (!token) return next(new Error("Unauthorized"));

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    socket.userEmail = payload.email;
    socket.userId = payload.userId;
    return next();
  } catch {
    return next(new Error("Unauthorized"));
  }
});

// ✅ Socket.IO logic
io.on("connection", (socket) => {
  if (!socket.userEmail) {
    socket.disconnect(true);
    return;
  }

  socket.join(userRoom(socket.userEmail));
  console.log("🔌 Socket connected:", socket.id, socket.userEmail);

  socket.on("sendMessage", async (msg = {}) => {
    try {
      const receiver = sanitizeText(msg.receiver);
      const content = sanitizeText(msg.content);
      const sender = socket.userEmail;
      if (!receiver || !content || sender === receiver) return;

      const matched = await areUsersMatched(sender, receiver);
      if (!matched) return;

      const newMsg = await Message.create({ sender, receiver, content });
      io.to(userRoom(sender)).to(userRoom(receiver)).emit("newMessage", newMsg);
    } catch (err) {
      console.error("❌ Socket message save error:", err);
    }
  });
});

// ✅ Start the server
server.listen(PORT, () => {
  console.log(`✅ Server + WebSocket running at http://localhost:${PORT}`);
});
