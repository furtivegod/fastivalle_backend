/**
 * EventSession Model
 * Individual lineup sessions within an event (artist at stage, time)
 */

const mongoose = require('mongoose');

const eventSessionSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  stage: { type: String, required: true, trim: true },
  artistName: { type: String, required: true, trim: true },
  artistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist' },
  startTime: { type: String, required: true },
  endTime: { type: String },
  day: { type: String }, // For multi-day: "Aug 15", "Aug 16"
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

eventSessionSchema.index({ eventId: 1 });
eventSessionSchema.index({ eventId: 1, day: 1 });

module.exports = mongoose.model('EventSession', eventSessionSchema);
