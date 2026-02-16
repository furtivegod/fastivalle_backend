/**
 * Ticket Model
 * Individual tickets (1 per person for group purchases)
 */

const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  orderItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderItem', required: true },
  ticketNumber: { type: String },
  status: { type: String, enum: ['valid', 'used', 'cancelled'], default: 'valid' },
  assignedToUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  qrCode: { type: String },
  usedAt: { type: Date },
}, { timestamps: true });

ticketSchema.index({ orderItemId: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ assignedToUserId: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
