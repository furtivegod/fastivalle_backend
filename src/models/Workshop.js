/**
 * Workshop Model
 * Formation/workshops
 */

const mongoose = require('mongoose');

const workshopSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  instructor: { type: String, trim: true },
  startTime: { type: String },
  endTime: { type: String },
  location: { type: String, trim: true },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'] },
  capacity: { type: Number, default: 30 },
  enrolledCount: { type: Number, default: 0 },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

workshopSchema.index({ eventId: 1 });

module.exports = mongoose.model('Workshop', workshopSchema);
