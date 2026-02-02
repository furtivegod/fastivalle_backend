/**
 * Health Check Controller
 * 
 * Simple endpoint to verify the API is running.
 * Your mobile app can call this to check if the backend is live.
 */

const healthCheck = (req, res) => {
  res.json({
    success: true,
    message: 'Fastivalle API is running',
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  healthCheck,
};
