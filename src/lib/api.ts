// Backend API client for Timely

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ============= Storage Keys =============

export const STORAGE_KEYS = {
  TOKEN: 'timely_token',
  USER: 'timely_user',
};

// Helper to get token from localStorage
const getToken = () => localStorage.getItem(STORAGE_KEYS.TOKEN);

// Helper to handle API responses
const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'API Error');
  }
  return data;
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
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getMe: async (): Promise<{ success: boolean; data: { user: User } }> => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return handleResponse(response);
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
    const response = await fetch(`${API_BASE_URL}/time-entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ action }),
    });
    return handleResponse(response);
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

    const response = await fetch(`${API_BASE_URL}/time-entries?${query}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return handleResponse(response);
  },

  getDailySummary: async (date: string): Promise<{ success: boolean; data: DailySummary }> => {
    const response = await fetch(`${API_BASE_URL}/time-entries/daily-summary?date=${date}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return handleResponse(response);
  },

  getMonthlyHours: async (year: number, month: number): Promise<{ success: boolean; data: MonthlyHours }> => {
    const response = await fetch(`${API_BASE_URL}/time-entries/monthly?year=${year}&month=${month}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return handleResponse(response);
  },

  getYearlyHours: async (year: number): Promise<{ success: boolean; data: YearlyHours }> => {
    const response = await fetch(`${API_BASE_URL}/time-entries/yearly?year=${year}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return handleResponse(response);
  },

  getWeeklyStats: async (weekStart?: string): Promise<{ success: boolean; data: WeeklyStats }> => {
    const query = weekStart ? `?weekStart=${weekStart}` : '';
    const response = await fetch(`${API_BASE_URL}/time-entries/weekly-stats${query}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return handleResponse(response);
  },

  getWorkingDays: async (year: number, month: number): Promise<{ success: boolean; data: WorkingDay[] }> => {
    const response = await fetch(`${API_BASE_URL}/time-entries/working-days?year=${year}&month=${month}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return handleResponse(response);
  },

  getHoursBreakdown: async (year: number, month: number): Promise<{ success: boolean; data: HoursBreakdown }> => {
    const response = await fetch(`${API_BASE_URL}/time-entries/hours-breakdown?year=${year}&month=${month}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return handleResponse(response);
  },

  getOvertime: async (params: { date?: string; year?: number; month?: number }): Promise<{ success: boolean; data: OvertimeData }> => {
    const query = new URLSearchParams();
    if (params.date) query.set('date', params.date);
    if (params.year) query.set('year', params.year.toString());
    if (params.month !== undefined) query.set('month', params.month.toString());

    const response = await fetch(`${API_BASE_URL}/time-entries/overtime?${query}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return handleResponse(response);
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
    const response = await fetch(`${API_BASE_URL}/leave-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(input),
    });
    return handleResponse(response);
  },

  getMyLeaves: async (status?: LeaveStatus): Promise<{ success: boolean; data: LeaveRequest[] }> => {
    const query = status ? `?status=${status}` : '';
    const response = await fetch(`${API_BASE_URL}/leave-requests${query}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return handleResponse(response);
  },

  getLeavesForMonth: async (year: number, month: number): Promise<{
    success: boolean;
    data: { leaves: LeaveRequest[]; dateMap: Record<string, LeaveStatus> };
  }> => {
    const response = await fetch(`${API_BASE_URL}/leave-requests/month?year=${year}&month=${month}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return handleResponse(response);
  },

  getLeaveById: async (id: string): Promise<{ success: boolean; data: LeaveRequest }> => {
    const response = await fetch(`${API_BASE_URL}/leave-requests/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return handleResponse(response);
  },

  review: async (id: string, input: LeaveReviewInput): Promise<{ success: boolean; data: LeaveRequest }> => {
    const response = await fetch(`${API_BASE_URL}/leave-requests/${id}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(input),
    });
    return handleResponse(response);
  },

  getTeamLeaves: async (status?: LeaveStatus): Promise<{ success: boolean; data: TeamLeaves }> => {
    const query = status ? `?status=${status}` : '';
    const response = await fetch(`${API_BASE_URL}/leave-requests/team${query}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return handleResponse(response);
  },
};

