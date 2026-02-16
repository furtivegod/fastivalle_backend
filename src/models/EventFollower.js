/**
 * EventFollower Model
 * Users who followed an event (public profiles only for display)
 */

const mongoose = require('mongoose');

const eventFollowerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
}, { timestamps: true });

eventFollowerSchema.index({ userId: 1, eventId: 1 }, { unique: true });
eventFollowerSchema.index({ eventId: 1 });

module.exports = mongoose.model('EventFollower', eventFollowerSchema);
