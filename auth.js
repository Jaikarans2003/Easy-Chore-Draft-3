const { admin } = require('../config/firebase');

// Middleware to authenticate requests with Firebase token
const auth = async (req, res, next) => {
  try {
    // Check if authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No authentication token provided' });
    }

    // Extract the token
    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Invalid authentication token format' });
    }

    // Verify the token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Set user information in request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name || ''
    };
    
    // Continue with request
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Failed to authenticate user', error: error.message });
  }
};

module.exports = { auth }; 