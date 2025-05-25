const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String, // hashed
  name: String,
  gender: String,
  destination: String,
  travelStart: Date,
  travelEnd: Date,
  interests: [String],
  photo: String,
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  matches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model('User', userSchema);
