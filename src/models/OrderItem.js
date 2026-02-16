/**
 * OrderItem Model
 * Ticket line items in an order
 */

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  ticketTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'TicketType', required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  category: { type: String, enum: ['general', 'group'], default: 'general' },
  ticketTypeName: { type: String },
}, { timestamps: true });

orderItemSchema.index({ orderId: 1 });

module.exports = mongoose.model('OrderItem', orderItemSchema);
