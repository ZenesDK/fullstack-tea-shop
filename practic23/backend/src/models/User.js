const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  hashed_password: { type: String, required: true },
  role: { type: String, default: 'user', enum: ['user', 'seller', 'admin'] },
  is_blocked: { type: Boolean, default: false }
}, {
  timestamps: true // автоматически добавляет createdAt и updatedAt
});

module.exports = mongoose.model('User', userSchema);