/**
 * Server Entry Point
 * 
 * This is where the application starts.
 * Run: npm start (production) or npm run dev (development with auto-reload)
 */

require('dotenv').config(); // Load environment variables from .env file
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB first, then start the server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
