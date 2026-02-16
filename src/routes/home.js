/**
 * Home Routes
 * GET /api/home - Home screen data (optional auth for favorites)
 */

const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { getHomeData } = require('../controllers/homeController');

router.get('/', optionalAuth, getHomeData);

module.exports = router;
