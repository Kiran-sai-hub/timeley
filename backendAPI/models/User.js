import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        name: { 
            type: String, 
            required: true, 
            trim: true 
        },
        email: { 
            type: String, 
            required: true, 
            unique: true, 
            lowercase: true, 
            trim: true 
        },
        password: { 
            type: String, 
            required: true, 
            select: false 
        },
        role: 
        { type: String, 
            enum: ['employee', 'manager', 'admin'], 
            default: 'employee' 
        },
        department: { 
            type: String, 
            default: '' 
        },
        managerId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User', 
            default: null 
        },
        leaveBalance: {
            annualLeave: { type: Number, default: 18 },
            sickLeave: { type: Number, default: 12 },
            casualLeave: { type: Number, default: 6 },
        },
        isActive: { 
            type: Boolean, 
            default: true 
        },
    },
    { timestamps: true }
);

// ---- Hash password before save ----
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// ---- Compare password helper ----
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// ---- Strip password from JSON ----
userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

export default mongoose.model('User', userSchema);
