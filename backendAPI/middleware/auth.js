import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * JWT authentication middleware.
 * Expects header:  Authorization: Bearer <token>
 * On success, attaches the full user document to req.user (without password).
 */
const auth = async (req, res, next) => {
    try {
        // Read token from httpOnly cookie first, fallback to Authorization header
        let token = req.cookies?.timely_token;

        if (!token) {
            const header = req.headers.authorization;
            if (header && header.startsWith('Bearer ')) {
                token = header.split(' ')[1];
            }
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'No token provided' },
            });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'User not found or deactivated' },
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
            });
        }
        next(error);
    }
};

export default auth;
