/**
 * Authentication Middleware
 * 
 * Protects routes that require a logged-in user.
 * Mobile app must send: Authorization: Bearer <token>
 */

const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Protect routes - require valid JWT token
 * Add this to any route that needs authentication
 * 
 * Usage in routes:
 *   router.get('/profile', protect, profileController);
 */
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized - no token provided',
      });
    }
    
    // Verify token
    const decoded = verifyToken(token);
    // Support both payload shapes: { id } (email/auth) and { userId } (legacy phone OTP)
    const userId = decoded.id ?? decoded.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized - invalid token',
      });
    }
    // Get user from database (without password)
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized - user not found',
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated',
      });
    }
    
    // Attach user to request object for use in controllers
    req.user = user;
    next();
    
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized - invalid token',
    });
  }
};

module.exports = { protect };
