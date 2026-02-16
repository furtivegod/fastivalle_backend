/**
 * Order Model
 * Ticket purchases
 */

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  orderNumber: { type: String, required: true, unique: true },
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  subtotal: { type: Number },
  platformFee: { type: Number, default: 0 },
  processingFee: { type: Number, default: 0 },
  donationAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'completed', 'cancelled', 'refunded'], default: 'pending' },
  paymentMethod: { type: String, enum: ['apple_pay', 'card', 'other'] },
  paymentDetails: { type: mongoose.Schema.Types.Mixed },
  purchasedAt: { type: Date },
  refundedAt: { type: Date },
}, { timestamps: true });

orderSchema.index({ userId: 1 });
orderSchema.index({ eventId: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);
