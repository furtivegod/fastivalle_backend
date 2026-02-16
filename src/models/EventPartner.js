/**
 * EventPartner Model
 * Events ↔ Partners junction
 */

const mongoose = require('mongoose');

const eventPartnerSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

eventPartnerSchema.index({ eventId: 1, partnerId: 1 }, { unique: true });

module.exports = mongoose.model('EventPartner', eventPartnerSchema);
