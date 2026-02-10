/**
 * OTP Controller
 * 
 * Handles phone OTP generation, sending, and verification.
 * Note: In production, integrate with Twilio, AWS SNS, or similar SMS service.
 */

const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// OTP expiration time (5 minutes)
const OTP_EXPIRY_MINUTES = 5;
const MAX_OTP_ATTEMPTS = 5;

/**
 * Send OTP to phone number
 * POST /api/otp/send
 * Body: { phone: string, type: 'signup' | 'login' }
 */
const sendOTP = async (req, res) => {
  try {
    const { phone, type } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
      });
    }

    // Normalize phone number
    const normalizedPhone = phone.replace(/\s/g, '');

    // Check if user exists
    let user = await User.findOne({ phone: normalizedPhone }).select('+otp.code +otp.expiresAt +otp.attempts');

    if (type === 'signup') {
      // For signup, user should NOT exist
      if (user && user.isVerified) {
        return res.status(400).json({
          success: false,
          error: 'Phone number already registered. Please login instead.',
        });
      }
      
      // Create temporary user if doesn't exist
      if (!user) {
        user = new User({
          phone: normalizedPhone,
          authProvider: 'local',
          isVerified: false,
        });
      }
    } else if (type === 'login') {
      // For login, user MUST exist
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Phone number not registered. Please sign up first.',
        });
      }
    }

    // Check if OTP was recently sent (rate limiting - 1 minute)
    if (user.otp?.expiresAt && user.otp.expiresAt > new Date()) {
      const timeLeft = Math.ceil((user.otp.expiresAt - new Date()) / 1000);
      if (timeLeft > (OTP_EXPIRY_MINUTES - 1) * 60) {
        return res.status(429).json({
          success: false,
          error: 'OTP already sent. Please wait before requesting again.',
          retryAfter: timeLeft - (OTP_EXPIRY_MINUTES - 1) * 60,
        });
      }
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Save OTP to user
    user.otp = {
      code: otp,
      expiresAt: expiresAt,
      attempts: 0,
    };
    await user.save();

    // TODO: In production, send OTP via SMS service (Twilio, AWS SNS, etc.)
    // For development, we'll log the OTP
    console.log(`[DEV] OTP for ${normalizedPhone}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      expiresIn: OTP_EXPIRY_MINUTES * 60, // seconds
      // Remove in production - only for development testing
      ...(process.env.NODE_ENV === 'development' && { devOtp: otp }),
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP',
    });
  }
};

/**
 * Verify OTP and authenticate user
 * POST /api/otp/verify
 * Body: { phone: string, otp: string, type: 'signup' | 'login', name?: string }
 */
const verifyOTP = async (req, res) => {
  try {
    const { phone, otp, type, name, password } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and OTP are required',
      });
    }

    // Normalize phone number
    const normalizedPhone = phone.replace(/\s/g, '');

    // Find user with OTP fields
    const user = await User.findOne({ phone: normalizedPhone })
      .select('+otp.code +otp.expiresAt +otp.attempts +password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Check if OTP exists
    if (!user.otp?.code) {
      return res.status(400).json({
        success: false,
        error: 'No OTP requested. Please request a new OTP.',
      });
    }

    // Check if OTP expired
    if (user.otp.expiresAt < new Date()) {
      user.otp = undefined;
      await user.save();
      return res.status(400).json({
        success: false,
        error: 'OTP expired. Please request a new one.',
      });
    }

    // Check max attempts
    if (user.otp.attempts >= MAX_OTP_ATTEMPTS) {
      user.otp = undefined;
      await user.save();
      return res.status(429).json({
        success: false,
        error: 'Too many attempts. Please request a new OTP.',
      });
    }

    // Verify OTP
    if (user.otp.code !== otp) {
      user.otp.attempts += 1;
      await user.save();
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP',
        attemptsRemaining: MAX_OTP_ATTEMPTS - user.otp.attempts,
      });
    }

    // OTP verified successfully
    user.otp = undefined; // Clear OTP
    user.isVerified = true;

    // Set name if provided (for signup)
    if (name && type === 'signup') {
      user.name = name;
    }

    // Set password if provided (for signup)
    if (password && type === 'signup') {
      user.password = password;
    }

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
    );

    res.json({
      success: true,
      message: type === 'signup' ? 'Phone verified and account created' : 'Login successful',
      token,
      user: user.toJSON(),
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP',
    });
  }
};

/**
 * Resend OTP
 * POST /api/otp/resend
 * Body: { phone: string, type: 'signup' | 'login' }
 */
const resendOTP = async (req, res) => {
  // Reuse sendOTP logic
  return sendOTP(req, res);
};

module.exports = {
  sendOTP,
  verifyOTP,
  resendOTP,
};
