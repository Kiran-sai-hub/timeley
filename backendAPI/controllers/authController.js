const jwt = require('jsonwebtoken');
const { validationResult, body } = require('express-validator');
const User = require('../models/User');

// Helper — sign a JWT for a user
const signToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

// ───── Validation rules (exported for routes) ─────
const registerValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['employee', 'manager', 'admin']).withMessage('Invalid role'),
    body('department').optional().trim(),
];

const loginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

// ─────── POST /api/auth/register ───────
const register = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: errors.array() },
            });
        }

        const { name, email, password, role, department } = req.body;

        // Check duplicate
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({
                success: false,
                error: { code: 'DUPLICATE_ENTRY', message: 'Email already registered' },
            });
        }

        // Auto-assign the department's manager to new employees
        let managerId = null;
        if (role === 'employee' && department) {
            const deptManager = await User.findOne({ role: 'manager', department, isActive: true });
            if (deptManager) managerId = deptManager._id;
        }

        const user = await User.create({ name, email, password, role, department, managerId });
        const token = signToken(user);

        res.status(201).json({
            success: true,
            data: { token, user },
        });
    } catch (error) {
        next(error);
    }
};

// ─────── POST /api/auth/login ───────
const login = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: errors.array() },
            });
        }

        const { email, password } = req.body;

        // Find user with password field included
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' },
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' },
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Account is deactivated' },
            });
        }

        const token = signToken(user);

        res.json({
            success: true,
            data: { token, user },
        });
    } catch (error) {
        next(error);
    }
};

// ─────── GET /api/auth/me ───────
const getMe = async (req, res) => {
    res.json({
        success: true,
        data: { user: req.user },
    });
};

module.exports = {
    register,
    registerValidation,
    login,
    loginValidation,
    getMe,
};
