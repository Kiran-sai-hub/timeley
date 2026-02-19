import { validationResult, body } from 'express-validator';
import LeaveRequest from '../models/LeaveRequest.js';
import User from '../models/User.js';

// ───── Validation rules ─────
export const submitValidation = [
    body('startDate').notEmpty().withMessage('Start date is required'),
    body('endDate').notEmpty().withMessage('End date is required'),
    body('leaveType')
        .isIn(['Annual Leave', 'Sick Leave', 'Casual Leave', 'Holiday'])
        .withMessage('Invalid leave type'),
    body('reason').optional().trim(),
];

export const reviewValidation = [
    body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
    body('reviewNote').optional().trim(),
];

// ─────── POST /api/leave-requests ───────
export const submitLeave = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: errors.array() },
            });
        }

        const { startDate, endDate, leaveType, reason } = req.body;
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (end < start) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'End date must be after start date' },
            });
        }

        const leave = await LeaveRequest.create({
            userId: req.user._id,
            startDate: start,
            endDate: end,
            leaveType,
            reason: reason || '',
            status: 'pending',
            appliedAt: new Date(),
        });

        res.status(201).json({ success: true, data: leave });
    } catch (error) {
        next(error);
    }
};

// ─────── GET /api/leave-requests ───────
export const getMyLeaves = async (req, res, next) => {
    try {
        const filter = { userId: req.user._id };

        // Optional status filter
        if (req.query.status && ['pending', 'approved', 'rejected'].includes(req.query.status)) {
            filter.status = req.query.status;
        }

        const leaves = await LeaveRequest.find(filter).sort({ appliedAt: -1 });
        res.json({ success: true, data: leaves });
    } catch (error) {
        next(error);
    }
};

// ─────── GET /api/leave-requests/month ───────
export const getLeavesForMonth = async (req, res, next) => {
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
        const monthStart = new Date(y, m, 1);
        const monthEnd = new Date(y, m + 1, 0, 23, 59, 59, 999);

        const leaves = await LeaveRequest.find({
            userId: req.user._id,
            startDate: { $lte: monthEnd },
            endDate: { $gte: monthStart },
            status: { $ne: 'rejected' },
        }).sort({ startDate: 1 });

        // Build a date → status map (same logic as frontend getLeaveDatesForMonth)
        const dateMap = {};
        for (const leave of leaves) {
            const s = new Date(leave.startDate);
            const e = new Date(leave.endDate);
            for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
                const key = new Date(d).toDateString();
                // approved overrides pending
                if (!dateMap[key] || leave.status === 'approved') {
                    dateMap[key] = leave.status;
                }
            }
        }

        res.json({ success: true, data: { leaves, dateMap } });
    } catch (error) {
        next(error);
    }
};

// ─────── GET /api/leave-requests/:id ───────
export const getLeaveById = async (req, res, next) => {
    try {
        const leave = await LeaveRequest.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!leave) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Leave request not found' },
            });
        }

        res.json({ success: true, data: leave });
    } catch (error) {
        next(error);
    }
};

// ─────── PATCH /api/leave-requests/:id/review  (Manager only) ───────
export const reviewLeave = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: errors.array() },
            });
        }

        const leave = await LeaveRequest.findById(req.params.id);
        if (!leave) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Leave request not found' },
            });
        }

        if (leave.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: `Leave request already ${leave.status}` },
            });
        }

        const { status, reviewNote } = req.body;

        leave.status = status;
        leave.reviewedAt = new Date();
        leave.reviewedBy = req.user._id;
        if (reviewNote) leave.reviewNote = reviewNote;

        // If approved, deduct leave balance
        if (status === 'approved') {
            const user = await User.findById(leave.userId);
            if (user) {
                const days = Math.max(
                    1,
                    Math.round((new Date(leave.endDate) - new Date(leave.startDate)) / (1000 * 60 * 60 * 24)) + 1
                );
                const balanceKey = {
                    'Annual Leave': 'annualLeave',
                    'Sick Leave': 'sickLeave',
                    'Casual Leave': 'casualLeave',
                    Holiday: null, // Holidays don't deduct balance
                }[leave.leaveType];

                if (balanceKey && user.leaveBalance[balanceKey] != null) {
                    user.leaveBalance[balanceKey] = Math.max(0, user.leaveBalance[balanceKey] - days);
                    await user.save();
                }
            }
        }

        await leave.save();

        res.json({ success: true, data: leave });
    } catch (error) {
        next(error);
    }
};

// ─────── GET /api/leave-requests/team  (Manager / Admin) ───────
export const getTeamLeaves = async (req, res, next) => {
    try {
        const { role, department, _id: currentUserId } = req.user;

        let teamMembers;

        if (role === 'admin') {
            // Admin sees ALL users (except themselves)
            teamMembers = await User.find({ _id: { $ne: currentUserId } }).select('_id name email department role');
        } else {
            // Manager sees employees in their department (excluding themselves)
            teamMembers = await User.find({
                department,
                _id: { $ne: currentUserId },
            }).select('_id name email department role');
        }

        const teamIds = teamMembers.map((m) => m._id);

        const filter = { userId: { $in: teamIds } };
        if (req.query.status && ['pending', 'approved', 'rejected'].includes(req.query.status)) {
            filter.status = req.query.status;
        }

        const leaves = await LeaveRequest.find(filter)
            .populate('userId', 'name email department role')
            .sort({ appliedAt: -1 });

        res.json({ success: true, data: { teamMembers, leaves } });
    } catch (error) {
        next(error);
    }
};
