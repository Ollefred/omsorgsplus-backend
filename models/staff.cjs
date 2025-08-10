// models/Staff.cjs
const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
  name: String,
  role: String,
  experience: Number,
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  ratings: { type: [Number], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Staff', StaffSchema);
