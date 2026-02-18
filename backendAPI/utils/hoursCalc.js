const TimeEntry = require('../models/TimeEntry');

// ──────────────────────────────────────────────
//  Helper: is a given date a weekend?
// ──────────────────────────────────────────────
const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
};

// ──────────────────────────────────────────────
//  Get all time entries for a user in a date range
// ──────────────────────────────────────────────
const getEntriesInRange = async (userId, startDate, endDate) => {
    return TimeEntry.find({
        userId,
        timestamp: { $gte: startDate, $lte: endDate },
    }).sort({ timestamp: 1 });
};

// ──────────────────────────────────────────────
//  Calculate total worked hours for a single day
//  Pairs consecutive IN → OUT, sums durations
// ──────────────────────────────────────────────
const calculateDailyHours = (dayEntries) => {
    const sorted = [...dayEntries].sort((a, b) => a.timestamp - b.timestamp);
    let total = 0;
    let punchIn = null;

    for (const entry of sorted) {
        if (entry.action === 'IN') {
            punchIn = entry.timestamp;
        } else if (entry.action === 'OUT' && punchIn) {
            total += (entry.timestamp - punchIn) / (1000 * 60 * 60);
            punchIn = null;
        }
    }

    return total;
};

// ──────────────────────────────────────────────
//  Get entries grouped by date string key
// ──────────────────────────────────────────────
const groupEntriesByDate = (entries) => {
    const map = new Map();
    for (const entry of entries) {
        const key = entry.timestamp.toDateString();
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(entry);
    }
    return map;
};

// ──────────────────────────────────────────────
//  Determine day status: working / partial / absent / weekend
// ──────────────────────────────────────────────
const getWorkDayStatus = (date, dayEntries) => {
    if (isWeekend(date)) return 'weekend';
    if (!dayEntries || dayEntries.length === 0) return 'absent';

    const hasIn = dayEntries.some((e) => e.action === 'IN');
    const hasOut = dayEntries.some((e) => e.action === 'OUT');

    if (hasIn && hasOut) {
        const hours = calculateDailyHours(dayEntries);
        return hours >= 4 ? 'working' : 'partial';
    }
    return 'partial';
};

// ──────────────────────────────────────────────
//  Check if a shift is incomplete (odd entries or missing OUT)
// ──────────────────────────────────────────────
const hasIncompleteShift = (dayEntries) => {
    if (!dayEntries || dayEntries.length === 0) return false;
    return dayEntries.length % 2 !== 0 || !dayEntries.some((e) => e.action === 'OUT');
};

// ──────────────────────────────────────────────
//  Calculate aggregated hours for a date range
//  Returns { regularHours, overtimeHours, totalHours }
// ──────────────────────────────────────────────
const REGULAR_HOURS_PER_DAY = 8;

const calculateAggregatedHours = (entries, startDate, endDate) => {
    const grouped = groupEntriesByDate(entries);
    let regularTotal = 0;
    let overtimeTotal = 0;

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        if (isWeekend(d)) continue;
        const key = new Date(d).toDateString();
        const dayEntries = grouped.get(key) || [];
        const dayHours = calculateDailyHours(dayEntries);

        if (dayHours > 0) {
            regularTotal += Math.min(dayHours, REGULAR_HOURS_PER_DAY);
            overtimeTotal += Math.max(0, dayHours - REGULAR_HOURS_PER_DAY);
        }
    }

    return {
        regularHours: regularTotal,
        overtimeHours: overtimeTotal,
        totalHours: regularTotal + overtimeTotal,
    };
};

// ──────────────────────────────────────────────
//  Get working days array for a month (mirrors frontend getWorkingDaysInMonth)
// ──────────────────────────────────────────────
const getWorkingDaysInMonth = (entries, year, month) => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const grouped = groupEntriesByDate(entries);
    const workingDays = [];

    for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
        const currentDate = new Date(d);
        const key = currentDate.toDateString();
        const dayEntries = grouped.get(key) || [];
        const status = getWorkDayStatus(currentDate, dayEntries);
        const totalHours = calculateDailyHours(dayEntries);
        const incomplete = hasIncompleteShift(dayEntries);

        workingDays.push({
            date: currentDate.toISOString(),
            status,
            totalHours: Math.round(totalHours * 100) / 100,
            entries: dayEntries,
            hasIncompleteShift: incomplete,
        });
    }

    return workingDays;
};

// ──────────────────────────────────────────────
//  Weekly stats (mirrors frontend getWeeklyStats)
// ──────────────────────────────────────────────
const getWeeklyStats = (entries, weekStartDate) => {
    const grouped = groupEntriesByDate(entries);
    let totalDaysWorked = 0;
    let totalHours = 0;
    let incompleteDays = 0;
    let expectedWorkingDays = 0;

    for (let i = 0; i < 7; i++) {
        const day = new Date(weekStartDate);
        day.setDate(weekStartDate.getDate() + i);

        if (isWeekend(day)) continue;
        expectedWorkingDays++;

        const key = day.toDateString();
        const dayEntries = grouped.get(key) || [];
        const status = getWorkDayStatus(day, dayEntries);
        const dayHours = calculateDailyHours(dayEntries);

        if (status === 'working') {
            totalDaysWorked++;
            totalHours += dayHours;
        } else if (status === 'partial') {
            totalDaysWorked += 0.5;
            totalHours += dayHours;
            incompleteDays++;
        }
    }

    return { totalDaysWorked, totalHours, incompleteDays, expectedWorkingDays };
};

// ──────────────────────────────────────────────
//  Calculate leave hours by type (approved only)
// ──────────────────────────────────────────────
const calculateLeaveHours = (leaves) => {
    const result = {
        'Annual Leave': 0,
        'Sick Leave': 0,
        'Casual Leave': 0,
        Holiday: 0,
    };

    leaves
        .filter((l) => l.status === 'approved')
        .forEach((leave) => {
            const start = new Date(leave.startDate);
            const end = new Date(leave.endDate);
            const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
            result[leave.leaveType] += days * 8; // 8h per leave day
        });

    return result;
};

// ──────────────────────────────────────────────
//  Full hours breakdown for a pay period (month)
// ──────────────────────────────────────────────
const getHoursBreakdown = (entries, leaves, year, month) => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    const { regularHours, overtimeHours, totalHours } = calculateAggregatedHours(entries, monthStart, monthEnd);

    const monthLeaves = leaves.filter((l) => {
        const start = new Date(l.startDate);
        return start.getFullYear() === year && start.getMonth() === month;
    });
    const leaveHours = calculateLeaveHours(monthLeaves);

    return {
        regularHours: Math.round(regularHours * 100) / 100,
        overtime: Math.round(overtimeHours * 100) / 100,
        leaveHours,
        totalWorked: Math.round(totalHours * 100) / 100,
    };
};

// ──────────────────────────────────────────────
//  Format hours nicely (e.g. "8h 30m")
// ──────────────────────────────────────────────
const formatHours = (hours) => {
    const whole = Math.floor(hours);
    const minutes = Math.round((hours - whole) * 60);
    if (minutes === 0) return `${whole}h`;
    return `${whole}h ${minutes}m`;
};

module.exports = {
    isWeekend,
    getEntriesInRange,
    calculateDailyHours,
    groupEntriesByDate,
    getWorkDayStatus,
    hasIncompleteShift,
    calculateAggregatedHours,
    getWorkingDaysInMonth,
    getWeeklyStats,
    calculateLeaveHours,
    getHoursBreakdown,
    formatHours,
    REGULAR_HOURS_PER_DAY,
};
