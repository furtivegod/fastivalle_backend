/**
 * EventArtist Model
 * Artists performing at events
 */

const mongoose = require('mongoose');

const eventArtistSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  artistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist', required: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

eventArtistSchema.index({ eventId: 1, artistId: 1 }, { unique: true });
eventArtistSchema.index({ eventId: 1 });

module.exports = mongoose.model('EventArtist', eventArtistSchema);
