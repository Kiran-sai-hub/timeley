# Timely Backend — HOW IT WORKS

> Everything you need to know about the Timely backend API.

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Project Structure](#2-project-structure)
3. [Authentication System](#3-authentication-system)
4. [Database Models (Schemas)](#4-database-models-schemas)
5. [API Endpoints — Complete Reference](#5-api-endpoints--complete-reference)
6. [Business Logic & Calculations](#6-business-logic--calculations)
7. [Role-Based Access & Portal Switching](#7-role-based-access--portal-switching)
8. [Error Handling](#8-error-handling)
9. [Seed Data & Testing](#9-seed-data--testing)
10. [How Frontend Connects to Backend](#10-how-frontend-connects-to-backend)

---

## 1. Quick Start

### Prerequisites
- **Node.js** (v18+)
- **MongoDB** running locally (`mongod`) or a MongoDB Atlas connection string

### Setup

```bash
cd backendAPI

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env — set your MONGO_URI if not using default localhost:27017

# (Optional) Seed the database with sample data
npm run seed

# Start the dev server
npm run dev
```

The API will be available at `http://localhost:5000`.

### Verify It Works

```bash
curl http://localhost:5000/api/health
# → { "success": true, "message": "Timely API is running 🚀", "timestamp": "..." }
```

---

## 2. Project Structure

```
backendAPI/
├── server.js                 ← App entry point (Express setup + middleware + start)
├── config/
│   └── db.js                 ← Mongoose connection helper
├── models/
│   ├── User.js               ← User schema (name, email, password, role, leaveBalance)
│   ├── TimeEntry.js          ← Punch IN/OUT schema (userId, action, timestamp)
│   └── LeaveRequest.js       ← Leave request schema (userId, dates, type, status)
├── middleware/
│   ├── auth.js               ← JWT verification → attaches req.user
│   └── roleGuard.js          ← Role check (manager/admin) → 403 if denied
├── controllers/
│   ├── authController.js     ← Register, Login, Get Profile
│   ├── timeEntryController.js ← Punch, all hour-aggregation endpoints
│   └── leaveRequestController.js ← Leave CRUD + manager approval
├── routes/
│   ├── auth.js               ← POST /register, /login, GET /me
│   ├── timeEntries.js        ← POST /, GET /, /daily-summary, /monthly, etc.
│   └── leaveRequests.js      ← POST /, GET /, /month, /:id, PATCH /:id/review
├── utils/
│   └── hoursCalc.js          ← All calculation logic (hours, overtime, stats)
├── seeds/
│   └── seed.js               ← Sample data generator
├── .env                      ← Environment configuration (not in git)
└── .env.example              ← Template for .env
```

---

## 3. Authentication System

### How Login/Register Works

```
┌─────────┐     POST /api/auth/register    ┌──────────┐
│Frontend │ ─────── or ──────────────────→ │  Server  │
│         │     POST /api/auth/login       │          │
└─────────┘                                └──────────┘
                                                │
                                                ▼
                                            Validates input
                                            Hashes password (register)
                                            Checks credentials (login)
                                                │
                                                ▼
                                            Creates JWT token containing:
                                            { id: user._id, role: "employee" }
                                                │
                                                ▼
                                            Returns token + user object
```

### JWT Token Flow

Every protected API call must include:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

The `auth.js` middleware:
1. Extracts the token from the `Authorization` header
2. Verifies it using `JWT_SECRET`
3. Looks up the user in MongoDB
4. Checks `isActive` is `true`
5. Attaches the full user document to `req.user`
6. Calls `next()` — the route handler now has access to `req.user`

### Password Security

- Passwords are **never stored in plain text**
- Hashed using `bcryptjs` with 12 salt rounds
- The `password` field has `select: false` — it's excluded from all queries by default
- The `toJSON()` method strips the password before sending any response

---

## 4. Database Models (Schemas)

### 4.1 User

```
Collection: users
```

| Field            | Type       | Default     | Description                                    |
|------------------|------------|-------------|------------------------------------------------|
| `name`           | String     | —           | Full name (required)                           |
| `email`          | String     | —           | Unique, lowercase (required)                   |
| `password`       | String     | —           | bcrypt hash (hidden from queries)              |
| `role`           | String     | `employee`  | `employee`, `manager`, or `admin`              |
| `department`     | String     | `""`        | Department name                                |
| `managerId`      | ObjectId   | `null`      | References the manager User (for leave routing)|
| `leaveBalance.annualLeave` | Number | `18` | Days remaining for annual leave               |
| `leaveBalance.sickLeave`   | Number | `12` | Days remaining for sick leave                 |
| `leaveBalance.casualLeave` | Number | `6`  | Days remaining for casual leave               |
| `isActive`       | Boolean    | `true`      | Deactivated users cannot login                 |
| `createdAt`      | Date       | auto        | Mongoose timestamp                             |
| `updatedAt`      | Date       | auto        | Mongoose timestamp                             |

**Key behaviors:**
- `pre('save')` hook automatically hashes the password whenever it's modified
- `comparePassword(candidate)` method compares a plain text password against the stored hash
- `toJSON()` strips the `password` field from all API responses

### 4.2 TimeEntry

```
Collection: timeentries
```

| Field       | Type     | Default    | Description                          |
|-------------|----------|------------|--------------------------------------|
| `userId`    | ObjectId | —          | References User (required, indexed)  |
| `action`    | String   | —          | `IN` or `OUT` (required)             |
| `timestamp` | Date     | `Date.now` | Server-generated time of punch       |
| `note`      | String   | `""`       | Optional note for the entry          |

**Indexes:**
- `{ userId: 1, timestamp: -1 }` — compound index for fast per-user, date-range queries

### 4.3 LeaveRequest

```
Collection: leaverequests
```

| Field        | Type     | Default   | Description                                     |
|--------------|----------|-----------|-------------------------------------------------|
| `userId`     | ObjectId | —         | Employee who submitted (required, indexed)       |
| `startDate`  | Date     | —         | Leave start date (required)                      |
| `endDate`    | Date     | —         | Leave end date (required)                        |
| `leaveType`  | String   | —         | `Annual Leave`, `Sick Leave`, `Casual Leave`, or `Holiday` |
| `reason`     | String   | `""`      | Optional reason provided by employee             |
| `status`     | String   | `pending` | `pending`, `approved`, or `rejected`             |
| `appliedAt`  | Date     | `Date.now`| When the request was submitted                   |
| `reviewedAt` | Date     | `null`    | When the manager reviewed it                     |
| `reviewedBy` | ObjectId | `null`    | Manager who reviewed (references User)           |
| `reviewNote` | String   | `""`      | Manager's note on approval/rejection             |

**Indexes:**
- `{ userId: 1, status: 1 }`
- `{ startDate: 1, endDate: 1 }`

---

## 5. API Endpoints — Complete Reference

### 5.1 Health Check

| Method | Endpoint        | Auth | Description           |
|--------|-----------------|------|-----------------------|
| GET    | `/api/health`   | No   | Server status check   |

**Response:**
```json
{ "success": true, "message": "Timely API is running 🚀", "timestamp": "2026-02-18T..." }
```

---

### 5.2 Authentication (`/api/auth`)

#### POST `/api/auth/register` — Create a new account

**Body:**
```json
{
  "name": "Sai Kiran",
  "email": "sai@company.com",
  "password": "mypassword123",
  "role": "employee",
  "department": "Engineering"
}
```

- `role` is optional (defaults to `employee`). Can be `employee`, `manager`, or `admin`.
- `department` is optional.

**Response (201):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "_id": "65f...",
      "name": "Sai Kiran",
      "email": "sai@company.com",
      "role": "employee",
      "department": "Engineering",
      "leaveBalance": { "annualLeave": 18, "sickLeave": 12, "casualLeave": 6 },
      "isActive": true
    }
  }
}
```

**What happens internally:**
1. Validates name, email format, password (min 6 chars)
2. Checks if email already exists → 409 if duplicate
3. Password is automatically hashed via the `pre('save')` hook
4. Creates the user document in MongoDB
5. Signs a JWT with `{ id, role }` and returns it with the user object

---

#### POST `/api/auth/login` — Login and get token

**Body:**
```json
{
  "email": "sai@company.com",
  "password": "mypassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "_id": "...", "name": "...", "role": "employee", ... }
  }
}
```

**What happens internally:**
1. Validates email and password are present
2. Finds user by email (with `select('+password')` to include the hashed password)
3. Compares provided password against bcrypt hash
4. Checks `isActive` flag
5. Signs and returns JWT
6. **The `role` field in the response is what the frontend uses to decide manager vs employee portal**

---

#### GET `/api/auth/me` — Get current user's profile

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "name": "Sai Kiran",
      "email": "sai@company.com",
      "role": "manager",
      "department": "Engineering",
      "leaveBalance": { "annualLeave": 18, "sickLeave": 12, "casualLeave": 6 }
    }
  }
}
```

**What happens internally:**
1. `auth` middleware verifies JWT and loads user from DB
2. Returns `req.user` directly — the full user object (minus password)
3. **Frontend uses `user.role` to switch between employee portal and manager portal**

---

### 5.3 Time Entries (`/api/time-entries`)

> All endpoints require `Authorization: Bearer <token>`

#### POST `/api/time-entries` — Punch In or Out

**Body:**
```json
{ "action": "IN" }
```
or
```json
{ "action": "OUT" }
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "userId": "...",
    "action": "IN",
    "timestamp": "2026-02-18T09:00:00.000Z"
  }
}
```

**What happens internally:**
1. Validates `action` is `IN` or `OUT`
2. Gets all of today's entries for this user
3. Finds the last entry to check current status
4. **Validation rules:**
   - If trying to punch `IN` but last entry is already `IN` → **409 ALREADY_PUNCHED_IN**
   - If trying to punch `OUT` but not punched in → **409 ALREADY_PUNCHED_OUT**
5. Creates the entry with **server-generated timestamp** (never trusts client time)

---

#### GET `/api/time-entries` — List time entries

**Query params (all optional):**
- `date=2026-02-18` — Single day
- `startDate=2026-02-01&endDate=2026-02-28` — Date range
- `year=2026&month=1` — Entire month (month is 0-indexed: 0=Jan, 11=Dec)
- `year=2026` — Entire year
- No params → returns ALL entries for the user

**Response:** Array of TimeEntry objects, sorted newest first.

---

#### GET `/api/time-entries/daily-summary` — Daily hours summary

**Required:** `?date=2026-02-18`

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2026-02-18T...",
    "totalHours": 8.5,
    "entries": [ ... ]
  }
}
```

**Business logic:** Pairs consecutive IN→OUT entries, sums time differences.

---

#### GET `/api/time-entries/monthly` — Monthly aggregated hours

**Required:** `?year=2026&month=1`

**Response:**
```json
{
  "success": true,
  "data": {
    "year": 2026,
    "month": 1,
    "regularHours": 160,
    "overtimeHours": 12.5,
    "totalHours": 172.5
  }
}
```

---

#### GET `/api/time-entries/yearly` — Yearly aggregated hours

**Required:** `?year=2026`

**Response:**
```json
{
  "success": true,
  "data": {
    "year": 2026,
    "regularHours": 1920,
    "overtimeHours": 45.5,
    "totalHours": 1965.5
  }
}
```

---

#### GET `/api/time-entries/weekly-stats` — Weekly statistics

**Optional:** `?weekStart=2026-02-16` (defaults to current week)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalDaysWorked": 4,
    "totalHours": 34.5,
    "incompleteDays": 1,
    "expectedWorkingDays": 5
  }
}
```

**Business logic:**
- Iterates Mon–Fri of the given week
- `working` status (≥4h) = 1 day, `partial` (<4h) = 0.5 day
- `incompleteDays` = number of partial/open-shift days
- Attendance rate = `totalDaysWorked / expectedWorkingDays × 100`

---

#### GET `/api/time-entries/working-days` — Day-by-day month breakdown

**Required:** `?year=2026&month=1`

**Response:** Array of WorkingDay objects:
```json
{
  "success": true,
  "data": [
    {
      "date": "2026-02-01T...",
      "status": "working",
      "totalHours": 8.5,
      "entries": [ ... ],
      "hasIncompleteShift": false
    },
    {
      "date": "2026-02-02T...",
      "status": "weekend",
      "totalHours": 0,
      "entries": [],
      "hasIncompleteShift": false
    }
  ]
}
```

**Day statuses:**
| Status    | Meaning                                         |
|-----------|--------------------------------------------------|
| `working` | User punched in AND out, total hours ≥ 4         |
| `partial` | Punched in but < 4h, or incomplete shift         |
| `absent`  | No entries at all (weekday only)                 |
| `weekend` | Saturday or Sunday                               |

---

#### GET `/api/time-entries/hours-breakdown` — Pay period breakdown

**Required:** `?year=2026&month=1`

**Response:**
```json
{
  "success": true,
  "data": {
    "regularHours": 160,
    "overtime": 12.5,
    "leaveHours": {
      "Annual Leave": 16,
      "Sick Leave": 0,
      "Casual Leave": 8,
      "Holiday": 0
    },
    "totalWorked": 172.5
  }
}
```

**Business logic:**
- For each weekday in the month: `regular = min(dayHours, 8)`, `overtime = max(0, dayHours - 8)`
- Leave hours = approved leave days × 8h per day, grouped by leave type

---

#### GET `/api/time-entries/overtime` — Overtime computation

**Query params (one required):**
- `?date=2026-02-18` → Single day overtime
- `?year=2026&month=1` → Monthly overtime
- `?year=2026` → Yearly overtime

**Response:**
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

**Business logic (the overtime rule):**
```
For each working day (Mon–Fri):
  dailyHours = sum of all (OUT - IN) pairs
  if dailyHours > 8:
    regularHours += 8
    overtimeHours += (dailyHours - 8)
  else:
    regularHours += dailyHours
    overtimeHours += 0
```

**Example:** If an employee works 9.5 hours on a day:
- Regular: 8h
- Overtime: 1.5h

---

### 5.4 Leave Requests (`/api/leave-requests`)

> All endpoints require `Authorization: Bearer <token>`

#### POST `/api/leave-requests` — Submit a leave request

**Body:**
```json
{
  "startDate": "2026-02-25",
  "endDate": "2026-02-27",
  "leaveType": "Annual Leave",
  "reason": "Family vacation"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "userId": "...",
    "startDate": "2026-02-25T...",
    "endDate": "2026-02-27T...",
    "leaveType": "Annual Leave",
    "reason": "Family vacation",
    "status": "pending",
    "appliedAt": "2026-02-18T..."
  }
}
```

**What happens internally:**
1. Validates dates, leave type
2. Checks end date ≥ start date
3. Creates with `status: 'pending'`
4. Associates with `req.user._id`

---

#### GET `/api/leave-requests` — List my leave requests

**Optional query:** `?status=pending` (filter by `pending`, `approved`, or `rejected`)

**Response:** Array of LeaveRequest objects, sorted by `appliedAt` descending.

---

#### GET `/api/leave-requests/month` — Leave dates for a month

**Required:** `?year=2026&month=1`

**Response:**
```json
{
  "success": true,
  "data": {
    "leaves": [ ... ],
    "dateMap": {
      "Wed Feb 25 2026": "pending",
      "Thu Feb 26 2026": "pending",
      "Fri Feb 27 2026": "pending"
    }
  }
}
```

**Business logic:** Expands date ranges into individual dates, maps each date to its leave status. `approved` overrides `pending` if multiple leaves overlap.

---

#### GET `/api/leave-requests/:id` — Get single leave request

**Response:** Single LeaveRequest object.

---

#### PATCH `/api/leave-requests/:id/review` — Approve or reject (MANAGER ONLY)

**Body:**
```json
{
  "status": "approved",
  "reviewNote": "Enjoy your vacation!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "status": "approved",
    "reviewedAt": "2026-02-18T...",
    "reviewedBy": "manager-user-id",
    "reviewNote": "Enjoy your vacation!"
  }
}
```

**What happens internally:**
1. **Role check:** Only `manager` or `admin` roles can access this
2. Finds the leave request by ID
3. Verifies it's still `pending` (can't re-review)
4. Updates status, records reviewer and timestamp
5. **If approved:** deducts leave days from the employee's `leaveBalance`
   - `Annual Leave` → deducts from `leaveBalance.annualLeave`
   - `Sick Leave` → deducts from `leaveBalance.sickLeave`
   - `Casual Leave` → deducts from `leaveBalance.casualLeave`
   - `Holiday` → no deduction (company holidays don't use personal balance)

---

#### GET `/api/leave-requests/team` — View team's leave requests (MANAGER ONLY)

**Optional query:** `?status=pending`

**Response:**
```json
{
  "success": true,
  "data": {
    "teamMembers": [
      { "_id": "...", "name": "Alice Johnson", "email": "alice@timely.com", "department": "Engineering" }
    ],
    "leaves": [
      {
        "_id": "...",
        "userId": { "_id": "...", "name": "Alice Johnson", "email": "alice@timely.com" },
        "leaveType": "Annual Leave",
        "status": "pending",
        ...
      }
    ]
  }
}
```

**What happens internally:**
1. Finds all users whose `managerId` equals the current manager's `_id`
2. Fetches all leave requests for those team members
3. Populates `userId` with name, email, department for display

---

## 6. Business Logic & Calculations

All calculation logic lives in `utils/hoursCalc.js`. Here's what each function does:

### 6.1 `calculateDailyHours(dayEntries)`

Pairs consecutive `IN` → `OUT` entries and sums the hours:

```
9:00 IN → 12:00 OUT = 3h
13:00 IN → 17:30 OUT = 4.5h
Total = 7.5h
```

If the last entry is `IN` without a matching `OUT`, that segment is NOT counted (open shift).

### 6.2 `calculateAggregatedHours(entries, startDate, endDate)`

For each day in the range:
- Skips weekends
- Calculates daily hours
- Splits into **regular** (≤8h) and **overtime** (>8h)
- Returns `{ regularHours, overtimeHours, totalHours }`

### 6.3 `getWorkDayStatus(date, dayEntries)`

Returns one of:
- `weekend` — if Saturday or Sunday
- `absent` — if no entries exist for this weekday
- `working` — if punched in AND out, total hours ≥ 4
- `partial` — if total hours <4, or only punched in without out

### 6.4 `hasIncompleteShift(dayEntries)`

Returns `true` if:
- Odd number of entries (unpaired IN), OR
- No OUT entry exists

This triggers the red dot indicator on the calendar.

### 6.5 `getWorkingDaysInMonth(entries, year, month)`

Iterates every day of the month, returns an array with each day's:
- Status (working/partial/absent/weekend)
- Total hours
- Whether shift is incomplete
- The raw entries

### 6.6 `getWeeklyStats(entries, weekStartDate)`

For a 7-day week:
- `totalDaysWorked` — working days count as 1, partial as 0.5
- `totalHours` — sum of all hours
- `incompleteDays` — count of partial/open shifts
- `expectedWorkingDays` — weekdays in the week (usually 5)

### 6.7 `calculateLeaveHours(leaves)`

For approved leaves only:
- Counts the number of calendar days in each leave
- Multiplies by 8h per day
- Groups by leave type

### 6.8 `getHoursBreakdown(entries, leaves, year, month)`

Combines everything for the pay period breakdown:
- Regular hours, overtime, leave hours by type, total worked

---

## 7. Role-Based Access & Portal Switching

### How it works

The frontend determines whether to show the **Employee Portal** or **Manager Portal** based on the `role` field returned from the login/me endpoints:

```
Login/Register Response
        │
        ▼
  user.role === "manager"  ──→  Show Manager Portal
  user.role === "employee" ──→  Show Employee Portal
  user.role === "admin"    ──→  Show Admin Portal (future)
```

### What each role can do

| Feature                      | Employee | Manager | Admin |
|------------------------------|----------|---------|-------|
| Punch In/Out                 | ✅        | ✅       | ✅     |
| View own dashboard           | ✅        | ✅       | ✅     |
| View own calendar            | ✅        | ✅       | ✅     |
| Submit leave requests        | ✅        | ✅       | ✅     |
| View own leave requests      | ✅        | ✅       | ✅     |
| View team leave requests     | ❌        | ✅       | ✅     |
| Approve/Reject leave         | ❌        | ✅       | ✅     |

### How role-based access is enforced

1. **`auth` middleware** — runs on ALL protected routes. Verifies JWT token and loads user.
2. **`roleGuard('manager')` middleware** — runs only on manager-specific routes. Checks `req.user.role`.

```js
// Example: Only managers can approve leave
router.patch('/:id/review', auth, roleGuard('manager', 'admin'), reviewLeave);
```

If an employee tries to access a manager-only route, they get:
```json
{ "success": false, "error": { "code": "FORBIDDEN", "message": "Access denied. Required role: manager or admin" } }
```

### The `managerId` relationship

When registering an employee, you can set `managerId` to link them to a manager:

```json
{
  "name": "Alice",
  "email": "alice@company.com",
  "password": "123456",
  "role": "employee",
  "managerId": "the-manager-user-id"
}
```

This relationship is used by `GET /api/leave-requests/team` to find which employees report to a given manager.

---

## 8. Error Handling

### Response Format

Every error follows the same format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": [ ... ]
  }
}
```

### Error code reference

| Code                  | HTTP | When                                          |
|-----------------------|------|-----------------------------------------------|
| `VALIDATION_ERROR`    | 400  | Bad request body or query params              |
| `UNAUTHORIZED`        | 401  | Missing/invalid/expired JWT token             |
| `FORBIDDEN`           | 403  | Insufficient role for this endpoint           |
| `NOT_FOUND`           | 404  | Resource or route doesn't exist               |
| `DUPLICATE_ENTRY`     | 409  | Email already registered                      |
| `ALREADY_PUNCHED_IN`  | 409  | Trying to punch IN when already punched in    |
| `ALREADY_PUNCHED_OUT` | 409  | Trying to punch OUT when not punched in       |
| `SERVER_ERROR`        | 500  | Unexpected server error                       |

### Global error handler

Unhandled errors are caught by the global error handler in `server.js`:
- In `development` mode: full error message is returned
- In `production` mode: generic "Internal server error" message

---

## 9. Seed Data & Testing

### Running the seed script

```bash
cd backendAPI
npm run seed
```

This creates:

| Account               | Email                | Password      | Role     |
|------------------------|----------------------|---------------|----------|
| Sai Kiran (Manager)   | `manager@timely.com` | `password123` | manager  |
| Alice Johnson          | `alice@timely.com`   | `password123` | employee |
| Bob Smith              | `bob@timely.com`     | `password123` | employee |

Plus:
- **10 time entries** for Alice (5 working days, 9 AM → 5:30 PM = 8.5h/day with 0.5h overtime each)
- **2 pending leave requests** (one from Alice, one from Bob)

### Testing with curl

```bash
# 1. Login as employee
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@timely.com","password":"password123"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

# 2. Punch in
curl -X POST http://localhost:5000/api/time-entries \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"IN"}'

# 3. View today's summary
curl http://localhost:5000/api/time-entries/daily-summary?date=$(date +%Y-%m-%d) \
  -H "Authorization: Bearer $TOKEN"

# 4. Check overtime for this month
curl "http://localhost:5000/api/time-entries/overtime?year=2026&month=1" \
  -H "Authorization: Bearer $TOKEN"

# 5. Login as manager
MGMT=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@timely.com","password":"password123"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

# 6. View team's pending leaves
curl http://localhost:5000/api/leave-requests/team?status=pending \
  -H "Authorization: Bearer $MGMT"
```

---

## 10. How Frontend Connects to Backend

### Current state

The frontend currently stores everything in `localStorage` using functions in `src/lib/timeTracking.ts`.

### Integration plan

To connect the frontend to this backend, each `localStorage` function gets replaced by an API call:

| Frontend Function                 | Replace With                                      |
|-----------------------------------|---------------------------------------------------|
| `getStoredEntries()`              | `GET /api/time-entries`                           |
| `saveEntry(action)`               | `POST /api/time-entries`                          |
| `calculateDailyHours()`           | `GET /api/time-entries/daily-summary?date=`       |
| `calculateMonthlyHours()`         | `GET /api/time-entries/monthly?year=&month=`      |
| `calculateYearlyHours()`          | `GET /api/time-entries/yearly?year=`              |
| `getWorkingDaysInMonth()`         | `GET /api/time-entries/working-days?year=&month=` |
| `getWeeklyStats()`                | `GET /api/time-entries/weekly-stats?weekStart=`   |
| `getHoursBreakdown()`             | `GET /api/time-entries/hours-breakdown?year=&month=` |
| `getStoredLeaveRequests()`        | `GET /api/leave-requests`                         |
| `saveLeaveRequest()`              | `POST /api/leave-requests`                        |
| `updateLeaveStatus()`             | `PATCH /api/leave-requests/:id/review`            |
| `getLeaveDatesForMonth()`         | `GET /api/leave-requests/month?year=&month=`      |

### Portal switching

The frontend's `LeaveManagement` component already accepts a `role` prop:

```tsx
interface LeaveManagementProps {
  role?: 'employee' | 'manager';
}
```

Once auth is integrated:
1. Frontend calls `POST /api/auth/login` or `GET /api/auth/me`
2. Stores the `token` and `user` object
3. Passes `user.role` to components like `LeaveManagement`
4. Components conditionally render manager features (approve/reject buttons, team view) based on the role

---

## Environment Variables Reference

| Variable         | Default                          | Description                              |
|------------------|----------------------------------|------------------------------------------|
| `PORT`           | `5000`                           | API server port                          |
| `NODE_ENV`       | `development`                    | `development` or `production`            |
| `MONGO_URI`      | `mongodb://localhost:27017/timely`| MongoDB connection string                |
| `JWT_SECRET`     | *(must be set)*                  | Secret key for JWT signing               |
| `JWT_EXPIRES_IN` | `7d`                             | Token expiration time                    |
| `CORS_ORIGIN`    | `http://localhost:5173`          | Allowed frontend origin for CORS         |
