/**
 * Schedule Routes
 * GET /api/schedule - Schedule screen data (optional auth for favorites)
 */

const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { getScheduleData } = require('../controllers/scheduleController');

router.get('/', optionalAuth, getScheduleData);

module.exports = router;
