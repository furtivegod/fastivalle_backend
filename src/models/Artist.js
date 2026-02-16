/**
 * Artist Model
 */

const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  bio: { type: String },
  profileImage: { type: String },
  albumCover: { type: String },
  albumTitle: { type: String },
  albumYear: { type: String },
  streamingUrl: { type: String },
  instagramUrl: { type: String },
  facebookUrl: { type: String },
  youtubeUrl: { type: String },
  spotifyUrl: { type: String },
}, { timestamps: true });

artistSchema.index({ name: 1 });

module.exports = mongoose.model('Artist', artistSchema);
