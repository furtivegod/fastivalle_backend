/**
 * LineupItem Model
 * Sessions added to user's lineup
 */

const mongoose = require('mongoose');

const lineupItemSchema = new mongoose.Schema({
  lineupId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserLineup', required: true },
  eventSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'EventSession', required: true },
}, { timestamps: true });

lineupItemSchema.index({ lineupId: 1, eventSessionId: 1 }, { unique: true });
lineupItemSchema.index({ lineupId: 1 });

module.exports = mongoose.model('LineupItem', lineupItemSchema);
