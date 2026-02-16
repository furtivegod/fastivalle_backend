/**
 * Event Routes
 * GET /api/events/:id - Event detail (optional auth for liked)
 */

const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { getEventById, getEventTicketTypes } = require('../controllers/eventController');

router.get('/:id/ticket-types', getEventTicketTypes);
router.get('/:id', optionalAuth, getEventById);

module.exports = router;
