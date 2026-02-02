/**
 * Authentication Controller
 * 
 * Handles user registration, login, and social authentication.
 */

const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

/**
 * Register new user with email/phone and password
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { email, phone, password, name } = req.body;
    
    // Validation
    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email or phone number',
      });
    }
    
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters',
      });
    }
    
    // Check if user already exists
    const existingQuery = [];
    if (email) existingQuery.push({ email: email.toLowerCase() });
    if (phone) existingQuery.push({ phone });
    
    const existingUser = await User.findOne({ $or: existingQuery });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email or phone',
      });
    }
    
    // Create user
    const user = await User.create({
      email: email?.toLowerCase(),
      phone,
      password,
      name,
      authProvider: 'local',
    });
    
    // Generate token
    const token = generateToken(user._id);
    
    res.status(201).json({
      success: true,
      data: {
        user,
        token,
      },
    });
    
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
    });
  }
};

/**
 * Login with email/phone and password
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    
    // Validation
    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email or phone number',
      });
    }
    
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide password',
      });
    }
    
    // Find user (include password for comparison)
    const query = email ? { email: email.toLowerCase() } : { phone };
    const user = await User.findOne(query).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }
    
    // Check if user registered with social login
    if (!user.password) {
      return res.status(401).json({
        success: false,
        error: `Please login with ${user.authProvider}`,
      });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }
    
    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated',
      });
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    res.json({
      success: true,
      data: {
        user,
        token,
      },
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
};

/**
 * Google Sign-In
 * POST /api/auth/google
 * 
 * Mobile app sends the Google ID token after user signs in with Google.
 * We verify the token and create/login the user.
 */
const googleSignIn = async (req, res) => {
  try {
    const { idToken, googleId, email, name, profileImage } = req.body;
    
    // In production, you should verify the idToken with Google
    // For now, we trust the data from the mobile app
    // TODO: Add Google token verification for production
    
    if (!googleId || !email) {
      return res.status(400).json({
        success: false,
        error: 'Google ID and email are required',
      });
    }
    
    // Check if user exists with this Google ID
    let user = await User.findOne({ googleId });
    
    if (!user) {
      // Check if email already exists
      user = await User.findOne({ email: email.toLowerCase() });
      
      if (user) {
        // Link Google account to existing user
        user.googleId = googleId;
        if (!user.name && name) user.name = name;
        if (!user.profileImage && profileImage) user.profileImage = profileImage;
        await user.save();
      } else {
        // Create new user
        user = await User.create({
          googleId,
          email: email.toLowerCase(),
          name,
          profileImage,
          authProvider: 'google',
          isVerified: true, // Google verified the email
        });
      }
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated',
      });
    }
    
    const token = generateToken(user._id);
    
    res.json({
      success: true,
      data: {
        user,
        token,
      },
    });
    
  } catch (error) {
    console.error('Google sign-in error:', error);
    res.status(500).json({
      success: false,
      error: 'Google sign-in failed',
    });
  }
};

/**
 * Apple Sign-In
 * POST /api/auth/apple
 * 
 * Mobile app sends the Apple identity token after user signs in with Apple.
 * Note: Apple only provides email on first sign-in!
 */
const appleSignIn = async (req, res) => {
  try {
    const { identityToken, appleId, email, name } = req.body;
    
    // In production, you should verify the identityToken with Apple
    // TODO: Add Apple token verification for production
    
    if (!appleId) {
      return res.status(400).json({
        success: false,
        error: 'Apple ID is required',
      });
    }
    
    // Check if user exists with this Apple ID
    let user = await User.findOne({ appleId });
    
    if (!user) {
      // Check if email exists (email is only provided on first sign-in)
      if (email) {
        user = await User.findOne({ email: email.toLowerCase() });
        
        if (user) {
          // Link Apple account to existing user
          user.appleId = appleId;
          if (!user.name && name) user.name = name;
          await user.save();
        }
      }
      
      if (!user) {
        // Create new user
        user = await User.create({
          appleId,
          email: email?.toLowerCase(),
          name,
          authProvider: 'apple',
          isVerified: true, // Apple verified the user
        });
      }
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated',
      });
    }
    
    const token = generateToken(user._id);
    
    res.json({
      success: true,
      data: {
        user,
        token,
      },
    });
    
  } catch (error) {
    console.error('Apple sign-in error:', error);
    res.status(500).json({
      success: false,
      error: 'Apple sign-in failed',
    });
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 * Requires: Bearer token
 */
const getMe = async (req, res) => {
  res.json({
    success: true,
    data: req.user,
  });
};

/**
 * Update current user profile
 * PUT /api/auth/me
 * Requires: Bearer token
 */
const updateMe = async (req, res) => {
  try {
    const { name, phone, profileImage } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (profileImage) user.profileImage = profileImage;
    
    await user.save();
    
    res.json({
      success: true,
      data: user,
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
    });
  }
};

module.exports = {
  register,
  login,
  googleSignIn,
  appleSignIn,
  getMe,
  updateMe,
};
