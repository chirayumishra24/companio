import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: String,
  likes: [String],
  dislikes: [String ], // Store email of disliked profiles
  matches: [String]
});

export default mongoose.model("User", userSchema);
