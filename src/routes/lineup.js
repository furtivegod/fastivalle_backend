/**
 * Lineup Routes
 * GET /api/lineup - User's lineups (protected)
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMyLineups } = require('../controllers/lineupController');

router.get('/', protect, getMyLineups);

module.exports = router;
