/**
 * MongoDB Database Connection
 *
 * Handles connecting to MongoDB using Mongoose. Uses a cached connection so
 * serverless (e.g. Vercel) invocations reuse the same connection instead of
 * timing out on buffered operations.
 */

const mongoose = require('mongoose');

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      const err = new Error('MONGODB_URI is not set');
      console.error('MongoDB connection error:', err.message);
      throw err;
    }
    cached.promise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    }).then((conn) => {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return conn;
    });
  }
  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
  return cached.conn;
};

module.exports = connectDB;
