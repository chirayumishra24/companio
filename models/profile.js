import mongoose from "mongoose";

const profileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true, unique: true },
  firstName: String,
  dob: String,
  gender: String,
  showGender: Boolean,
  interestedIn: String,
  travelType: String,
  bio: String,
  location: String,
  socialLinks: {
    instagram: String,
    linkedin: String
  },
  interests:[String],
  photos: [String],
  profilePhoto: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Profile = mongoose.models.Profile || mongoose.model("Profile", profileSchema);

export default Profile;
