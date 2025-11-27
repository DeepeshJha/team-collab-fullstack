/** Authorization middleware 
 * Checks if authenticated user has required role(s) to access a route
 * Usage:
 *   const { authorize } = require('../middlewares/authorize');
 *  app.get('/admin', authenticateToken, authorize(['admin']), adminController);
 * // Allowed roles can be an array of strings, e.g. ['admin', 'manager']
*/
const authorize = (allowedRoles = []) => {
    return (req, res, next) => {
        try {
            // Check if user is attached to request
            if(!req.user) {
                return res.status(401).json({ message: 'Authentication required' });
            }
            
            // Check if user's role is in allowedRoles
            if(!allowedRoles.includes(req.user.role)) {
                return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
            }
            next(); // User is authorized, proceed to next middleware or route handler

        } catch (error) {
            console.error('Authorization error:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}

const requireAdmin = () => authorize(['admin']);
const requireMemberOrAdmin = () => authorize(['member', 'admin']);
const requireAnyRole = () => authorize(['member', 'admin', 'viewer']);

module.exports = { authorize, requireAdmin, requireMemberOrAdmin, requireAnyRole };