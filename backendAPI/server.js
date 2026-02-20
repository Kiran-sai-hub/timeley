import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';

// Simple in-memory rate limiter middleware
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100; // max requests per window

const rateLimitMiddleware = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!rateLimitStore.has(ip)) {
        rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return next();
    }

    const record = rateLimitStore.get(ip);

    if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + RATE_LIMIT_WINDOW;
        return next();
    }

    if (record.count >= RATE_LIMIT_MAX) {
        return res.status(429).json({
            success: false,
            error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later' },
        });
    }

    record.count++;
    next();
};

// More strict rate limit for auth endpoints
const authRateLimitStore = new Map();
const AUTH_RATE_LIMIT_MAX = 5; // 5 attempts
const AUTH_RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

const authRateLimitMiddleware = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const endpoint = req.originalUrl;
    const key = `${ip}:${endpoint}`;
    const now = Date.now();

    if (!authRateLimitStore.has(key)) {
        authRateLimitStore.set(key, { count: 1, resetTime: now + AUTH_RATE_LIMIT_WINDOW });
        return next();
    }

    const record = authRateLimitStore.get(key);

    if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + AUTH_RATE_LIMIT_WINDOW;
        return next();
    }

    if (record.count >= AUTH_RATE_LIMIT_MAX) {
        return res.status(429).json({
            success: false,
            error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many login attempts, please try again later' },
        });
    }

    record.count++;
    next();
};

// Prune expired entries from rate-limit stores every 15 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore) {
        if (now > record.resetTime) rateLimitStore.delete(key);
    }
    for (const [key, record] of authRateLimitStore) {
        if (now > record.resetTime) authRateLimitStore.delete(key);
    }
}, RATE_LIMIT_WINDOW);

// Route imports
import authRoutes from './routes/auth.js';
import timeEntryRoutes from './routes/timeEntries.js';
import leaveRequestRoutes from './routes/leaveRequests.js';

const app = express();

// --------------- Middleware ---------------
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(cookieParser());
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Apply general rate limiting to all routes
app.use(rateLimitMiddleware);

// --------------- Routes ---------------
app.get('/api/health', (_req, res) => {
    res.json({ success: true, message: 'Timely API is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRateLimitMiddleware, authRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/leave-requests', leaveRequestRoutes);

// --------------- 404 catch-all ---------------
app.use((_req, res) => {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// --------------- Global error handler ---------------
app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: { code: 'SERVER_ERROR', message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' },
    });
});

// --------------- Start Server ---------------
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Timely API server running on port ${PORT}`);
    });
});
