
## Adding Hours Breakdown & Leave Management to Calendar View

### Overview

Two major features will be added:

1. **Hours Breakdown Panel** — A "Pay Period Breakdown" style table (inspired by the Amazon A-to-Z screenshot) showing Regular Hours, Overtime, and time-off used, broken down by type.
2. **Leave Management System** — Employees apply for leaves; a "Manager" toggle lets a simulated manager view all requests and approve/reject them, all stored in localStorage.

A third tab "Leave" will be added to the existing two-tab navigation (Dashboard, Calendar), making it a 3-tab layout.

---

### Technical Changes

#### 1. `src/lib/timeTracking.ts` — New Types & Functions

Add leave management data structures and storage helpers:

```typescript
export type LeaveType = 'Annual Leave' | 'Sick Leave' | 'Casual Leave' | 'Holiday';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  startDate: string;       // ISO date string
  endDate: string;
  leaveType: LeaveType;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;       // ISO date string
  reviewedAt?: string;
  reviewNote?: string;
}
```

New helper functions:
- `getStoredLeaveRequests()` — load from localStorage
- `saveLeaveRequest(req)` — add/update leave in localStorage
- `updateLeaveStatus(id, status, note)` — manager approval/rejection
- `getLeaveRequestsForMonth(year, month)` — filter by month for calendar overlay
- `calculateLeaveHours(leaves)` — tally approved leave by type for breakdown table
- `getHoursBreakdown(entries, leaves, year, month)` — returns structured breakdown with Regular Hours, Overtime (>8h/day), Sick Leave hours, etc.

#### 2. `src/components/HoursBreakdown.tsx` — New Component

Displays a "Pay Period Breakdown" card styled like the reference screenshot — a clean dark-header table showing:

**Work Hours Breakdown:**
| Time Type | Pay Period Total |
|---|---|
| Regular Hours | 131h 58m |
| Overtime | 8h 30m |
| Sick Leave | 0h |
| Annual Leave | 16h |
| Casual Leave | 8h |

Two sections:
- **Hours Worked** (Regular + Overtime, calculated from punch entries)
- **Time Off Used** (from approved leave requests, broken down by leave type)

This will be embedded in the CalendarView below the weekly stats cards.

#### 3. `src/components/LeaveManagement.tsx` — New Component

A full leave request and management interface with two modes:

**Employee Mode:**
- Form to submit a new leave request (date range picker, leave type dropdown, reason text area)
- Table of own leave requests with status badges (Pending / Approved / Rejected)

**Manager Mode (toggle switch to simulate):**
- View all pending leave requests from all "employees" (stored in localStorage)
- Approve / Reject buttons with an optional review note
- Filter by status (All / Pending / Approved / Rejected)

#### 4. `src/components/CalendarView.tsx` — Enhancements

- Import and render `HoursBreakdown` component below the weekly stats
- Overlay leave days on the calendar with a new color (blue for approved leaves, yellow for pending)
- Update the legend to include "On Leave" indicator
- Update the day-click modal to show if a leave was taken on that day

#### 5. `src/components/TimeTracker.tsx` — New Tab

- Change grid from `grid-cols-2` to `grid-cols-3`
- Add a third tab: "Leave" with a `FileText` or `Umbrella` icon
- Render `<LeaveManagement />` in the new tab content

---

### Data Flow

```text
localStorage
  ├── timeTracking_entries   (existing punch records)
  └── timeTracking_leaves    (new leave requests)

CalendarView
  ├── reads entries + leaves
  ├── passes leaves to HoursBreakdown
  └── overlays approved leaves on calendar dates

LeaveManagement
  ├── Employee: creates leave requests → saved to localStorage
  └── Manager: reads all requests → updates status in localStorage
```

### Leave Color Coding in Calendar

- Green = Full working day (8h+)
- Orange = Partial day
- Blue = Approved leave
- Yellow/Amber = Pending leave
- Red dot = Incomplete shift
- Gray = Absent / Weekend

### Implementation Files Summary

| File | Action |
|---|---|
| `src/lib/timeTracking.ts` | Add leave types, interfaces, storage helpers, and breakdown calculator |
| `src/components/HoursBreakdown.tsx` | Create new hours breakdown table component |
| `src/components/LeaveManagement.tsx` | Create new leave application + manager approval component |
| `src/components/CalendarView.tsx` | Add leave overlays, import HoursBreakdown, update day detail modal |
| `src/components/TimeTracker.tsx` | Add third "Leave" tab |
