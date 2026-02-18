# Timely — Backend Architecture Plan

> **Stack**: Node.js + Express.js + MongoDB (Mongoose)
> **Purpose**: Replace `localStorage` with a persistent, multi-user backend for the Timely employee attendance tracking application.

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────┐
│        React Frontend (Vite)        │
│  (existing — no changes required)   │
└──────────────┬──────────────────────┘
               │  REST API (JSON)
               ▼
┌─────────────────────────────────────┐
│       Express.js API Server         │
│  ┌───────────┐  ┌────────────────┐  │
│  │ Auth      │  │ Route Handlers │  │
│  │ Middleware│  │ (Controllers)  │  │
│  └───────────┘  └────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │    Mongoose ODM (Models)      │  │
│  └───────────────────────────────┘  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│           MongoDB Atlas / Local     │
│   Collections:                      │
│   • users                           │
│   • timeentries                     │
│   • leaverequests                   │
└─────────────────────────────────────┘
```

---

## 2. Project Structure

All backend code goes inside the existing `backendAPI/` directory:

```
backendAPI/
├── package.json
├── .env                      # Environment variables (not committed)
├── .env.example              # Template for env vars
├── server.js                 # Entry point — starts Express + connects MongoDB
├── config/
│   └── db.js                 # Mongoose connection helper
├── models/
│   ├── User.js               # User schema
│   ├── TimeEntry.js          # Punch-in/out schema
│   └── LeaveRequest.js       # Leave request schema
├── routes/
│   ├── auth.js               # POST /api/auth/register, /login, /me
│   ├── timeEntries.js        # CRUD for time entries
│   └── leaveRequests.js      # CRUD + approval for leave requests
├── controllers/
│   ├── authController.js     # Register, login, get profile
│   ├── timeEntryController.js
│   └── leaveRequestController.js
├── middleware/
│   ├── auth.js               # JWT verification middleware
│   └── roleGuard.js          # Role-based access (employee / manager / admin)
└── utils/
    └── hoursCalc.js          # Server-side hours calculation helpers (mirroring frontend logic)
```

---

## 3. Mongoose Models

### 3.1 User

```js
// models/User.js
const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true },
  password:     { type: String, required: true },               // bcrypt hashed
  role:         { type: String, enum: ['employee', 'manager', 'admin'], default: 'employee' },
  department:   { type: String, default: '' },
  managerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  leaveBalance: {
    annualLeave: { type: Number, default: 18 },
    sickLeave:   { type: Number, default: 12 },
    casualLeave: { type: Number, default: 6 },
  },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });
```

| Field          | Purpose                                                         |
|----------------|-----------------------------------------------------------------|
| `role`         | Maps to the frontend's `LeaveManagementProps.role` (`employee` / `manager`). `admin` added for future use. |
| `managerId`    | Links employee → their manager for leave-approval routing       |
| `leaveBalance` | Decremented when leave is approved; matches the 4 `LeaveType`s  |

---

### 3.2 TimeEntry

```js
// models/TimeEntry.js
const timeEntrySchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action:    { type: String, enum: ['IN', 'OUT'], required: true },
  timestamp: { type: Date, required: true, default: Date.now },
  note:      { type: String, default: '' },                      // optional note for the entry
}, { timestamps: true });

// Compound index for fast per-user, date-range queries
timeEntrySchema.index({ userId: 1, timestamp: -1 });
```

> **Mapping**: Directly mirrors the frontend's `TimeEntry` interface (`id`, `timestamp`, `action`). The `userId` field makes it multi-user.

---

### 3.3 LeaveRequest

```js
// models/LeaveRequest.js
const leaveRequestSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  startDate:  { type: Date, required: true },
  endDate:    { type: Date, required: true },
  leaveType:  { type: String, enum: ['Annual Leave', 'Sick Leave', 'Casual Leave', 'Holiday'], required: true },
  reason:     { type: String, default: '' },
  status:     { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  appliedAt:  { type: Date, default: Date.now },
  reviewedAt: { type: Date, default: null },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewNote: { type: String, default: '' },
}, { timestamps: true });

leaveRequestSchema.index({ userId: 1, status: 1 });
leaveRequestSchema.index({ startDate: 1, endDate: 1 });
```

> **Mapping**: Directly mirrors the frontend's `LeaveRequest` interface. Added `userId` and `reviewedBy` for multi-user support.

---

## 4. API Endpoints

### 4.1 Authentication (`/api/auth`)

| Method | Endpoint              | Access  | Description                           | Frontend Mapping                  |
|--------|-----------------------|---------|---------------------------------------|-----------------------------------|
| POST   | `/api/auth/register`  | Public  | Register a new employee               | New — adds user management        |
| POST   | `/api/auth/login`     | Public  | Login, returns JWT                    | New — replaces localStorage-only  |
| GET    | `/api/auth/me`        | Auth    | Get current user's profile            | Used for role-based UI switching  |

**Login Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "...",
    "name": "Sai Kiran",
    "email": "sai@company.com",
    "role": "employee",
    "department": "Engineering"
  }
}
```

---

### 4.2 Time Entries (`/api/time-entries`)

| Method | Endpoint                          | Access   | Description                               | Frontend Mapping                             |
|--------|-----------------------------------|----------|-------------------------------------------|----------------------------------------------|
| POST   | `/api/time-entries`               | Auth     | Create a punch IN/OUT entry               | `saveEntry(action)` in `timeTracking.ts`     |
| GET    | `/api/time-entries`               | Auth     | Get own entries (supports query filters)  | `getStoredEntries()` in `timeTracking.ts`    |
| GET    | `/api/time-entries/daily-summary` | Auth     | Get daily hours for a date                | `calculateDailyHours()` in `timeTracking.ts` |
| GET    | `/api/time-entries/monthly`       | Auth     | Get aggregated monthly hours              | `calculateMonthlyHours()` in `TimeTracker`   |
| GET    | `/api/time-entries/yearly`        | Auth     | Get aggregated yearly hours               | `calculateYearlyHours()` in `TimeTracker`    |
| GET    | `/api/time-entries/weekly-stats`  | Auth     | Get weekly stats (days worked, hours, attendance %) | `getWeeklyStats()` in `CalendarView`|
| GET    | `/api/time-entries/working-days`  | Auth     | Get working day statuses for a month      | `getWorkingDaysInMonth()` in `CalendarView`  |
| GET    | `/api/time-entries/hours-breakdown` | Auth   | Get pay period breakdown (regular, OT, leave hours) | `getHoursBreakdown()` in `HoursBreakdown` |
| GET    | `/api/time-entries/overtime`      | Auth     | Get overtime hours (daily, monthly, or yearly) | Overtime computation (see §9.1)          |

**Query Parameters (for `GET /api/time-entries`)**:
- `date` — Filter by specific date (ISO string)
- `month` — Filter by month (0–11)
- `year` — Filter by year
- `startDate` / `endDate` — Date range filter

**POST Body**:
```json
{
  "action": "IN"
}
```
> Server auto-stamps `timestamp` with `Date.now`. The `userId` comes from the JWT.

---

### 4.3 Leave Requests (`/api/leave-requests`)

| Method | Endpoint                              | Access         | Description                                | Frontend Mapping                          |
|--------|---------------------------------------|----------------|--------------------------------------------|-------------------------------------------|
| POST   | `/api/leave-requests`                 | Auth           | Submit a new leave request                 | `saveLeaveRequest(req)` in `LeaveManagement` |
| GET    | `/api/leave-requests`                 | Auth           | Get own leave requests (filterable by status) | `getStoredLeaveRequests()` + status filter |
| GET    | `/api/leave-requests/month`           | Auth           | Get leave dates for a given month          | `getLeaveDatesForMonth()` in `CalendarView`  |
| GET    | `/api/leave-requests/:id`             | Auth           | Get a single leave request                 | Used by `DayDetailPanel`                  |
| PATCH  | `/api/leave-requests/:id/review`      | Manager only   | Approve or reject a leave request          | `updateLeaveStatus()` in `timeTracking.ts`|
| GET    | `/api/leave-requests/team`            | Manager only   | Get all team members' pending requests     | Manager dashboard (future)                |

**POST Body (Submit Leave)**:
```json
{
  "startDate": "2026-02-20",
  "endDate": "2026-02-22",
  "leaveType": "Annual Leave",
  "reason": "Family event"
}
```

**PATCH Body (Review Leave)**:
```json
{
  "status": "approved",
  "reviewNote": "Enjoy!"
}
```

---

## 5. Authentication & Authorization

### 5.1 Strategy: JWT (JSON Web Tokens)

```
Registration/Login
        │
        ▼
 Server generates JWT ──► Stored in frontend (localStorage / httpOnly cookie)
        │
        ▼
 Every API call includes:
   Authorization: Bearer <token>
        │
        ▼
 auth middleware verifies token ──► attaches req.user = { _id, role, ... }
```

### 5.2 Middleware

| Middleware         | Purpose                                                              |
|--------------------|----------------------------------------------------------------------|
| `auth.js`          | Verifies JWT from `Authorization` header. Rejects 401 if invalid.    |
| `roleGuard.js`     | Higher-order middleware: `roleGuard('manager')` rejects 403 if role doesn't match. |

**Example usage in routes**:
```js
router.patch('/:id/review', auth, roleGuard('manager'), leaveRequestController.reviewLeave);
```

---

## 6. Environment Variables (`.env`)

```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/timely
# or MongoDB Atlas:
# MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/timely

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

## 7. Key npm Packages

| Package          | Purpose                                        |
|------------------|-------------------------------------------------|
| `express`        | Web framework                                  |
| `mongoose`       | MongoDB ODM                                    |
| `bcryptjs`       | Password hashing                               |
| `jsonwebtoken`   | JWT creation & verification                    |
| `cors`           | Cross-origin requests (Vite dev server → API)  |
| `dotenv`         | Environment variable management                |
| `express-validator` | Request body validation                     |
| `helmet`         | Security headers                               |
| `morgan`         | HTTP request logging (dev)                     |
| `nodemon`        | Auto-restart during development (devDependency)|

---

## 8. Frontend → Backend Data Mapping

This table shows exactly how each current frontend `localStorage` operation maps to a backend API call:

| Frontend Function (in `timeTracking.ts`)  | Current Storage   | Backend API Replacement                            |
|-------------------------------------------|-------------------|----------------------------------------------------|
| `getStoredEntries()`                      | `localStorage`    | `GET /api/time-entries`                            |
| `saveEntry(action)`                       | `localStorage`    | `POST /api/time-entries`                           |
| `calculateDailyHours(entries, date)`      | Computed in-memory| `GET /api/time-entries/daily-summary?date=`        |
| `calculateMonthlyHours(entries, y, m)`    | Computed in-memory| `GET /api/time-entries/monthly?year=&month=`       |
| `calculateYearlyHours(entries, y)`        | Computed in-memory| `GET /api/time-entries/yearly?year=`               |
| `getWorkingDaysInMonth(y, m, entries)`    | Computed in-memory| `GET /api/time-entries/working-days?year=&month=`  |
| `getWeeklyStats(weekStart, entries)`      | Computed in-memory| `GET /api/time-entries/weekly-stats?weekStart=`    |
| `getHoursBreakdown(entries, leaves, y, m)`| Computed in-memory| `GET /api/time-entries/hours-breakdown?year=&month=`|
| *(new)* `calculateOvertimeHours`          | *(new)*           | `GET /api/time-entries/overtime?date=` / `?year=&month=` / `?year=` |
| `getStoredLeaveRequests()`                | `localStorage`    | `GET /api/leave-requests`                          |
| `saveLeaveRequest(req)`                   | `localStorage`    | `POST /api/leave-requests`                         |
| `updateLeaveStatus(id, status, note)`     | `localStorage`    | `PATCH /api/leave-requests/:id/review`             |
| `getLeaveRequestsForMonth(y, m)`          | `localStorage`    | `GET /api/leave-requests/month?year=&month=`       |
| `getLeaveDatesForMonth(y, m)`             | `localStorage`    | `GET /api/leave-requests/month?year=&month=`       |

---

## 9. Server-Side Business Logic

The following calculations currently happen on the frontend and should be **replicated on the backend** (in `utils/hoursCalc.js`) to keep the API fast and avoid sending raw entries to the client for every aggregation:

| Function                  | Logic                                                                         |
|---------------------------|-------------------------------------------------------------------------------|
| `calculateDailyHours`     | Pair IN/OUT entries for a date, sum time differences                          |
| `calculateMonthlyHours`   | Sum daily hours for all days in a month                                       |
| `calculateYearlyHours`    | Sum monthly hours for all 12 months                                           |
| `getWorkDayStatus`        | Classify day as `working` (≥4h), `partial` (<4h), `absent` (0 entries), `weekend` |
| `isWeekend`               | Saturday = 6, Sunday = 0                                                      |
| `getWeeklyStats`          | Count days worked, total hours, incomplete shifts, expected working days       |
| `getHoursBreakdown`       | Split hours into regular (≤8h/day) vs overtime (>8h/day), plus leave hours    |
| `calculateLeaveHours`     | Count approved leave days × 8h, grouped by leave type                         |
| `calculateOvertimeHours`  | For each working day, if total hours > 8 → excess is overtime. Aggregates daily, monthly, or yearly. |

> **Why server-side?** Security (users can't tamper with hours), performance (MongoDB aggregation is faster than sending all entries), and consistency across clients.

### 9.1 Overtime Hours Computation

**Rule**: If a user works **more than 8 hours** in a single day, every hour beyond 8h is counted as **overtime**.

```
dailyHours = sum of all (OUT.timestamp − IN.timestamp) pairs for that day
regularHours = min(dailyHours, 8)
overtimeHours = max(0, dailyHours − 8)
```

**Endpoint**: `GET /api/time-entries/overtime`

| Query Param | Behaviour                                         | Example                                      |
|-------------|---------------------------------------------------|----------------------------------------------|
| `date`      | Returns overtime for a **single day**              | `?date=2026-02-18` → `{ overtimeHours: 1.5 }`|
| `year` + `month` | Returns total overtime for the **month**       | `?year=2026&month=1` → `{ overtimeHours: 12 }`|
| `year` only | Returns total overtime for the **entire year**     | `?year=2026` → `{ overtimeHours: 87.5 }`     |

**Response**:
```json
{
  "success": true,
  "data": {
    "regularHours": 160,
    "overtimeHours": 12.5,
    "totalHours": 172.5,
    "period": "2026-02"
  }
}
```

**Server-side logic** (in `utils/hoursCalc.js`):
```js
const calculateOvertimeHours = (entries, startDate, endDate) => {
  const REGULAR_HOURS_PER_DAY = 8;
  let regularTotal = 0;
  let overtimeTotal = 0;

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    if (isWeekend(d)) continue;
    const dayHours = calculateDailyHours(entries, new Date(d));
    if (dayHours > 0) {
      regularTotal  += Math.min(dayHours, REGULAR_HOURS_PER_DAY);
      overtimeTotal += Math.max(0, dayHours - REGULAR_HOURS_PER_DAY);
    }
  }

  return { regularHours: regularTotal, overtimeHours: overtimeTotal, totalHours: regularTotal + overtimeTotal };
};
```

> This mirrors and extends the existing frontend logic in `DayDetailPanel` (`overtime = Math.max(0, totalHours - 8)`) and `getHoursBreakdown`, but makes it a dedicated, queryable computation on the backend.

---

## 10. Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "End date must be after start date",
    "details": [...]
  }
}
```

### Error Codes

| Code                  | HTTP Status | When                                          |
|-----------------------|-------------|-----------------------------------------------|
| `VALIDATION_ERROR`    | 400         | Invalid request body / query params           |
| `UNAUTHORIZED`        | 401         | Missing or invalid JWT                        |
| `FORBIDDEN`           | 403         | Insufficient role (e.g. employee → approve)   |
| `NOT_FOUND`           | 404         | Resource doesn't exist                        |
| `DUPLICATE_ENTRY`     | 409         | Duplicate email on register                   |
| `ALREADY_PUNCHED_IN`  | 409         | Trying to punch IN when already punched in    |
| `ALREADY_PUNCHED_OUT` | 409         | Trying to punch OUT when not punched in       |
| `SERVER_ERROR`        | 500         | Unexpected error                              |

---

## 11. Punch Validation Rules

To maintain data integrity (matching frontend behavior):

1. **Cannot punch IN** if the last entry for today is IN (already working)
2. **Cannot punch OUT** if there's no open IN for today (not working)
3. Timestamp is always **server-generated** (`Date.now()`) — never trust client time
4. Entries are **immutable** after creation (no edit/delete for employees)

---

## 12. CORS Configuration

```js
// server.js
app.use(cors({
  origin: process.env.CORS_ORIGIN,    // http://localhost:5173 for dev
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

---

## 13. Scripts (`package.json`)

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node seeds/seed.js"
  }
}
```

The optional `seed.js` script can populate the database with sample users, time entries, and leave requests for development/testing.

---

## 14. Implementation Order (Recommended)

| Phase | What                                        | Why First                                      |
|-------|---------------------------------------------|------------------------------------------------|
| 1     | Project setup + Mongoose connection + Models| Foundation — everything depends on this        |
| 2     | Auth (register, login, JWT middleware)      | Every other route needs `req.user`             |
| 3     | Time Entry CRUD + aggregation endpoints     | Core feature — Punch In/Out + Dashboard        |
| 4     | Leave Request CRUD + approval workflow      | Second major feature                           |
| 5     | Server-side calculations (`hoursCalc.js`)   | Powers aggregation endpoints                   |
| 6     | Frontend integration (replace localStorage) | Wire up API calls using `axios` / `fetch`      |
| 7     | Testing + deploy                            | Verify everything works end-to-end             |

---

## 15. Future Enhancements (Out of Scope for MVP)

These are not part of the initial build but the architecture supports them:

- **Admin dashboard** — manage users, departments, global reports
- **Notifications** — email/push when leave is approved/rejected
- **Geolocation** — record location with punch entries
- **Export** — CSV/PDF reports for payroll
- **Shift scheduling** — pre-defined shift templates
- **Rate limiting** — prevent API abuse
- **Refresh tokens** — token rotation for better security
- **WebSocket** — real-time attendance updates for managers
