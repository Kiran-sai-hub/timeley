import { validationResult, body } from 'express-validator';
import mongoose from 'mongoose';
import LeaveRequest from '../models/LeaveRequest.js';
import User from '../models/User.js';
import { countDays } from '../utils/hoursCalc.js';

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

        const daysNeeded = countDays(start, end);

        const balanceKey = {
            'Annual Leave': 'annualLeave',
            'Sick Leave': 'sickLeave',
            'Casual Leave': 'casualLeave',
            Holiday: null,
        }[leaveType];

        if (balanceKey) {
            const user = await User.findById(req.user._id);
            if (user) {
                const availableBalance = user.leaveBalance[balanceKey] || 0;

                const pendingLeaves = await LeaveRequest.find({
                    userId: req.user._id,
                    leaveType,
                    status: 'pending',
                });

                let pendingDays = 0;
                for (const leave of pendingLeaves) {
                    pendingDays += countDays(new Date(leave.startDate), new Date(leave.endDate));
                }

                if (availableBalance - pendingDays < daysNeeded) {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'INSUFFICIENT_BALANCE',
                            message: `Insufficient ${leaveType} balance. Available: ${availableBalance - pendingDays}, Requested: ${daysNeeded}`,
                        },
                    });
                }
            }
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

export const getMyLeaves = async (req, res, next) => {
    try {
        const filter = { userId: req.user._id };

        if (req.query.status && ['pending', 'approved', 'rejected'].includes(req.query.status)) {
            filter.status = req.query.status;
        }

        const leaves = await LeaveRequest.find(filter).sort({ appliedAt: -1 });
        res.json({ success: true, data: leaves });
    } catch (error) {
        next(error);
    }
};

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

        const dateMap = {};
        for (const leave of leaves) {
            const s = new Date(leave.startDate);
            const e = new Date(leave.endDate);
            for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
                const key = new Date(d).toDateString();

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

export const reviewLeave = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: errors.array() },
            });
        }

        const leave = await LeaveRequest.findById(req.params.id).session(session);
        if (!leave) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Leave request not found' },
            });
        }

        if (leave.status !== 'pending') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: `Leave request already ${leave.status}` },
            });
        }

        const requestingUser = await User.findById(req.user._id).session(session);
        const leaveUser = await User.findById(leave.userId).session(session);

        if (!requestingUser || !leaveUser) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'User not found' },
            });
        }

        if (requestingUser.role === 'manager') {
            if (requestingUser.department !== leaveUser.department) {
                await session.abortTransaction();
                session.endSession();
                return res.status(403).json({
                    success: false,
                    error: { code: 'FORBIDDEN', message: 'You can only review leave requests from your department' },
                });
            }
        }

        const { status, reviewNote } = req.body;

        leave.status = status;
        leave.reviewedAt = new Date();
        leave.reviewedBy = req.user._id;
        if (reviewNote) leave.reviewNote = reviewNote;

        if (status === 'approved') {
            const balanceKey = {
                'Annual Leave': 'annualLeave',
                'Sick Leave': 'sickLeave',
                'Casual Leave': 'casualLeave',
                Holiday: null,
            }[leave.leaveType];

            if (balanceKey && leaveUser.leaveBalance[balanceKey] != null) {
                const days = countDays(new Date(leave.startDate), new Date(leave.endDate));
                leaveUser.leaveBalance[balanceKey] = Math.max(0, leaveUser.leaveBalance[balanceKey] - days);
                await leaveUser.save({ session });
            }
        }

        await leave.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.json({ success: true, data: leave });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

export const getTeamLeaves = async (req, res, next) => {
    try {
        const { role, department, _id: currentUserId } = req.user;

        let teamMembers;

        if (role === 'admin') {
            teamMembers = await User.find({ _id: { $ne: currentUserId } }).select('_id name email department role');
        } else {
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
