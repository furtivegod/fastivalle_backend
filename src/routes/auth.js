/**
 * Authentication Routes
 * 
 * All routes prefixed with /api/auth
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  register,
  login,
  googleSignIn,
  appleSignIn,
  getMe,
  updateMe,
} = require('../controllers/authController');

// Public routes (no token needed)
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleSignIn);
router.post('/apple', appleSignIn);

// Protected routes (token required)
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

module.exports = router;
