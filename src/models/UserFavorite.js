/**
 * UserFavorite Model
 * My Events - saved/favorited events
 */

const mongoose = require('mongoose');

const userFavoriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
}, { timestamps: true });

userFavoriteSchema.index({ userId: 1, eventId: 1 }, { unique: true });
userFavoriteSchema.index({ userId: 1 });

module.exports = mongoose.model('UserFavorite', userFavoriteSchema);
