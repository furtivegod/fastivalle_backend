/**
 * Global Error Handler Middleware
 * 
 * This catches any errors in your API and sends a proper response.
 * Without this, unhandled errors could crash the server.
 */

const errorHandler = (err, req, res, next) => {
  // Log the error for debugging
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Server Error',
  });
};

module.exports = errorHandler;
