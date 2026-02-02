/**
 * MongoDB Database Connection
 * 
 * This file handles connecting to MongoDB using Mongoose.
 * Mongoose is a library that makes it easier to work with MongoDB in Node.js.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Connect to MongoDB using the connection string from .env
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1); // Exit the app if database connection fails
  }
};

module.exports = connectDB;
