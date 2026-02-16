/**
 * Product Model
 * Merch items
 */

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  category: { type: String, trim: true },
  image: { type: String },
  inStock: { type: Boolean, default: true },
  description: { type: String },
  tag: { type: String }, // NEW IN, LIMITED
  tagColor: { type: String },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

productSchema.index({ category: 1 });

module.exports = mongoose.model('Product', productSchema);
