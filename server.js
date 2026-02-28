import express from "express";
import path from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import bodyParser from "body-parser";
import cors from "cors";
import multer from "multer";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";
import fs from "fs";
import session from "express-session";
import passport from "passport";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import rateLimit from 'express-rate-limit';
import Joi from "joi";

// Schemas
import "./passport.js"; // OAuth config
import Itinerary from "./models/Itinerary.js";
import User from './models/User.js';
import Review from "./models/Review.js";
import Message from "./models/message.js";
import Profile from "./models/profile.js";
dotenv.config();
const app = express();
const PORT = 3000;
const JWT_SECRET = "e6ed40b0e717e6bf7326163fa6f2d7d56619e4f33a395849713d550777cdf52e";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/companio", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use("/static", express.static(path.join(__dirname, "static")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});
app.use(session({ secret: "your_session_secret", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
// Static Routes
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "templates", "index.html")));
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "templates", "login.html")));
app.get("/signup", (req, res) => res.sendFile(path.join(__dirname, "templates", "signup.html")));
app.get("/matches", (req, res) => res.sendFile(path.join(__dirname, "templates", "matches.html")));
app.get("/profile-setup", (req, res) => res.sendFile(path.join(__dirname, "templates", "profile-setup.html")));
app.get("/set-password", (req, res) => {
  res.sendFile(path.join(__dirname, "templates", "set-password.html"))
});
app.get("/itinerary-form", (req, res) => {
  res.sendFile(path.join(__dirname, "templates", "itinerary-form.html"))
});
app.get("/profile", (req, res) => {
  res.sendFile(path.join(__dirname, "templates", "profile.html"))
});
app.get("/messages", (req, res) => {
  res.sendFile(path.join(__dirname, "templates", "messages.html"));
});
app.get("/matches-list", (req, res) => {
  res.sendFile(path.join(__dirname, "templates", "matches-list.html"));
});
app.get("/view-profile", (req, res) => {
  res.sendFile(path.join(__dirname, "templates", "viewProfile.html"));
});

// Google OAuth
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get("/auth/logout", (req, res) => {
  req.logout(() => res.redirect("http://localhost:5175/login"));
});
app.get("/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false
  }),
  async (req, res) => {
    const token = jwt.sign(
      { userId: req.user._id, email: req.user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const profile = await Profile.findOne({ email: req.user.email });

    if (!req.user.passwordHash) {
      return res.redirect(`http://localhost:5175/set-password?token=${token}`);
    }

    if (!profile) {
      return res.redirect(`http://localhost:5175/profile-setup?token=${token}`);
    }

    // ✅ Redirect to matches with token
    res.redirect(`http://localhost:5175/matches?token=${token}`);
  }
);

app.get('/login-success', (req, res) => {
  const token = req.query.token;
  if (token) return res.redirect(`http://localhost:5175/login?token=${token}`);
  return res.redirect('http://localhost:5175/login?error=missing_token');
});
// JWT Middleware (updated with better logging)
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    console.log("❌ Missing authorization header");
    return res.status(401).json({ message: "Missing authorization header" });
  }

  const token = authHeader.split(' ')[1]; // expecting "Bearer <token>"

  if (!token) {
    console.log("❌ Token missing after Bearer keyword");
    return res.status(401).json({ message: "Token missing after Bearer" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log("❌ Invalid or expired token:", err.message);
      return res.status(403).json({ message: "Invalid or expired token" });
    }

    console.log("✅ Token verified. User:", user.email || user.id || user);
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

const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

// ✅ Auth: Signup
app.post('/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required." });
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
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    if (!user.passwordHash) {
      return res.status(400).json({
        message: "This account doesn't have a password set. Please log in using Google first or set a password."
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
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: "Password is required" });
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: "User not found" });
    user.passwordHash = await bcrypt.hash(password, 10);
    await user.save();
    res.status(200).json({ message: "Password set successfully" });
  } catch (err) {
    console.error("Set password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
app.post('/auth/get-token', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '15m' });
    res.status(200).json({ token });
  } catch (err) {
    console.error("Token generation error:", err);
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
    const dir = path.join(__dirname, "uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
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
      firstName,
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
      instagram: req.body["socialLinks[instagram]"] || "",
      linkedin: req.body["socialLinks[linkedin]"] || ""
    };

    // Final profile data
    const profileData = {
      userId: req.user.userId,
      email,
      firstName,
      dob,
      gender,
      showGender: showGender === "on" || showGender === true,
      interestedIn,
      travelType,
      interests: Array.isArray(interests) ? interests : interests.split(',').map(s => s.trim()),
      photos,
      bio,
      location,
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
  const profile = await Profile.findOne({ email: req.user.email });
  const { destination, description, startDate, endDate, interests } = req.body;
  const itinerary = new Itinerary({
    user: profile._id,
    destination,
    description,
    startDate,
    endDate,
    interests: interests.split(',').map(i => i.trim()),
  });
  await itinerary.save();
  res.redirect('/itineraries');
});
app.get('/itinerary-form', authenticateToken, async (req, res) => {
  const query = {};
  if (req.query.destination) {
    query.destination = new RegExp(req.query.destination, 'i'); // Case-insensitive search
  }
  const allItineraries = await Itinerary.find(query).populate('user');
  res.render('itinerary-form.html', { itineraries: allItineraries });
});
app.post('/api/itinerary', authenticateToken, async (req, res) => {
  try {
    const user = await Profile.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: "User profile not found" });
    const { destination, startDate, endDate, interests, travelType, budget, description } = req.body;
    const newItinerary = new Itinerary({
      user: user._id,
      destination,
      startDate,
      endDate,
      interests: interests.split(',').map(i => i.trim()),
      travelType,
      budget,
      description,
    });
    await newItinerary.save();
    res.status(201).json({ message: "Itinerary saved!" });
  } catch (err) {
    console.error("Itinerary save error:", err);
    res.status(500).json({ message: "Server error" });
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

    const itineraries = await Itinerary.find(query)
      .populate("user")
      .sort({ createdAt: -1 })
      .limit(20);

    const filtered = itineraries.filter(it => !dislikedEmails.includes(it.user.email));
    res.json(filtered);
  } catch (err) {
    console.error("Error fetching itineraries:", err);
    res.status(500).json({ message: "Server error" });
  }
});


app.get("/api/user/:id", async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.params.id }).lean();
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const itineraries = await Itinerary.find({ user: profile._id }).sort({ createdAt: -1 }).lean();

    const reviewsRaw = await Review.find({ target: profile._id })
      .populate("reviewer", "email")
      .sort({ createdAt: -1 })
      .lean();

    const reviews = reviewsRaw.map(r => ({
      reviewerName: r.reviewer?.email || "Anonymous",
      rating: r.rating,
      comment: r.comment,
      date: r.createdAt,
    }));

    res.json({ profile, itineraries, reviews });
  } catch (err) {
    console.error("User profile fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.patch("/api/user/:id", async (req, res) => {
  try {
    const { profilePhoto, ...rest } = req.body;

    const profile = await Profile.findOne({ userId: req.params.id });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Update other profile fields
    Object.assign(profile, rest);

    // 🔥 Explicitly update profilePhoto if it's present
    if (profilePhoto && profile.photos.includes(profilePhoto)) {
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
    const profile = await Profile.findById(req.params.id).lean();
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json({ profile });
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

    const { rating, comment } = req.body;
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

    const alreadyLiked = currentUser.likes || [];
    const alreadyDisliked = currentUser.dislikes || [];

    const profiles = await Profile.find({
      email: {
        $ne: userEmail,
        $nin: [...alreadyLiked, ...alreadyDisliked]
      }
    }).lean();

    console.log("🧠 Profiles found:", profiles.length);

    const enriched = await Promise.all(
      profiles.map(async (profile) => {
        const itinerary = await Itinerary.findOne({ user: profile._id }).lean();

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
  const { user1, user2 } = req.query;
  if (!user1 || !user2) return res.status(400).json({ message: "Missing params" });

  try {
    const msgs = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 }
      ]
    }).sort({ createdAt: 1 });     // chronological
    res.json(msgs);
  } catch (e) {
    console.error("Fetch messages error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

/* ----------------  POST new message (REST)  ---------------- */
app.post("/api/messages/send", authenticateToken, async (req, res) => {
  const { receiver, content } = req.body;
  const sender = req.user.email;
  if (!receiver || !content) return res.status(400).json({ message: "receiver & content required" });
  if (sender === receiver) return res.status(400).json({ message: "Cannot message yourself" });

  /* confirm they are matched */
  const me = await User.findOne({ email: sender });
  if (!me.matches.includes(receiver))
    return res.status(403).json({ message: "Only matched users can chat" });

  try {
    const m = await Message.create({ sender, receiver, content, createdAt: new Date() });
    io.emit("newMessage", m);              // push via socket, too
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
    if (!review.reviewer.equals(reviewer._id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const { rating, comment } = req.body;
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
    if (!review.reviewer.equals(reviewer._id)) {
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
  const userId = req.params.id;
  const { filename } = req.body;

  // 🔐 Secure: Match ID from token with ID in URL
  if (req.user.userId !== userId) {
    return res.status(403).json({ message: "Unauthorized" });
  }
  const profile = await Profile.findOne({ userId: new mongoose.Types.ObjectId(userId) });
  if (!profile) return res.status(404).json({ message: "Profile not found" });

  if (!profile.photos.includes(filename)) {
    return res.status(400).json({ message: "Photo not in user's gallery" });
  }

  profile.profilePhoto = filename;
  await profile.save();

  res.json({ message: "✅ Profile photo updated", profilePhoto: filename });
});

app.post("/api/user/:id/upload-photo", authenticateToken, upload.single("photo"), async (req, res) => {
  try {
    const userId = req.params.id;
    const profile = await Profile.findOne({ userId });

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
  const profile = await Profile.findOne({ email: req.user.email });

  const filename = req.params.filename;
  const filePath = path.join(__dirname, "uploads", filename);

  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  profile.photos = profile.photos.filter(p => p !== filename);

  if (profile.profilePhoto === filename) profile.profilePhoto = "";

  await profile.save();
  res.json({ message: "Photo deleted" });
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
    if (firstName) profile.firstName = firstName;
    if (gender) profile.gender = gender;
    if (typeof showGender !== "undefined") profile.showGender = showGender === "true" || showGender === true;
    if (interestedIn) profile.interestedIn = interestedIn;
    if (travelType) profile.travelType = travelType;
    if (interests) {
      profile.interests = Array.isArray(interests)
        ? interests
        : interests.split(",").map((i) => i.trim());
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
    const { filename } = req.body;

    // ✅ Security Check: Ensure the token user matches the profile being edited
    if (req.user.userId !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const profile = await Profile.findOne({ userId });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const filePath = path.join(__dirname, "uploads", filename);

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

    await itinerary.deleteOne();
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Itinerary deletion error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

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

// ✅ Socket.IO logic
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  socket.on("sendMessage", async (msg) => {
    try {
      const newMsg = new Message(msg);
      await newMsg.save();
      io.emit("newMessage", newMsg); // broadcast to all
    } catch (err) {
      console.error("❌ Socket message save error:", err);
    }
  });
});

// ✅ Start the server
server.listen(PORT, () => {
  console.log(`✅ Server + WebSocket running at http://localhost:${PORT}`);
});
