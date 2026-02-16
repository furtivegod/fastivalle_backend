/**
 * Ticket Routes
 * GET /api/tickets - User's tickets (protected)
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getMyTickets } = require('../controllers/ticketController');

router.get('/', protect, getMyTickets);

module.exports = router;
