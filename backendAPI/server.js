import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './config/db.js';

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
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// --------------- Routes ---------------
app.get('/api/health', (_req, res) => {
    res.json({ success: true, message: 'Timely API is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
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
        console.log(`🚀 Timely API server running on port ${PORT}`);
    });
});
