/**
 * Seed script — populates the database with sample data for development.
 *
 * Usage:  node seeds/seed.js
 *
 * Creates:
 *   • 1 manager  (manager@timely.com  /  password123)
 *   • 2 employees (alice@timely.com, bob@timely.com  /  password123)
 *   • Sample time entries for the past 5 working days
 *   • 2 sample leave requests
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const TimeEntry = require('../models/TimeEntry');
const LeaveRequest = require('../models/LeaveRequest');

const connectDB = require('../config/db');

const seed = async () => {
    await connectDB();
    console.log('🌱 Seeding database...');

    // Clear existing data
    await User.deleteMany({});
    await TimeEntry.deleteMany({});
    await LeaveRequest.deleteMany({});

    // ── Users ──
    const manager = await User.create({
        name: 'Sai Kiran (Manager)',
        email: 'manager@timely.com',
        password: 'password123',
        role: 'manager',
        department: 'Engineering',
    });

    const admin = await User.create({
        name: 'Admin User',
        email: 'admin@timely.com',
        password: 'password123',
        role: 'admin',
        department: 'Administration',
    });

    const alice = await User.create({
        name: 'Alice Johnson',
        email: 'alice@timely.com',
        password: 'password123',
        role: 'employee',
        department: 'Engineering',
        managerId: manager._id,
    });

    const bob = await User.create({
        name: 'Bob Smith',
        email: 'bob@timely.com',
        password: 'password123',
        role: 'employee',
        department: 'Engineering',
        managerId: manager._id,
    });

    console.log('  ✅ Users created (including admin)');

    // ── Time Entries (past 5 working days for Alice) ──
    const entries = [];
    const today = new Date();
    let daysBack = 0;
    let workingDaysCount = 0;

    while (workingDaysCount < 5) {
        const d = new Date(today);
        d.setDate(today.getDate() - daysBack);
        const dayOfWeek = d.getDay();

        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            // Punch IN at 9:00 AM
            const punchIn = new Date(d);
            punchIn.setHours(9, 0, 0, 0);

            // Punch OUT at 5:30 PM (8.5h — triggers overtime)
            const punchOut = new Date(d);
            punchOut.setHours(17, 30, 0, 0);

            entries.push({ userId: alice._id, action: 'IN', timestamp: punchIn });
            entries.push({ userId: alice._id, action: 'OUT', timestamp: punchOut });
            workingDaysCount++;
        }
        daysBack++;
    }

    await TimeEntry.insertMany(entries);
    console.log(`  ✅ ${entries.length} time entries created for Alice`);

    // ── Leave Requests ──
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const nextWeekEnd = new Date(nextWeek);
    nextWeekEnd.setDate(nextWeek.getDate() + 2);

    await LeaveRequest.create({
        userId: alice._id,
        startDate: nextWeek,
        endDate: nextWeekEnd,
        leaveType: 'Annual Leave',
        reason: 'Family vacation',
        status: 'pending',
        appliedAt: new Date(),
    });

    await LeaveRequest.create({
        userId: bob._id,
        startDate: nextWeek,
        endDate: nextWeek,
        leaveType: 'Sick Leave',
        reason: 'Doctor appointment',
        status: 'pending',
        appliedAt: new Date(),
    });

    console.log('  ✅ Leave requests created');
    console.log('\n🎉 Seeding complete!');
    console.log('\n📋 Test accounts:');
    console.log('   Admin:    admin@timely.com     /  password123');
    console.log('   Manager:  manager@timely.com   /  password123');
    console.log('   Employee: alice@timely.com      /  password123');
    console.log('   Employee: bob@timely.com        /  password123');

    await mongoose.disconnect();
    process.exit(0);
};

seed().catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
});
