/**
 * File Upload Middleware
 *
 * Uses multer memoryStorage so files are in req.file.buffer (no disk writes).
 * Compatible with Vercel serverless (read-only filesystem).
 * Actual storage is handled in the controller (e.g. Vercel Blob).
 */

const multer = require('multer');

// Memory storage - file is available as req.file.buffer
const storage = multer.memoryStorage();

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'), false);
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

module.exports = upload;
