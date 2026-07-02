const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.header("Authorization"); 

  if (!token) {
    return res.status(401).json({ message: "Access Denied. No token provided." });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET); 
    req.user = verified; 

    // Standardize to always use 'userId' for consistency
    if (!req.user.userId && req.user.id) {
      req.user.userId = req.user.id;
    }
    
    // Also set 'id' for backward compatibility
    if (!req.user.id && req.user.userId) {
      req.user.id = req.user.userId;
    }

    if (!req.user || (!req.user.id && !req.user.userId)) {
      return res.status(401).json({ message: "Invalid token. User ID missing." });
    }

    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
  }
};

module.exports = verifyToken;
