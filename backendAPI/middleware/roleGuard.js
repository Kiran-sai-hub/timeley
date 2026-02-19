/**
 * Role-based access control middleware.
 * Usage: roleGuard('manager')  or  roleGuard('manager', 'admin')
 * Must be used AFTER the auth middleware so that req.user exists.
 */
const roleGuard = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
                },
            });
        }

        next();
    };
};

export default roleGuard;
