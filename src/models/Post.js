/**
 * Post Model
 * User-generated content for events
 */

const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  content: { type: String, required: true },
  mediaUrls: [{ type: String }],
  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
}, { timestamps: true });

postSchema.index({ eventId: 1 });
postSchema.index({ userId: 1 });

module.exports = mongoose.model('Post', postSchema);
