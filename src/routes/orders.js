/**
 * Order Routes
 * POST /api/orders - Create order (protected)
 * GET /api/orders/:id - Order detail (protected)
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createOrder, getOrderById } = require('../controllers/orderController');

router.post('/', protect, createOrder);
router.get('/:id', protect, getOrderById);

module.exports = router;
