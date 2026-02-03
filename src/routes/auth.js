/**
 * Authentication Routes
 * 
 * All routes prefixed with /api/auth
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  register,
  login,
  googleSignIn,
  appleSignIn,
  getMe,
  updateMe,
  uploadProfileImage,
} = require('../controllers/authController');

// Public routes (no token needed)
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleSignIn);
router.post('/apple', appleSignIn);

// Protected routes (token required)
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.post('/upload-image', protect, upload.single('image'), uploadProfileImage);

module.exports = router;
