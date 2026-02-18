export interface TimeEntry {
  id: string;
  timestamp: Date;
  action: 'IN' | 'OUT';
}

export interface DailySummary {
  date: string;
  totalHours: number;
  entries: TimeEntry[];
}

const STORAGE_KEY = 'timeTracking_entries';

export const getStoredEntries = (): TimeEntry[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return parsed.map((entry: any) => ({
      ...entry,
      timestamp: new Date(entry.timestamp)
    }));
  } catch (error) {
    console.error('Error loading time entries:', error);
    return [];
  }
};

export const saveEntry = (action: 'IN' | 'OUT'): TimeEntry => {
  const entry: TimeEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    action
  };
  
  const entries = getStoredEntries();
  entries.push(entry);
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('Error saving time entry:', error);
  }
  
  return entry;
};

export const calculateDailyHours = (entries: TimeEntry[], date: Date): number => {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);
  
  const dayEntries = entries
    .filter(entry => entry.timestamp >= dayStart && entry.timestamp <= dayEnd)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  let totalHours = 0;
  let punchInTime: Date | null = null;
  
  for (const entry of dayEntries) {
    if (entry.action === 'IN') {
      punchInTime = entry.timestamp;
    } else if (entry.action === 'OUT' && punchInTime) {
      const hoursWorked = (entry.timestamp.getTime() - punchInTime.getTime()) / (1000 * 60 * 60);
      totalHours += hoursWorked;
      punchInTime = null;
    }
  }
  
  return totalHours;
};

export const calculateMonthlyHours = (entries: TimeEntry[], year: number, month: number): number => {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  
  let totalHours = 0;
  
  for (let date = new Date(monthStart); date <= monthEnd; date.setDate(date.getDate() + 1)) {
    totalHours += calculateDailyHours(entries, new Date(date));
  }
  
  return totalHours;
};

export const calculateYearlyHours = (entries: TimeEntry[], year: number): number => {
  let totalHours = 0;
  
  for (let month = 0; month < 12; month++) {
    totalHours += calculateMonthlyHours(entries, year, month);
  }
  
  return totalHours;
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatHours = (hours: number): string => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (minutes === 0) {
    return `${wholeHours}h`;
  }
  
  return `${wholeHours}h ${minutes}m`;
};

export const getLastEntry = (entries: TimeEntry[]): TimeEntry | null => {
  if (entries.length === 0) return null;
  
  return entries.reduce((latest, entry) => 
    entry.timestamp > latest.timestamp ? entry : latest
  );
};

// Calendar-specific types and functions
export interface WorkingDay {
  date: Date;
  status: 'working' | 'partial' | 'absent' | 'weekend';
  totalHours: number;
  entries: TimeEntry[];
  hasIncompleteShift: boolean;
}

export interface WeeklyStats {
  totalDaysWorked: number;
  totalHours: number;
  incompleteDays: number;
  expectedWorkingDays: number;
}

export type WorkDayStatus = 'working' | 'partial' | 'absent' | 'weekend';

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
};

export const getWorkDayStatus = (date: Date, entries: TimeEntry[]): WorkDayStatus => {
  if (isWeekend(date)) return 'weekend';
  
  const dayEntries = entries.filter(entry => {
    const entryDate = new Date(entry.timestamp);
    return entryDate.toDateString() === date.toDateString();
  });
  
  if (dayEntries.length === 0) return 'absent';
  
  const hasIn = dayEntries.some(entry => entry.action === 'IN');
  const hasOut = dayEntries.some(entry => entry.action === 'OUT');
  
  if (hasIn && hasOut) {
    const totalHours = calculateDailyHours(entries, date);
    return totalHours >= 4 ? 'working' : 'partial';
  }
  
  return 'partial';
};

export const getWorkingDaysInMonth = (year: number, month: number, entries: TimeEntry[]): WorkingDay[] => {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const workingDays: WorkingDay[] = [];
  
  for (let date = new Date(monthStart); date <= monthEnd; date.setDate(date.getDate() + 1)) {
    const currentDate = new Date(date);
    const dayEntries = entries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      return entryDate.toDateString() === currentDate.toDateString();
    });
    
    const status = getWorkDayStatus(currentDate, entries);
    const totalHours = calculateDailyHours(entries, currentDate);
    const hasIncompleteShift = dayEntries.length > 0 && 
      (dayEntries.length % 2 !== 0 || !dayEntries.some(e => e.action === 'OUT'));
    
    workingDays.push({
      date: currentDate,
      status,
      totalHours,
      entries: dayEntries,
      hasIncompleteShift
    });
  }
  
  return workingDays;
};

export const getWeeklyStats = (startDate: Date, entries: TimeEntry[]): WeeklyStats => {
  const weekDays: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + i);
    weekDays.push(day);
  }
  
  let totalDaysWorked = 0;
  let totalHours = 0;
  let incompleteDays = 0;
  let expectedWorkingDays = 0;
  
  weekDays.forEach(day => {
    if (!isWeekend(day)) {
      expectedWorkingDays++;
      const status = getWorkDayStatus(day, entries);
      const dayHours = calculateDailyHours(entries, day);
      
      if (status === 'working') {
        totalDaysWorked++;
        totalHours += dayHours;
      } else if (status === 'partial') {
        totalDaysWorked += 0.5;
        totalHours += dayHours;
        incompleteDays++;
      }
    }
  });
  
  return {
    totalDaysWorked,
    totalHours,
    incompleteDays,
    expectedWorkingDays
  };
};

export const getWeekStart = (date: Date): Date => {
  const week = new Date(date);
  const day = week.getDay();
  const diff = week.getDate() - day; // Sunday as start of week
  week.setDate(diff);
  week.setHours(0, 0, 0, 0);
  return week;
};

// ============= Leave Management =============

export type LeaveType = 'Annual Leave' | 'Sick Leave' | 'Casual Leave' | 'Holiday';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  startDate: string;   // ISO date string
  endDate: string;
  leaveType: LeaveType;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;   // ISO date string
  reviewedAt?: string;
  reviewNote?: string;
}

const LEAVE_STORAGE_KEY = 'timeTracking_leaves';

export const getStoredLeaveRequests = (): LeaveRequest[] => {
  try {
    const stored = localStorage.getItem(LEAVE_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const saveLeaveRequest = (req: LeaveRequest): void => {
  const leaves = getStoredLeaveRequests();
  const idx = leaves.findIndex(l => l.id === req.id);
  if (idx >= 0) {
    leaves[idx] = req;
  } else {
    leaves.push(req);
  }
  localStorage.setItem(LEAVE_STORAGE_KEY, JSON.stringify(leaves));
};

export const updateLeaveStatus = (
  id: string,
  status: LeaveStatus,
  note?: string
): void => {
  const leaves = getStoredLeaveRequests();
  const idx = leaves.findIndex(l => l.id === id);
  if (idx >= 0) {
    leaves[idx].status = status;
    leaves[idx].reviewedAt = new Date().toISOString();
    if (note) leaves[idx].reviewNote = note;
    localStorage.setItem(LEAVE_STORAGE_KEY, JSON.stringify(leaves));
  }
};

export const getLeaveRequestsForMonth = (year: number, month: number): LeaveRequest[] => {
  const leaves = getStoredLeaveRequests();
  return leaves.filter(leave => {
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    return start <= monthEnd && end >= monthStart;
  });
};

export const getLeaveDatesForMonth = (year: number, month: number): Map<string, LeaveStatus> => {
  const leaves = getLeaveRequestsForMonth(year, month);
  const dateMap = new Map<string, LeaveStatus>();
  
  leaves.forEach(leave => {
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = new Date(d).toDateString();
      // approved overrides pending
      if (!dateMap.has(key) || leave.status === 'approved') {
        dateMap.set(key, leave.status);
      }
    }
  });
  return dateMap;
};

export const calculateLeaveHours = (leaves: LeaveRequest[]): Record<LeaveType, number> => {
  const result: Record<LeaveType, number> = {
    'Annual Leave': 0,
    'Sick Leave': 0,
    'Casual Leave': 0,
    'Holiday': 0,
  };
  leaves
    .filter(l => l.status === 'approved')
    .forEach(leave => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      result[leave.leaveType] += days * 8; // 8h per day
    });
  return result;
};

export interface HoursBreakdownData {
  regularHours: number;
  overtime: number;
  leaveHours: Record<LeaveType, number>;
  totalWorked: number;
}

export const getHoursBreakdown = (
  entries: TimeEntry[],
  leaves: LeaveRequest[],
  year: number,
  month: number
): HoursBreakdownData => {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  let regularHours = 0;
  let overtime = 0;
  const REGULAR_HOURS_PER_DAY = 8;

  for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
    if (isWeekend(d)) continue;
    const dayHours = calculateDailyHours(entries, new Date(d));
    if (dayHours > 0) {
      const reg = Math.min(dayHours, REGULAR_HOURS_PER_DAY);
      const ot = Math.max(0, dayHours - REGULAR_HOURS_PER_DAY);
      regularHours += reg;
      overtime += ot;
    }
  }

  const leaveHours = calculateLeaveHours(leaves.filter(l => {
    const start = new Date(l.startDate);
    return start.getFullYear() === year && start.getMonth() === month;
  }));

  return {
    regularHours,
    overtime,
    leaveHours,
    totalWorked: regularHours + overtime,
  };
};