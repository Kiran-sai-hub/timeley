import jwt from 'jsonwebtoken';
import { validationResult, body } from 'express-validator';
import User from '../models/User.js';

const signToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

const setCookieToken = (res, token) => {
    res.cookie('timely_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

export const registerValidation = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number'),
    body('department').optional().trim(),
];

export const loginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

export const register = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: errors.array() },
            });
        }

        const { name, email, password, department } = req.body;

        const role = 'employee';

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({
                success: false,
                error: { code: 'DUPLICATE_ENTRY', message: 'Email already registered' },
            });
        }

        let managerId = null;
        if (role === 'employee' && department) {
            const deptManager = await User.findOne({ role: 'manager', department, isActive: true });
            if (deptManager) managerId = deptManager._id;
        }

        const user = await User.create({ name, email, password, role, department, managerId });
        const token = signToken(user);
        setCookieToken(res, token);

        res.status(201).json({
            success: true,
            data: { token, user },
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: errors.array() },
            });
        }

        const { email, password } = req.body;

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
        setCookieToken(res, token);

        res.json({
            success: true,
            data: { token, user },
        });
    } catch (error) {
        next(error);
    }
};

export const getMe = async (req, res) => {
    res.json({
        success: true,
        data: { user: req.user },
    });
};

export const refreshToken = async (req, res) => {

    const token = signToken(req.user);
    setCookieToken(res, token);

    res.json({
        success: true,
        data: { token, user: req.user },
    });
};

export const logoutUser = async (_req, res) => {
    res.cookie('timely_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0, // Expire immediately
    });

    res.json({ success: true, message: 'Logged out successfully' });
};
