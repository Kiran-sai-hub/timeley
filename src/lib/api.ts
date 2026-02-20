// Backend API client for Timely

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ============= Storage Keys =============

export const STORAGE_KEYS = {
  USER: 'timely_user',
};

// Helper to handle API responses
const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'API Error');
  }
  return data;
};

// ============= Common fetch wrapper =============
// All requests use credentials: 'include' so the httpOnly cookie is sent automatically.
// No manual Authorization header is needed.

interface FetchOptions {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
}

const apiFetch = async (path: string, options: FetchOptions = {}) => {
  const { method = 'GET', body, signal } = options;
  const headers: Record<string, string> = {};
  if (body) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  return handleResponse(response);
};

// ============= Auth API =============

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'employee' | 'manager' | 'admin';
  department?: string;
  managerId?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'employee' | 'manager' | 'admin';
  department?: string;
  leaveBalance: {
    annualLeave: number;
    sickLeave: number;
    casualLeave: number;
  };
  isActive: boolean;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return apiFetch('/auth/login', { method: 'POST', body: credentials });
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    return apiFetch('/auth/register', { method: 'POST', body: data });
  },

  getMe: async (): Promise<{ success: boolean; data: { user: User } }> => {
    return apiFetch('/auth/me');
  },

  refresh: async (): Promise<AuthResponse> => {
    return apiFetch('/auth/refresh', { method: 'POST' });
  },

  logout: async (): Promise<{ success: boolean }> => {
    return apiFetch('/auth/logout', { method: 'POST' });
  },
};

// ============= Time Entries API =============

export interface TimeEntry {
  _id: string;
  userId: string;
  action: 'IN' | 'OUT';
  timestamp: string;
  note?: string;
}

export interface DailySummary {
  date: string;
  totalHours: number;
  entries: TimeEntry[];
}

export interface MonthlyHours {
  year: number;
  month: number;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
}

export interface YearlyHours {
  year: number;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
}

export interface WeeklyStats {
  totalDaysWorked: number;
  totalHours: number;
  incompleteDays: number;
  expectedWorkingDays: number;
}

export interface WorkingDay {
  date: string;
  status: 'working' | 'partial' | 'absent' | 'weekend';
  totalHours: number;
  entries: TimeEntry[];
  hasIncompleteShift: boolean;
}

export interface HoursBreakdown {
  regularHours: number;
  overtime: number;
  leaveHours: {
    'Annual Leave': number;
    'Sick Leave': number;
    'Casual Leave': number;
    Holiday: number;
  };
  totalWorked: number;
}

export interface OvertimeData {
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  period: string;
}

export const timeEntriesApi = {
  punch: async (action: 'IN' | 'OUT'): Promise<{ success: boolean; data: TimeEntry }> => {
    return apiFetch('/time-entries', { method: 'POST', body: { action } });
  },

  getEntries: async (params?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    year?: number;
    month?: number;
  }): Promise<{ success: boolean; data: TimeEntry[] }> => {
    const query = new URLSearchParams();
    if (params?.date) query.set('date', params.date);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.year) query.set('year', params.year.toString());
    if (params?.month !== undefined) query.set('month', params.month.toString());

    return apiFetch(`/time-entries?${query}`);
  },

  getDailySummary: async (date: string): Promise<{ success: boolean; data: DailySummary }> => {
    return apiFetch(`/time-entries/daily-summary?date=${date}`);
  },

  getMonthlyHours: async (year: number, month: number): Promise<{ success: boolean; data: MonthlyHours }> => {
    return apiFetch(`/time-entries/monthly?year=${year}&month=${month}`);
  },

  getYearlyHours: async (year: number): Promise<{ success: boolean; data: YearlyHours }> => {
    return apiFetch(`/time-entries/yearly?year=${year}`);
  },

  getWeeklyStats: async (weekStart?: string, signal?: AbortSignal): Promise<{ success: boolean; data: WeeklyStats }> => {
    const query = weekStart ? `?weekStart=${weekStart}` : '';
    return apiFetch(`/time-entries/weekly-stats${query}`, { signal });
  },

  getWorkingDays: async (year: number, month: number, signal?: AbortSignal): Promise<{ success: boolean; data: WorkingDay[] }> => {
    return apiFetch(`/time-entries/working-days?year=${year}&month=${month}`, { signal });
  },

  getHoursBreakdown: async (year: number, month: number): Promise<{ success: boolean; data: HoursBreakdown }> => {
    return apiFetch(`/time-entries/hours-breakdown?year=${year}&month=${month}`);
  },

  getOvertime: async (params: { date?: string; year?: number; month?: number }): Promise<{ success: boolean; data: OvertimeData }> => {
    const query = new URLSearchParams();
    if (params.date) query.set('date', params.date);
    if (params.year) query.set('year', params.year.toString());
    if (params.month !== undefined) query.set('month', params.month.toString());

    return apiFetch(`/time-entries/overtime?${query}`);
  },
};

// ============= Leave Requests API =============

export type LeaveType = 'Annual Leave' | 'Sick Leave' | 'Casual Leave' | 'Holiday';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  _id: string;
  userId: string;
  startDate: string;
  endDate: string;
  leaveType: LeaveType;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNote?: string;
}

export interface LeaveRequestInput {
  startDate: string;
  endDate: string;
  leaveType: LeaveType;
  reason?: string;
}

export interface LeaveReviewInput {
  status: 'approved' | 'rejected';
  reviewNote?: string;
}

export interface TeamLeaves {
  teamMembers: User[];
  leaves: (LeaveRequest & { userId: User })[];
}

export const leaveRequestsApi = {
  submit: async (input: LeaveRequestInput): Promise<{ success: boolean; data: LeaveRequest }> => {
    return apiFetch('/leave-requests', { method: 'POST', body: input });
  },

  getMyLeaves: async (status?: LeaveStatus): Promise<{ success: boolean; data: LeaveRequest[] }> => {
    const query = status ? `?status=${status}` : '';
    return apiFetch(`/leave-requests${query}`);
  },

  getLeavesForMonth: async (year: number, month: number, signal?: AbortSignal): Promise<{
    success: boolean;
    data: { leaves: LeaveRequest[]; dateMap: Record<string, LeaveStatus> };
  }> => {
    return apiFetch(`/leave-requests/month?year=${year}&month=${month}`, { signal });
  },

  getLeaveById: async (id: string): Promise<{ success: boolean; data: LeaveRequest }> => {
    return apiFetch(`/leave-requests/${id}`);
  },

  review: async (id: string, input: LeaveReviewInput): Promise<{ success: boolean; data: LeaveRequest }> => {
    return apiFetch(`/leave-requests/${id}/review`, { method: 'PATCH', body: input });
  },

  getTeamLeaves: async (status?: LeaveStatus): Promise<{ success: boolean; data: TeamLeaves }> => {
    const query = status ? `?status=${status}` : '';
    return apiFetch(`/leave-requests/team${query}`);
  },
};
