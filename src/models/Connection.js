/**
 * Connection Model
 * Friends/connections for Connect tab and group ticket sharing
 */

const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  friendId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted'], default: 'accepted' },
}, { timestamps: true });

connectionSchema.index({ userId: 1, friendId: 1 }, { unique: true });
connectionSchema.index({ userId: 1 });
connectionSchema.index({ friendId: 1 });

module.exports = mongoose.model('Connection', connectionSchema);
