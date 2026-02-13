/**
 * Authentication Controller
 * 
 * Handles user registration, login, and social authentication.
 */

const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { verifyFirebaseIdToken, verifyAppleIdToken } = require('../utils/verifySocialToken');
const { put: putBlob } = require('@vercel/blob');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Register new user with email/phone and password
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { email, phone, password, name } = req.body;
console.log(email, phone, password, name);
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
console.log(email, phone, password);
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
console.log(user);    
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
 * Google Sign-In (Firebase idToken or raw Google idToken)
 * POST /api/auth/google
 *
 * App sends Firebase idToken (from auth().currentUser.getIdToken() after signing in with Google via Firebase).
 * Backend verifies with Firebase Admin, finds/creates user, returns { user, token }.
 * Fallback: raw Google idToken when GOOGLE_CLIENT_ID is set and Firebase not used.
 */
const googleSignIn = async (req, res) => {
  try {
    const { firebaseIdToken } = req.body;

    let googleId = null;
    let email = null;
    let name = null;
    let profileImage = null;
console.log('====>>>', firebaseIdToken);
    if (firebaseIdToken) {
      try {
        const payload = await verifyFirebaseIdToken(firebaseIdToken);
        if (payload) {
          googleId = payload.uid || payload.sub;
          email = payload.email || email;
          name = name || payload.name;
          profileImage = profileImage || payload.picture;
        }
      } catch (err) {
        return res.status(401).json({ success: false, error: err.message || 'Invalid Firebase token' });
      }
    }

    if (!googleId) {
      return res.status(400).json({
        success: false,
        error: 'idToken is required (Firebase idToken from the app)',
      });
    }

    let user = await User.findOne({ googleId });

    if (!user) {
      if (email) {
        user = await User.findOne({ email: email.toLowerCase().trim() });
        if (user) {
          user.googleId = googleId;
          if (!user.name && name) user.name = name;
          if (!user.profileImage && profileImage) user.profileImage = profileImage;
          await user.save();
        }
      }
      if (!user) {
        user = await User.create({
          googleId,
          email: email ? email.toLowerCase().trim() : undefined,
          name: name || undefined,
          profileImage: profileImage || undefined,
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
console.log('====', token);    
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
    const { firebaseIdToken } = req.body;

    let appleId = null;
    let email = null;
    let name = null;
    let profileImage = null;
    if (firebaseIdToken) {
      try {
        const payload = await verifyFirebaseIdToken(firebaseIdToken);
        if (payload) {
          appleId = payload.uid || payload.sub;
          email = payload.email || email;
          name = name || payload.name;
          profileImage = profileImage || payload.picture;
        }
      } catch (err) {
        return res.status(401).json({ success: false, error: err.message || 'Invalid Firebase token' });
      }
    }

    if (!appleId) {
      return res.status(400).json({
        success: false,
        error: 'Apple identityToken is required (Firebase idToken from the app)'
      });
    }

    let user = await User.findOne({ appleId });

    if (!user) {
      if (email) {
        user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
          user.appleId = appleId;
          if (!user.name && name) user.name = name;
          if (!user.profileImage && profileImage) user.profileImage = profileImage;
          await user.save();
        }
      }

      if (!user) {
        user = await User.create({
          appleId,
          email: email ? email.toLowerCase().trim() : undefined,
          name: name || undefined,
          profileImage: profileImage || undefined,
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
console.log(name, phone, profileImage, dateOfBirth, bio, isPrivate);
    const user = await User.findById(req.user._id);
console.log(user);    
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
 * Requires: Bearer token, multipart/form-data with 'image' field.
 * Uploads to Vercel Blob (no local disk); works on serverless.
 */
const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided',
      });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(503).json({
        success: false,
        error: 'Image upload is not configured (missing BLOB_READ_WRITE_TOKEN). Add a Vercel Blob store and set the token.',
      });
    }

    const ext = path.extname(req.file.originalname) || '.jpg';
    const pathname = `profile-images/${req.user._id}/${uuidv4()}${ext}`;

    const blob = await putBlob(pathname, req.file.buffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType: req.file.mimetype || undefined,
    });

    const imageUrl = blob.url;

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
