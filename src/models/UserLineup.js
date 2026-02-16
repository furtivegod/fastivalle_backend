/**
 * UserLineup Model
 * Personal lineup per event
 */

const mongoose = require('mongoose');

const userLineupSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
}, { timestamps: true });

userLineupSchema.index({ userId: 1, eventId: 1 }, { unique: true });
userLineupSchema.index({ userId: 1 });

module.exports = mongoose.model('UserLineup', userLineupSchema);
