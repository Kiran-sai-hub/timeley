import TimeEntry from '../models/TimeEntry.js';

export const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
};

export const countDays = (startDate, endDate) => {
    let count = 0;
    const d = new Date(startDate);
    d.setHours(12, 0, 0, 0);
    const e = new Date(endDate);
    e.setHours(12, 0, 0, 0);
    while (d <= e) {
        count++;
        d.setDate(d.getDate() + 1);
    }
    return Math.max(1, count);
};

export const countDaysInMonth = (startDate, endDate, year, month) => {
    const monthStart = new Date(year, month, 1, 12, 0, 0, 0);
    const monthEnd = new Date(year, month + 1, 0, 12, 0, 0, 0);
    const effectiveStart = new Date(Math.max(new Date(startDate).getTime(), monthStart.getTime()));
    const effectiveEnd = new Date(Math.min(new Date(endDate).getTime(), monthEnd.getTime()));
    effectiveStart.setHours(12, 0, 0, 0);
    effectiveEnd.setHours(12, 0, 0, 0);
    if (effectiveStart > effectiveEnd) return 0;
    return countDays(effectiveStart, effectiveEnd);
};

export const getEntriesInRange = async (userId, startDate, endDate) => {
    return TimeEntry.find({
        userId,
        timestamp: { $gte: startDate, $lte: endDate },
    }).sort({ timestamp: 1 });
};

export const calculateDailyHours = (dayEntries) => {
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

export const groupEntriesByDate = (entries) => {
    const map = new Map();
    for (const entry of entries) {
        const key = entry.timestamp.toDateString();
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(entry);
    }
    return map;
};

export const getWorkDayStatus = (date, dayEntries) => {
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

export const hasIncompleteShift = (dayEntries) => {
    if (!dayEntries || dayEntries.length === 0) return false;
    return dayEntries.length % 2 !== 0 || !dayEntries.some((e) => e.action === 'OUT');
};

export const REGULAR_HOURS_PER_DAY = 8;

export const calculateAggregatedHours = (entries, startDate, endDate) => {
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

export const getWorkingDaysInMonth = (entries, year, month) => {
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

export const getWeeklyStats = (entries, weekStartDate) => {
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

export const calculateLeaveHours = (leaves) => {
    const result = {
        'Annual Leave': 0,
        'Sick Leave': 0,
        'Casual Leave': 0,
        Holiday: 0,
    };

    leaves
        .filter((l) => l.status === 'approved')
        .forEach((leave) => {
            const days = countDays(new Date(leave.startDate), new Date(leave.endDate));
            result[leave.leaveType] += days * 8; // 8h per leave day
        });

    return result;
};

export const getHoursBreakdown = (entries, leaves, year, month) => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    const { regularHours, overtimeHours, totalHours } = calculateAggregatedHours(entries, monthStart, monthEnd);

    const monthLeaves = leaves.filter((l) => {
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        return start <= monthEnd && end >= monthStart;
    });

    const leaveHours = {
        'Annual Leave': 0,
        'Sick Leave': 0,
        'Casual Leave': 0,
        Holiday: 0,
    };
    monthLeaves
        .filter((l) => l.status === 'approved')
        .forEach((leave) => {
            const days = countDaysInMonth(new Date(leave.startDate), new Date(leave.endDate), year, month);
            leaveHours[leave.leaveType] += days * 8;
        });

    return {
        regularHours: Math.round(regularHours * 100) / 100,
        overtime: Math.round(overtimeHours * 100) / 100,
        leaveHours,
        totalWorked: Math.round(totalHours * 100) / 100,
    };
};

export const formatHours = (hours) => {
    const whole = Math.floor(hours);
    const minutes = Math.round((hours - whole) * 60);
    if (minutes === 0) return `${whole}h`;
    return `${whole}h ${minutes}m`;
};
