function authenticateUser(req, res, next) {
  if (req.session && req.session.userId) {
    req.user = { id: req.session.userId }; // ← Attach to req.user
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized: Please log in first.' });
  }
}
  
  module.exports = authenticateUser;
  