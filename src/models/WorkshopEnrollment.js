/**
 * WorkshopEnrollment Model
 */

const mongoose = require('mongoose');

const workshopEnrollmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workshopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop', required: true },
}, { timestamps: true });

workshopEnrollmentSchema.index({ userId: 1, workshopId: 1 }, { unique: true });

module.exports = mongoose.model('WorkshopEnrollment', workshopEnrollmentSchema);
