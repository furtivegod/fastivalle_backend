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
const otpRoutes = require('./otp');
const homeRoutes = require('./home');
const scheduleRoutes = require('./schedule');
const eventsRoutes = require('./events');
const artistsRoutes = require('./artists');
const lineupRoutes = require('./lineup');
const ticketsRoutes = require('./tickets');
const ordersRoutes = require('./orders');

// Mount routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/otp', otpRoutes);
router.use('/home', homeRoutes);
router.use('/schedule', scheduleRoutes);
router.use('/events', eventsRoutes);
router.use('/artists', artistsRoutes);
router.use('/lineup', lineupRoutes);
router.use('/tickets', ticketsRoutes);
router.use('/orders', ordersRoutes);

// API root - simple welcome message
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Fastivalle API',
    version: '1.0',
    endpoints: {
      health: '/api/health',
      home: 'GET /api/home (optional auth)',
      schedule: 'GET /api/schedule (optional auth)',
      events: 'GET /api/events/:id (optional auth)',
      artists: 'GET /api/artists (?search=)',
      lineup: 'GET /api/lineup (protected)',
      tickets: 'GET /api/tickets (protected)',
      orders: 'POST /api/orders, GET /api/orders/:id (protected)',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        google: 'POST /api/auth/google',
        apple: 'POST /api/auth/apple',
        me: 'GET /api/auth/me (protected)',
      },
      otp: {
        send: 'POST /api/otp/send',
        verify: 'POST /api/otp/verify',
        resend: 'POST /api/otp/resend',
      },
    },
  });
});

module.exports = router;
