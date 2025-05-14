const authMiddleware = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  next(); // User is authenticated, proceed
};

module.exports = authMiddleware;
