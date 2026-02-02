/**
 * Health Check Routes
 * 
 * GET /api/health - Returns API status
 */

const express = require('express');
const router = express.Router();
const { healthCheck } = require('../controllers/healthController');

router.get('/', healthCheck);

module.exports = router;
