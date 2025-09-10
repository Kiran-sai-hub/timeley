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