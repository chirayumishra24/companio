const mongoose = require('mongoose');

const authUserSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String
});

module.exports = mongoose.model('AuthUser', authUserSchema);
