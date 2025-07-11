const authMiddleware = (req, res, next) => {
  let userId = null;

  // Try session first
  if (req.session && req.session.userId) {
    userId = req.session.userId;
    console.log('✅ AuthMiddleware: Using session authentication, userId:', userId);
  } 
  // Try auth token as backup
  else if (req.headers.authorization) {
    const authToken = req.headers.authorization.replace('Bearer ', '');
    console.log('🔑 AuthMiddleware: Trying token authentication:', authToken);
    
    // Parse token (format: userId.timestamp.randomHex)
    const tokenParts = authToken.split('.');
    if (tokenParts.length === 3) {
      const tokenUserId = parseInt(tokenParts[0]);
      const timestamp = parseInt(tokenParts[1]);
      const now = Date.now();
      
      // Check if token is not older than 24 hours
      if (!isNaN(tokenUserId) && !isNaN(timestamp) && (now - timestamp) < 24 * 60 * 60 * 1000) {
        userId = tokenUserId;
        console.log('✅ AuthMiddleware: Using token authentication, userId:', userId);
        
        // Store userId in session for compatibility with existing code
        if (!req.session.userId) {
          req.session.userId = userId;
        }
      } else {
        console.log('❌ AuthMiddleware: Token expired or invalid');
      }
    } else {
      console.log('❌ AuthMiddleware: Token format invalid');
    }
  }

  if (!userId) {
    console.log('❌ AuthMiddleware: No valid authentication found');
    return res.status(401).json({ error: 'Authentication required' });
  }

  next(); // User is authenticated, proceed
};

module.exports = authMiddleware;
