/**
 * Authentication Controller
 * 
 * Handles user registration, login, and social authentication.
 */

const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { verifyGoogleToken, verifyAppleIdToken } = require('../utils/verifySocialToken');

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
 * Send either:
 * - idToken: from Google Sign-In (verified on server when GOOGLE_CLIENT_ID is set)
 * - Or googleId + email (and optionally name, profileImage) for dev without verification
 */
const googleSignIn = async (req, res) => {
  try {
    const { idToken, googleId: bodyGoogleId, email: bodyEmail, name: bodyName, profileImage: bodyProfileImage } = req.body;

    let googleId = bodyGoogleId;
    let email = bodyEmail;
    let name = bodyName;
    let profileImage = bodyProfileImage;

    if (idToken) {
      try {
        const payload = await verifyGoogleToken(idToken);
        if (payload) {
          googleId = payload.sub;
          email = payload.email || email;
          name = name || payload.name;
          profileImage = profileImage || payload.picture;
        }
      } catch (err) {
        return res.status(401).json({ success: false, error: err.message || 'Invalid Google token' });
      }
    }

    if (!googleId || !email) {
      return res.status(400).json({
        success: false,
        error: process.env.GOOGLE_CLIENT_ID
          ? 'Google idToken is required (or provide googleId and email for dev)'
          : 'Google ID and email are required',
      });
    }

    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.findOne({ email: email.toLowerCase() });

      if (user) {
        user.googleId = googleId;
        if (!user.name && name) user.name = name;
        if (!user.profileImage && profileImage) user.profileImage = profileImage;
        await user.save();
      } else {
        user = await User.create({
          googleId,
          email: email.toLowerCase(),
          name,
          profileImage,
          authProvider: 'google',
          isVerified: true,
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
 * Send either:
 * - identityToken: from Sign in with Apple (verified on server when APPLE_CLIENT_ID is set)
 * - Or appleId (and optionally email, name; email only on first sign-in)
 */
const appleSignIn = async (req, res) => {
  try {
    const { identityToken, appleId: bodyAppleId, email: bodyEmail, name: bodyName, nonce } = req.body;

    let appleId = bodyAppleId;
    let email = bodyEmail;
    let name = bodyName;

    if (identityToken) {
      try {
        const payload = await verifyAppleIdToken(identityToken, nonce);
        if (payload) {
          appleId = payload.sub;
          email = email || payload.email;
        }
      } catch (err) {
        return res.status(401).json({ success: false, error: err.message || 'Invalid Apple token' });
      }
    }

    if (!appleId) {
      return res.status(400).json({
        success: false,
        error: process.env.APPLE_CLIENT_ID
          ? 'Apple identityToken is required (or provide appleId for dev)'
          : 'Apple ID is required',
      });
    }

    let user = await User.findOne({ appleId });

    if (!user) {
      if (email) {
        user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
          user.appleId = appleId;
          if (!user.name && name) user.name = name;
          await user.save();
        }
      }

      if (!user) {
        user = await User.create({
          appleId,
          email: email?.toLowerCase(),
          name,
          authProvider: 'apple',
          isVerified: true,
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
    const { name, phone, profileImage, dateOfBirth, bio, isPrivate } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (bio !== undefined) user.bio = bio;
    if (isPrivate !== undefined) user.isPrivate = isPrivate;
    
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

/**
 * Upload profile image
 * POST /api/auth/upload-image
 * Requires: Bearer token, multipart/form-data with 'image' field
 */
const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided',
      });
    }

    // Build the URL for the uploaded image
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

    // Update user's profile image
    const user = await User.findById(req.user._id);
    user.profileImage = imageUrl;
    await user.save();

    res.json({
      success: true,
      data: {
        imageUrl,
        user,
      },
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload image',
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
  uploadProfileImage,
};
