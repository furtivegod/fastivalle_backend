/**
 * Main Router - Combines all route modules
 * 
 * All API routes are prefixed with /api
 * Example: /api/health, /api/users, etc.
 */

const express = require('express');
const router = express.Router();
const healthRoutes = require('./health');
const authRoutes = require('./auth');

// Mount routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

// API root - simple welcome message
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Fastivalle API',
    version: '1.0',
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        google: 'POST /api/auth/google',
        apple: 'POST /api/auth/apple',
        me: 'GET /api/auth/me (protected)',
      },
    },
  });
});

module.exports = router;
