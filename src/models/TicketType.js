/**
 * TicketType Model
 * Standard, Fan, VIP per event
 */

const mongoose = require('mongoose');

const ticketTypeSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  description: { type: String },
  category: { type: String, enum: ['general', 'group'], default: 'general' },
  ticketType: { type: String, enum: ['standard', 'fan', 'vip'], default: 'standard' },
  maxPerUser: { type: Number, default: 5 },
  minForGroup: { type: Number },
  maxForGroup: { type: Number },
  soldOut: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

ticketTypeSchema.index({ eventId: 1 });

module.exports = mongoose.model('TicketType', ticketTypeSchema);
