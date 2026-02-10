/**
 * Express Application Setup
 *
 * This file configures the Express app with middleware and routes.
 * Express is a web framework for Node.js - it handles HTTP requests/responses.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const connectDB = require('./config/db');

const app = express();

// CORS - Allows your mobile app (running on different origin) to call this API
app.use(cors());

// Parse JSON request body - so we can read data sent in POST/PUT requests
app.use(express.json());

// Ensure MongoDB is connected before handling API requests (required for Vercel serverless)
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount all API routes under /api
app.use('/api', routes);

// Root route - basic info
app.get('/', (req, res) => {
  res.json({
    message: 'Fastivalle Backend Server',
    docs: 'Visit /api for API information',
  });
});

// 404 handler - when a route doesn't exist
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler - catches errors from anywhere in the app
app.use(errorHandler);

module.exports = app;
