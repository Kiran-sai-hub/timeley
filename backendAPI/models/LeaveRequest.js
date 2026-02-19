import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        leaveType: {
            type: String,
            enum: ['Annual Leave', 'Sick Leave', 'Casual Leave', 'Holiday'],
            required: true,
        },
        reason: { type: String, default: '' },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        appliedAt: { type: Date, default: Date.now },
        reviewedAt: { type: Date, default: null },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        reviewNote: { type: String, default: '' },
    },
    { timestamps: true }
);

leaveRequestSchema.index({ userId: 1, status: 1 });
leaveRequestSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.model('LeaveRequest', leaveRequestSchema);
