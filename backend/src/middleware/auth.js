// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Verifies a Bearer JWT and attaches { id, role } to req.user.
 * Used to protect government-officer endpoints (e.g. responding to complaints).
 */
function authMiddleware(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    try {
        const payload = jwt.verify(token, config.jwtSecret);
        req.user = { id: payload.sub, role: payload.role };
        return next();
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, error: 'Insufficient permissions' });
        }
        next();
    };
}

module.exports = { authMiddleware, requireRole };
