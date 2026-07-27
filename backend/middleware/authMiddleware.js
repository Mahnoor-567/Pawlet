const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 * Verifies token from Authorization Bearer header
 * Attaches decoded user to req.user
 * Returns 401 for missing or invalid token
 */
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    // Check if Authorization header exists
    if (!authHeader) {
        return res.status(401).json({ message: 'Missing authorization header' });
    }
    
    // Extract token from "Bearer <token>" format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ message: 'Invalid authorization header format' });
    }
    
    const token = parts[1];
    
    try {
        // Verify and decode token using JWT_SECRET from environment
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach decoded user to request object
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = authMiddleware;
