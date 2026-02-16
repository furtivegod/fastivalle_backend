/**
 * Event Model
 * Festivals, concerts, worship nights, etc.
 */

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subtitle: { type: String, trim: true },
  description: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  startTime: { type: String },
  venue: { type: String, trim: true },
  address: { type: String, trim: true },
  coverImage: { type: String },
  coverColor: { type: String, default: '#E87D2B' }, // For ticket background
  isTopLevel: { type: Boolean, default: false }, // Festival vs sub-event
  isPrivate: { type: Boolean, default: false },
  status: { type: String, enum: ['draft', 'published', 'cancelled'], default: 'published' },
  attendeesCount: { type: Number, default: 0 },
}, { timestamps: true });

eventSchema.index({ startDate: 1 });
eventSchema.index({ status: 1 });

module.exports = mongoose.model('Event', eventSchema);
