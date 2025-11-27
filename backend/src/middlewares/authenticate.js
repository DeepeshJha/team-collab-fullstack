const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticateToken = async (req, res, next) => {
    /** Middleware to authenticate JWT token from Authorization header */
    // Step 1: Get token from Authorization header
    // Step 2: Check if token exists
    // Step 3: Verify token
    // Step 4: Get user from database (optional but recommended)
    // Step 5: Add user to request object
    try {
        // Step 1: Get token from Authorization header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        // Step 2: Check if token exists
        if (!token) {
            return res.status(401).json({ message: 'Access token missing' });
        }

        // Step 3: Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'my_jwt_secret');
        /** 
        // Step 4: Get user from database (optional but recommended)
        const user = await User.findByPk(decoded.id);
        if(!user || !user.isActive) {
            return res.status(401).json({
                message: 'Invalid token: user does not exist or is inactive'
            });
        }
        */
       
        // Step 4: Create user object from decoded token
        const user = {
            id: decoded.id,
            username: decoded.username,
            email: decoded.email,
            role: decoded.role,
            isActive: decoded.isActive
        };
        // Step 5: Add user to request object
        req.user = user;
        next(); // Proceed to next middleware or route handler
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Access token expired' });
        }
        return res.status(403).json({ message: 'Invalid access token' });
    }
};
module.exports = { authenticateToken };