const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  user_id: { type: String, required: true } // Важно: имя поля user_id
}, {
  timestamps: true
});

module.exports = mongoose.model('RefreshToken', tokenSchema);