/**
 * User Model
 * 
 * Defines the structure of user data in MongoDB.
 * Supports email/phone + password login, plus Google and Apple Sign-In.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Info
  email: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values (for phone-only users)
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values (for email-only users)
    trim: true,
  },
  password: {
    type: String,
    minlength: 6,
    select: false, // Don't include password in queries by default
  },
  
  // Profile
  name: {
    type: String,
    trim: true,
  },
  profileImage: {
    type: String,
  },
  dateOfBirth: {
    type: Date,
  },
  bio: {
    type: String,
    maxlength: 500,
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  
  // Social Login IDs
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  appleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  
  // Auth Provider - tracks how user registered
  authProvider: {
    type: String,
    enum: ['local', 'google', 'apple'],
    default: 'local',
  },
  
  // Account Status
  isVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // OTP for phone verification
  otp: {
    code: {
      type: String,
      select: false,
    },
    expiresAt: {
      type: Date,
      select: false,
    },
    attempts: {
      type: Number,
      default: 0,
      select: false,
    },
  },
  
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ appleId: 1 });

/**
 * Hash password before saving
 * This runs automatically when you save a user with a new/changed password
 */
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Compare entered password with hashed password in database
 * Usage: const isMatch = await user.comparePassword('entered-password');
 */
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Return user data without sensitive fields
 */
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

module.exports = mongoose.model('User', userSchema);
