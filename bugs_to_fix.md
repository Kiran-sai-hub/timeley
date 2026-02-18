# Codebase Bug & Security Review - Timeley Application

## Context

This is a full-stack Employee Time Tracking application with:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js/Express + MongoDB
- **Features**: Time tracking (punch in/out), leave management, role-based access

This review identifies critical bugs and security issues that would make the app unusable or insecure.

---

## Critical Issues (Must Fix)

### 1. Privilege Escalation in Registration
**File**: `backendAPI/controllers/authController.js` (lines 16-17, 55)
- Any user can register themselves as admin/manager by passing role in request
- No verification that creator has permission to assign roles
- **Impact**: Complete auth bypass - anyone can get admin access

### 2. Missing Authorization in Leave Review
**File**: `backendAPI/controllers/leaveRequestController.js` (lines 150-156)
- Managers can approve/reject leave requests from ANY department
- No check if manager's department matches employee's department
- **Impact**: Cross-department leave manipulation

### 3. Race Condition in Time Punching
**File**: `backendAPI/controllers/timeEntryController.js` (lines 33-60)
- Concurrent punch requests can bypass validation
- No locking mechanism between check and create
- **Impact**: Double punch-in/out possible, incorrect hours

### 4. Race Condition in Leave Approval
**File**: `backendAPI/controllers/leaveRequestController.js` (lines 172-194)
- Approval and balance deduction not atomic
- If user save fails after leave approval, leave marked approved with no balance deducted
- **Impact**: Leave balance inconsistency

### 5. No Leave Balance Validation
**File**: `backendAPI/controllers/leaveRequestController.js` (line 42)
- Users can request more leave than they have available
- No check before creating leave request
- **Impact**: Negative leave balances possible

### 6. Token Storage in localStorage (XSS)
**File**: `frontend/src/contexts/AuthContext.tsx` (lines 39-44, 75-76, 96-97)
- Tokens stored in localStorage vulnerable to XSS attacks
- **Impact**: Token theft via injected JavaScript

---

## High Severity Issues

### 7. Missing Error Boundary
**File**: `frontend/src/App.tsx` (lines 64-76)
- No error boundary wrapping the app
- **Impact**: Single component error crashes entire app

### 8. No Token Refresh Mechanism
**File**: `frontend/src/lib/api.ts` (lines 16-22)
- No refresh token logic
- **Impact**: Users must manually re-login when token expires

### 9. Missing CORS HTTP Methods
**File**: `backendAPI/server.js` (line 21)
- Missing `PUT` and `OPTIONS` methods
- **Impact**: PUT requests will fail, CORS preflight issues

### 10. No Rate Limiting
**File**: `backendAPI/server.js`
- Login endpoint vulnerable to brute force
- **Impact**: Account takeover via password guessing

---

## Medium Severity Issues

### 11. Weak Password Policy
**File**: `backendAPI/controllers/authController.js` (line 16)
- Only 6 character minimum, no complexity requirements
- **Impact**: Weak passwords easily compromised

### 12. JSON Parse Crash Risk
**File**: `frontend/src/contexts/AuthContext.tsx` (line 44)
- `JSON.parse(storedUser)` without try-catch
- **Impact**: App crashes on malformed localStorage data

### 13. Undefined user.role Crash
**File**: `frontend/src/components/TimeTracker.tsx` (line 186)
- `user?.role?.charAt(0).toUpperCase()` can fail if role undefined
- **Impact**: App crashes on certain user states

### 14. Memory Leak in CalendarView
**File**: `frontend/src/components/CalendarView.tsx` (lines 71-104)
- No AbortController for API calls on unmount
- **Impact**: State updates on unmounted components

### 15. Leave Days Calculation Bug
**Files**:
- `backendAPI/utils/hoursCalc.js` (line 190)
- `backendAPI/controllers/leaveRequestController.js` (line 178)
- `Math.round` can give wrong results around daylight saving time
- **Impact**: Incorrect leave balance deduction

### 16. Incomplete Month Boundary Leave Filter
**File**: `backendAPI/utils/hoursCalc.js` (lines 206-209)
- Only checks `start.getMonth()` - misses leaves spanning month boundaries
- **Impact**: Incorrect hours breakdown for partial-month leaves

---

## Files to Modify

### Backend
1. `backendAPI/controllers/authController.js` - Fix role registration
2. `backendAPI/controllers/leaveRequestController.js` - Fix authorization, race conditions, balance validation
3. `backendAPI/controllers/timeEntryController.js` - Fix race condition
4. `backendAPI/server.js` - Add rate limiting, fix CORS

### Frontend
1. `frontend/src/contexts/AuthContext.tsx` - Fix JSON parse, consider httpOnly cookies
2. `frontend/src/lib/api.ts` - Add token refresh
3. `frontend/src/App.tsx` - Add ErrorBoundary
4. `frontend/src/components/TimeTracker.tsx` - Fix undefined handling
5. `frontend/src/components/CalendarView.tsx` - Add AbortController

---

## Verification

After fixes:
1. Test registration - ensure non-admin cannot create admin users
2. Test leave approval - ensure managers can only approve their department
3. Test concurrent punching - try simultaneous punch-in requests
4. Test leave balance - try requesting more leave than available
5. Test token expiry - verify app handles expired tokens gracefully
6. Test component errors - verify error boundary catches crashes
