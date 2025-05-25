const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("static"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(session({
  secret: "travelSecret",
  resave: false,
  saveUninitialized: true,
}));

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/travelFinder", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  age: Number,
  gender: String,
  destination: String,
  startDate: Date,
  endDate: Date,
  interests: [String],
  photo: String,
  likes: [String],
  matches: [String],
});

const User = mongoose.model("User", userSchema);

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Auth middleware
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// Routes
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ name, email, password: hashedPassword });
  await newUser.save();
  res.json({ message: "Registered successfully" });
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates/dashboard.html'));
});


app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid email" });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: "Invalid password" });
  req.session.userId = user._id;
  res.json({ message: "Login successful" });
});

app.post("/profile", requireLogin, async (req, res) => {
  const updates = req.body;
  if (updates.interests) updates.interests = updates.interests.split(",").map(i => i.trim());
  if (updates.startDate) updates.startDate = new Date(updates.startDate);
  if (updates.endDate) updates.endDate = new Date(updates.endDate);
  const user = await User.findByIdAndUpdate(req.session.userId, updates, { new: true });
  res.json(user);
});

app.get("/profile/:userId", requireLogin, async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

app.get("/companions", requireLogin, async (req, res) => {
  const { destination, startDate, endDate, interests } = req.query;
  const query = { _id: { $ne: req.session.userId } };

  if (destination) query.destination = { $regex: destination, $options: "i" };
  if (startDate || endDate) {
    query.$and = [];
    if (startDate) query.$and.push({ endDate: { $gte: new Date(startDate) } });
    if (endDate) query.$and.push({ startDate: { $lte: new Date(endDate) } });
  }
  if (interests) {
    const interestArr = interests.split(",").map(i => i.trim());
    query.interests = { $in: interestArr };
  }

  const users = await User.find(query);
  res.json(users);
});

app.post("/like", requireLogin, async (req, res) => {
  const likedUserId = req.body.userId;
  const user = await User.findById(req.session.userId);
  const likedUser = await User.findById(likedUserId);

  if (!user.likes.includes(likedUserId)) {
    user.likes.push(likedUserId);
    if (likedUser.likes.includes(String(user._id))) {
      user.matches.push(likedUserId);
      likedUser.matches.push(user._id);
    }
    await user.save();
    await likedUser.save();
  }
  res.json({ message: "Like processed" });
});

app.post("/upload-photo", requireLogin, upload.single("photo"), async (req, res) => {
  const photoPath = `/uploads/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(req.session.userId, { photo: photoPath }, { new: true });
  res.json({ message: "Photo uploaded", photo: user.photo });
});

const stringSimilarity = require('string-similarity'); // npm install string-similarity

app.post('/find-matches', async (req, res) => {
  const { destination, startDate, endDate, interests } = req.body;
  const userInterests = interests.map(i => i.toLowerCase());

  const users = await db.collection('users').find({
    destination,
    travelDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
  }).toArray();

  const matches = users.map(user => {
    const otherInterests = user.interests.map(i => i.toLowerCase());

    // Fuzzy compare each interest
    let matchScore = 0;
    userInterests.forEach(interest => {
      const bestMatch = stringSimilarity.findBestMatch(interest, otherInterests);
      matchScore += bestMatch.bestMatch.rating;
    });

    const compatibility = ((matchScore / userInterests.length) * 100).toFixed(1);

    return {
      ...user,
      compatibility: parseFloat(compatibility)
    };
  });

  // Sort by compatibility (desc) or travel date (asc)
  const sortedMatches = matches.sort((a, b) => {
    // First try by compatibility
    if (b.compatibility !== a.compatibility) {
      return b.compatibility - a.compatibility;
    }
    // If equal, sort by earliest travel date
    return new Date(a.travelDate) - new Date(b.travelDate);
  });

  res.render('matches.html', { matches: sortedMatches });
});


app.get('/users', async (req, res) => {
  try {
    const users = await User.find();

    res.json(users.map(user => ({
      _id: user._id,
      name: user.name,
      gender: user.gender,
      destination: user.destination,
      interests: user.interests,
      photo: user.photo
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching users' });
  }
});  

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});