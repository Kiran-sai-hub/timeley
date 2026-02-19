import { validationResult, body } from 'express-validator';
import TimeEntry from '../models/TimeEntry.js';
import LeaveRequest from '../models/LeaveRequest.js';
import {
    getEntriesInRange,
    calculateDailyHours,
    calculateAggregatedHours,
    getWorkingDaysInMonth,
    getWeeklyStats,
    getHoursBreakdown,
} from '../utils/hoursCalc.js';

// ───── Validation rules ─────
export const punchValidation = [
    body('action').isIn(['IN', 'OUT']).withMessage('Action must be IN or OUT'),
];

// ─────── POST /api/time-entries  (Punch IN / OUT) ───────
export const createEntry = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: errors.array() },
            });
        }

        const { action } = req.body;
        const userId = req.user._id;

        // ── Punch validation: check current day status ──
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const todayEntries = await TimeEntry.find({
            userId,
            timestamp: { $gte: todayStart, $lte: todayEnd },
        }).sort({ timestamp: -1 });

        const lastEntry = todayEntries.length > 0 ? todayEntries[0] : null;
        const isCurrentlyIn = lastEntry?.action === 'IN';

        if (action === 'IN' && isCurrentlyIn) {
            return res.status(409).json({
                success: false,
                error: { code: 'ALREADY_PUNCHED_IN', message: 'You are already punched in' },
            });
        }
        if (action === 'OUT' && !isCurrentlyIn) {
            return res.status(409).json({
                success: false,
                error: { code: 'ALREADY_PUNCHED_OUT', message: 'You are not currently punched in' },
            });
        }

        const entry = await TimeEntry.create({
            userId,
            action,
            timestamp: new Date(), // server-generated timestamp
        });

        res.status(201).json({ success: true, data: entry });
    } catch (error) {
        next(error);
    }
};

// ─────── GET /api/time-entries ───────
export const getEntries = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const filter = { userId };

        // Optional date-range filters
        if (req.query.date) {
            const d = new Date(req.query.date);
            const start = new Date(d); start.setHours(0, 0, 0, 0);
            const end = new Date(d); end.setHours(23, 59, 59, 999);
            filter.timestamp = { $gte: start, $lte: end };
        } else if (req.query.startDate && req.query.endDate) {
            filter.timestamp = { $gte: new Date(req.query.startDate), $lte: new Date(req.query.endDate) };
        } else if (req.query.year != null && req.query.month != null) {
            const y = parseInt(req.query.year);
            const m = parseInt(req.query.month);
            filter.timestamp = { $gte: new Date(y, m, 1), $lte: new Date(y, m + 1, 0, 23, 59, 59, 999) };
        } else if (req.query.year != null) {
            const y = parseInt(req.query.year);
            filter.timestamp = { $gte: new Date(y, 0, 1), $lte: new Date(y, 11, 31, 23, 59, 59, 999) };
        }

        const entries = await TimeEntry.find(filter).sort({ timestamp: -1 });
        res.json({ success: true, data: entries });
    } catch (error) {
        next(error);
    }
};

// ─────── GET /api/time-entries/daily-summary ───────
export const getDailySummary = async (req, res, next) => {
    try {
        const dateStr = req.query.date;
        if (!dateStr) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'date query parameter is required' },
            });
        }

        const date = new Date(dateStr);
        const start = new Date(date); start.setHours(0, 0, 0, 0);
        const end = new Date(date); end.setHours(23, 59, 59, 999);

        const entries = await getEntriesInRange(req.user._id, start, end);
        const totalHours = calculateDailyHours(entries);

        res.json({
            success: true,
            data: {
                date: date.toISOString(),
                totalHours: Math.round(totalHours * 100) / 100,
                entries,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─────── GET /api/time-entries/monthly ───────
export const getMonthlyHours = async (req, res, next) => {
    try {
        const { year, month } = req.query;
        if (year == null || month == null) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'year and month query params required' },
            });
        }

        const y = parseInt(year);
        const m = parseInt(month);
        const start = new Date(y, m, 1);
        const end = new Date(y, m + 1, 0, 23, 59, 59, 999);

        const entries = await getEntriesInRange(req.user._id, start, end);
        const { regularHours, overtimeHours, totalHours } = calculateAggregatedHours(entries, start, end);

        res.json({
            success: true,
            data: { year: y, month: m, regularHours, overtimeHours, totalHours },
        });
    } catch (error) {
        next(error);
    }
};

// ─────── GET /api/time-entries/yearly ───────
export const getYearlyHours = async (req, res, next) => {
    try {
        const { year } = req.query;
        if (year == null) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'year query param required' },
            });
        }

        const y = parseInt(year);
        const start = new Date(y, 0, 1);
        const end = new Date(y, 11, 31, 23, 59, 59, 999);

        const entries = await getEntriesInRange(req.user._id, start, end);
        const { regularHours, overtimeHours, totalHours } = calculateAggregatedHours(entries, start, end);

        res.json({
            success: true,
            data: { year: y, regularHours, overtimeHours, totalHours },
        });
    } catch (error) {
        next(error);
    }
};

// ─────── GET /api/time-entries/weekly-stats ───────
export const getWeeklyStatsHandler = async (req, res, next) => {
    try {
        const weekStartStr = req.query.weekStart;
        let weekStart;

        if (weekStartStr) {
            weekStart = new Date(weekStartStr);
        } else {
            // Default: start of current week (Sunday)
            weekStart = new Date();
            const day = weekStart.getDay();
            weekStart.setDate(weekStart.getDate() - day);
        }
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const entries = await getEntriesInRange(req.user._id, weekStart, weekEnd);
        const stats = getWeeklyStats(entries, weekStart);

        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

// ─────── GET /api/time-entries/working-days ───────
export const getWorkingDaysHandler = async (req, res, next) => {
    try {
        const { year, month } = req.query;
        if (year == null || month == null) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'year and month query params required' },
            });
        }

        const y = parseInt(year);
        const m = parseInt(month);
        const start = new Date(y, m, 1);
        const end = new Date(y, m + 1, 0, 23, 59, 59, 999);

        const entries = await getEntriesInRange(req.user._id, start, end);
        const workingDays = getWorkingDaysInMonth(entries, y, m);

        res.json({ success: true, data: workingDays });
    } catch (error) {
        next(error);
    }
};

// ─────── GET /api/time-entries/hours-breakdown ───────
export const getHoursBreakdownHandler = async (req, res, next) => {
    try {
        const { year, month } = req.query;
        if (year == null || month == null) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'year and month query params required' },
            });
        }

        const y = parseInt(year);
        const m = parseInt(month);
        const start = new Date(y, m, 1);
        const end = new Date(y, m + 1, 0, 23, 59, 59, 999);

        const entries = await getEntriesInRange(req.user._id, start, end);
        const leaves = await LeaveRequest.find({
            userId: req.user._id,
            startDate: { $lte: end },
            endDate: { $gte: start },
        });

        const breakdown = getHoursBreakdown(entries, leaves, y, m);

        res.json({ success: true, data: breakdown });
    } catch (error) {
        next(error);
    }
};

// ─────── GET /api/time-entries/overtime ───────
export const getOvertimeHandler = async (req, res, next) => {
    try {
        const userId = req.user._id;
        let start, end, periodLabel;

        if (req.query.date) {
            const d = new Date(req.query.date);
            start = new Date(d); start.setHours(0, 0, 0, 0);
            end = new Date(d); end.setHours(23, 59, 59, 999);
            periodLabel = d.toISOString().slice(0, 10);
        } else if (req.query.year != null && req.query.month != null) {
            const y = parseInt(req.query.year);
            const m = parseInt(req.query.month);
            start = new Date(y, m, 1);
            end = new Date(y, m + 1, 0, 23, 59, 59, 999);
            periodLabel = `${y}-${String(m + 1).padStart(2, '0')}`;
        } else if (req.query.year != null) {
            const y = parseInt(req.query.year);
            start = new Date(y, 0, 1);
            end = new Date(y, 11, 31, 23, 59, 59, 999);
            periodLabel = `${y}`;
        } else {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Provide date, year+month, or year query params' },
            });
        }

        const entries = await getEntriesInRange(userId, start, end);
        const { regularHours, overtimeHours, totalHours } = calculateAggregatedHours(entries, start, end);

        res.json({
            success: true,
            data: {
                regularHours: Math.round(regularHours * 100) / 100,
                overtimeHours: Math.round(overtimeHours * 100) / 100,
                totalHours: Math.round(totalHours * 100) / 100,
                period: periodLabel,
            },
        });
    } catch (error) {
        next(error);
    }
};
