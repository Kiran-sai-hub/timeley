import mongoose from 'mongoose';

const timeEntrySchema = new mongoose.Schema(
    {
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User', 
            required: true, 
            index: true 
        },
        action: { 
            type: String, 
            enum: ['IN', 'OUT'], 
            required: true 
        },
        timestamp: { 
            type: Date, 
            required: true, 
            default: Date.now 
        },
        note: { 
            type: String, 
            default: '' 
        },
    },
    { timestamps: true }
);

timeEntrySchema.index({ userId: 1, timestamp: -1 });

export default mongoose.model('TimeEntry', timeEntrySchema);
