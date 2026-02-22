# 🚀 Timeley — SaaS Transformation Master Plan

> **Purpose:** This document is the single source of truth for transforming Timeley from a single-tenant time-tracking app into a full multi-tenant SaaS platform. It is written so that **any developer or AI agent** can pick it up at any phase and execute precisely.

---

## 📋 Current State (As Of Feb 2026)

### Architecture
- **Frontend:** React + Vite + TypeScript + Tailwind CSS + shadcn/ui + TanStack Query
- **Backend:** Node.js + Express.js + MongoDB (Mongoose) + JWT auth (httpOnly cookies)
- **Existing Models:** `User`, `TimeEntry`, `LeaveRequest`
- **Existing Roles:** `employee`, `manager`, `admin` (flat — no org scoping)
- **Auth Flow:** Open self-registration at `/api/auth/register` → always creates `employee` role
- **No multi-tenancy:** All users exist in a single flat namespace. No organization concept.

### Key Files Reference
| Area | File Path |
|------|-----------|
| User Model | `backendAPI/models/User.js` |
| TimeEntry Model | `backendAPI/models/TimeEntry.js` |
| LeaveRequest Model | `backendAPI/models/LeaveRequest.js` |
| Auth Controller | `backendAPI/controllers/authController.js` |
| Time Controller | `backendAPI/controllers/timeEntryController.js` |
| Leave Controller | `backendAPI/controllers/leaveRequestController.js` |
| Auth Middleware | `backendAPI/middleware/auth.js` |
| Role Guard | `backendAPI/middleware/roleGuard.js` |
| Server Entry | `backendAPI/server.js` |
| Auth Routes | `backendAPI/routes/auth.js` |
| Time Routes | `backendAPI/routes/timeEntries.js` |
| Leave Routes | `backendAPI/routes/leaveRequests.js` |
| Frontend API Client | `src/lib/api.ts` |
| Frontend Router | `src/App.tsx` |
| Login/Register Page | `src/pages/Login.tsx` |
| Auth Context | `src/contexts/AuthContext.tsx` |
| Main Dashboard | `src/pages/Index.tsx` |
| Protected Route | `src/components/ProtectedRoute.tsx` |

---

## 🏗️ The Vision

**Top-down org onboarding:**
1. A person visits Timeley and clicks **"Onboard Your Organization"**
2. They provide their org name + an email in the format `admin@<org-domain>.<tld>`
3. We send a **verification email** to that address
4. Once verified, we create the **Organization** and the user becomes the **Owner** (first admin)
5. The Owner/Admin can then create **departments**, **managers**, and **employees**
6. Managers can create/register employees in their department
7. **Employees never self-register** — they are always created by a manager or admin
8. **Strict tenant isolation** — every admin/manager/employee can only see and manage data within their own organization

### Role Hierarchy
```
Owner (the admin who onboarded the org — cannot be demoted or removed)
  └── Admin (can manage everything within their org; created by Owner)
        └── Manager (manages a department; created by Admin)
              └── Employee (tracks time & requests leaves; created by Admin or Manager)
```

### Role Scoping
- All roles are scoped to their organization
- Admins can manage users in their org, but cannot see or manage users in other orgs
- Managers can manage users in their department, but cannot see or manage users in other orgs or departments
- Employees can only see and manage their own data

### Key Rules
- Multiple admins per org are allowed, but ONLY the Owner can promote/demote admins
- Admins can create/remove managers and employees, approve/reject leaves, view all org data
- Managers can create/remove employees in their department, approve/reject leaves for their team
- Employees can only view their own data, track time, and request leaves
- **No cross-org data access** — middleware enforces org scoping on every API call

---

## 🔷 PHASE 1: Backend Foundation — Organization Model & Tenant Isolation

> **Goal:** Create the Organization and Department models, update the User model, and add tenant-isolation middleware so that every API call is scoped to the requesting user's org.

### Step 1.1: Create the Organization Model
**File:** `backendAPI/models/Organization.js` *(NEW)*

```js
// Schema fields:
{
  name:        { type: String, required: true, trim: true },             // "Acme Corp"
  slug:        { type: String, required: true, unique: true, lowercase: true }, // "acme-corp" (auto-generated from name)
  domain:      { type: String, required: true, unique: true, lowercase: true }, // "acme.com" (extracted from admin email)
  ownerId:     { type: ObjectId, ref: 'User', required: true },          // the user who onboarded the org
  isActive:    { type: Boolean, default: true },
  settings: {
    workingHoursPerDay:  { type: Number, default: 8 },
    workingDaysPerWeek:  { type: Number, default: 5 },
    defaultLeaveBalance: {
      annualLeave:  { type: Number, default: 18 },
      sickLeave:    { type: Number, default: 12 },
      casualLeave:  { type: Number, default: 6 },
    },
    timezone: { type: String, default: 'UTC' },
  },
  timestamps: true
}
```

**Indexes:**
- `{ slug: 1 }` — unique
- `{ domain: 1 }` — unique

**Pre-save hook:** Auto-generate `slug` from `name` (lowercase, replace spaces with hyphens, strip special chars).

---

### Step 1.2: Create the Department Model
**File:** `backendAPI/models/Department.js` *(NEW)*

```js
// Schema fields:
{
  name:           { type: String, required: true, trim: true },         // "Engineering"
  organizationId: { type: ObjectId, ref: 'Organization', required: true },
  managerId:      { type: ObjectId, ref: 'User', default: null },       // assigned manager
  description:    { type: String, default: '' },
  isActive:       { type: Boolean, default: true },
  timestamps: true
}
```

**Indexes:**
- `{ organizationId: 1, name: 1 }` — compound unique (no duplicate dept names within an org)

---

### Step 1.3: Update the User Model
**File:** `backendAPI/models/User.js` *(MODIFY)*

**Changes:**
1. Add `organizationId` field: `{ type: ObjectId, ref: 'Organization', required: true, index: true }`
2. Add `departmentId` field: `{ type: ObjectId, ref: 'Department', default: null }`
3. Update `role` enum: `['employee', 'manager', 'admin', 'owner']`
4. Keep existing `department` (string) as a **deprecated** field for backward compat during migration, but all new code uses `departmentId`
5. Add `invitedBy` field: `{ type: ObjectId, ref: 'User', default: null }` — tracks who created this user

**Updated schema additions:**
```js
organizationId: { type: ObjectId, ref: 'Organization', required: true, index: true },
departmentId:   { type: ObjectId, ref: 'Department', default: null },
role:           { type: String, enum: ['employee', 'manager', 'admin', 'owner'], default: 'employee' },
invitedBy:      { type: ObjectId, ref: 'User', default: null },
```

---

### Step 1.4: Update the TimeEntry Model
**File:** `backendAPI/models/TimeEntry.js` *(MODIFY)*

**Changes:**
1. Add `organizationId` field: `{ type: ObjectId, ref: 'Organization', required: true, index: true }`
2. Update compound index: `{ organizationId: 1, userId: 1, timestamp: -1 }`

---

### Step 1.5: Update the LeaveRequest Model
**File:** `backendAPI/models/LeaveRequest.js` *(MODIFY)*

**Changes:**
1. Add `organizationId` field: `{ type: ObjectId, ref: 'Organization', required: true, index: true }`
2. Update indexes to include `organizationId`

---

### Step 1.6: Create Tenant Isolation Middleware
**File:** `backendAPI/middleware/tenantIsolation.js` *(NEW)*

**Purpose:** After `auth` middleware runs (so `req.user` is set), this middleware:
1. Reads `req.user.organizationId`
2. Attaches `req.organizationId` to the request
3. All subsequent controller queries MUST include `{ organizationId: req.organizationId }` as a filter

```js
// Pseudocode:
const tenantIsolation = (req, res, next) => {
  if (!req.user || !req.user.organizationId) {
    return res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User is not associated with any organization' } });
  }
  req.organizationId = req.user.organizationId;
  next();
};
```

---

### Step 1.7: Update Role Guard Middleware
**File:** `backendAPI/middleware/roleGuard.js` *(MODIFY)*

**Changes:**
1. Add `owner` to the recognized roles
2. No other logic changes needed — the role guard just checks if the user's role is in the allowed list

---

### Step 1.8: Update Auth Middleware (JWT Payload)
**File:** `backendAPI/middleware/auth.js` *(MODIFY)*

**Changes:**
1. After fetching `req.user`, ensure `organizationId` is populated on `req.user`
2. No other changes needed — the existing logic is fine

**File:** `backendAPI/controllers/authController.js` *(MODIFY)*

**Changes:**
1. Update `signToken()` to include `organizationId` in the JWT payload:
   ```js
   jwt.sign({ id: user._id, role: user.role, organizationId: user.organizationId }, ...)
   ```

---

### Step 1.9: Update All Existing Controllers for Tenant Scoping

#### `backendAPI/controllers/timeEntryController.js` *(MODIFY)*
- Every query that touches `TimeEntry` must add `organizationId: req.organizationId` filter
- When creating a new TimeEntry, auto-set `organizationId` from `req.organizationId`

#### `backendAPI/controllers/leaveRequestController.js` *(MODIFY)*
- Every query that touches `LeaveRequest` must add `organizationId: req.organizationId` filter
- When creating a new LeaveRequest, auto-set `organizationId` from `req.organizationId`
- The team leaves query must scope by org AND by the manager's department

---

### Step 1.10: Apply Tenant Middleware to All Routes
**File:** `backendAPI/server.js` *(MODIFY)*

**Changes:**
1. Import `tenantIsolation` middleware
2. Apply it AFTER `auth` on all protected routes:
   ```js
   app.use('/api/time-entries', auth, tenantIsolation, timeEntryRoutes);
   app.use('/api/leave-requests', auth, tenantIsolation, leaveRequestRoutes);
   ```
3. Auth routes (`/api/auth`) do NOT get tenant isolation (login/register happen before org context)

---

### Step 1.11: Database Migration Script
**File:** `backendAPI/seeds/migrateToMultiTenant.js` *(NEW)*

**Purpose:** For any existing data in the DB, this script:
1. Creates a default organization called "Legacy Organization"
2. Assigns all existing users to that organization
3. Assigns all existing TimeEntries and LeaveRequests to that organization
4. Creates departments matching the existing string-based `department` field on users
5. Links users to their new `departmentId`

---

## 🔷 PHASE 2: Organization Onboarding Flow (Backend)

> **Goal:** Build the API endpoints for org registration, email verification, and the admin's first-time setup.

### Step 2.1: Create Email Utility
**File:** `backendAPI/utils/email.js` *(NEW or MODIFY existing)*

**Purpose:** Send verification emails using Nodemailer (or a service like SendGrid/Resend).

**Functions:**
- `sendVerificationEmail(email, verificationToken, orgName)` — sends a 6-digit code or a verification link
- `sendInviteEmail(email, inviterName, orgName, tempPassword)` — sends an invite to new employees/managers

**Config additions needed:**
- Add to `.env`: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`
- Or use a service API key: `EMAIL_SERVICE_API_KEY`

---

### Step 2.2: Create Org Verification Token Model
**File:** `backendAPI/models/OrgVerification.js` *(NEW)*

```js
{
  email:     { type: String, required: true },
  orgName:   { type: String, required: true },
  token:     { type: String, required: true },        // 6-digit code or UUID
  password:  { type: String, required: true },         // hashed password they set during registration
  adminName: { type: String, required: true },         // the name they provided
  expiresAt: { type: Date, required: true },           // 24-hour expiry
  verified:  { type: Boolean, default: false },
  timestamps: true
}
```

**Index:** `{ token: 1 }`, `{ expiresAt: 1 }` (TTL index to auto-delete after expiry)

---

### Step 2.3: Create Organization Controller
**File:** `backendAPI/controllers/orgController.js` *(NEW)*

**Endpoints:**

#### `POST /api/org/register` — Start Org Onboarding
**Access:** Public (no auth required)
**Request Body:**
```json
{
  "orgName": "Acme Corp",
  "adminName": "John Doe",
  "adminEmail": "admin@acme.com",
  "password": "SecurePass123"
}
```
**Logic:**
1. Validate that `adminEmail` starts with `admin@` — reject otherwise
2. Extract domain from email (e.g., `acme.com`)
3. Check if an org with that domain already exists → 409 Conflict
4. Check if the email is already registered as a user → 409 Conflict
5. Generate a 6-digit verification code
6. Hash the password and store everything in `OrgVerification` collection
7. Send verification email with the code
8. Return `{ success: true, message: 'Verification email sent' }`

#### `POST /api/org/verify` — Complete Org Setup
**Access:** Public (no auth required)
**Request Body:**
```json
{
  "email": "admin@acme.com",
  "code": "482910"
}
```
**Logic:**
1. Find the `OrgVerification` document by email + code
2. If not found or expired → 400 error
3. Create the `Organization` document
4. Create the `User` document with role `owner` and link to org
5. Set `Organization.ownerId` = new user's ID
6. Delete the `OrgVerification` record
7. Sign JWT and return token + user (auto-login)
8. Return `{ success: true, data: { token, user, organization } }`

#### `GET /api/org/me` — Get My Organization Details
**Access:** Authenticated + Tenant Isolated
**Logic:** Return the organization details for `req.organizationId`

#### `PATCH /api/org/settings` — Update Org Settings
**Access:** Owner or Admin only
**Logic:** Update `settings` sub-document (working hours, leave balances, timezone)

---

### Step 2.4: Create Organization Routes
**File:** `backendAPI/routes/org.js` *(NEW)*

```js
// Public routes (no auth)
POST   /api/org/register    → orgController.registerOrg
POST   /api/org/verify      → orgController.verifyOrg

// Authenticated routes
GET    /api/org/me           → auth + tenantIsolation + orgController.getMyOrg
PATCH  /api/org/settings     → auth + tenantIsolation + roleGuard('owner','admin') + orgController.updateSettings
```

---

### Step 2.5: Register Org Routes in Server
**File:** `backendAPI/server.js` *(MODIFY)*

Add:
```js
import orgRoutes from './routes/org.js';
app.use('/api/org', orgRoutes);
```

---

## 🔷 PHASE 3: User Management by Admin & Manager (Backend)

> **Goal:** Admins can create managers, departments, and employees. Managers can create employees in their department. Self-registration for employees is removed.

### Step 3.1: Create Admin/User Management Controller
**File:** `backendAPI/controllers/userManagementController.js` *(NEW)*

**Endpoints:**

#### `POST /api/users/invite` — Create a New User (Admin or Manager)
**Access:** Admin/Owner can create any role (except owner). Manager can only create employees in their department.
**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@acme.com",
  "role": "employee",
  "departmentId": "<department_objectid>",
  "password": "TempPass123"
}
```
**Logic:**
1. Validate that the requesting user has permission to create this role:
   - Owner/Admin → can create `admin`, `manager`, `employee`
   - Manager → can ONLY create `employee`, and ONLY in their own department
   - Employee → cannot create anyone (403)
2. Nobody can create an `owner` — there's only one per org (the founder)
3. Ensure the email is not already registered
4. Create the user with `organizationId = req.organizationId`, `invitedBy = req.user._id`
5. Optionally send an invite email with the temporary password
6. Return the created user

#### `GET /api/users` — List Users in My Org
**Access:** Admin/Owner sees all users. Manager sees only their department's employees.
**Query Params:** `?role=employee&departmentId=xxx&page=1&limit=20`
**Logic:**
1. Query `User.find({ organizationId: req.organizationId, ...filters })`
2. For managers: auto-filter to their `departmentId`
3. Return paginated results

#### `GET /api/users/:id` — Get Single User
**Access:** Admin/Owner can get any user in the org. Manager can get users in their dept. Employee can get their own profile.
**Logic:** Fetch user, verify `organizationId` matches, apply role-based visibility.

#### `PATCH /api/users/:id` — Update a User
**Access:** Admin/Owner can update any user in the org (except change someone else to owner). Manager can update employees in their dept.
**Request Body:** `{ name, email, role, departmentId, isActive, leaveBalance }`
**Logic:**
1. Find user, verify they belong to `req.organizationId`
2. Apply role-based permission checks
3. Prevent demoting or removing the org owner
4. Update and return

#### `DELETE /api/users/:id` — Deactivate a User (Soft Delete)
**Access:** Admin/Owner can deactivate anyone except the owner. Manager can deactivate employees in their dept.
**Logic:** Set `isActive = false` (never hard-delete — preserve time tracking data)

---

### Step 3.2: Create Department Management Controller
**File:** `backendAPI/controllers/departmentController.js` *(NEW)*

**Endpoints:**

#### `POST /api/departments` — Create Department
**Access:** Admin/Owner only
**Request Body:** `{ "name": "Engineering", "description": "...", "managerId": "<optional>" }`
**Logic:**
1. Ensure no duplicate dept name in this org
2. If `managerId` provided, verify that user exists in this org and has role `manager`
3. Create department with `organizationId = req.organizationId`

#### `GET /api/departments` — List All Departments in Org
**Access:** Any authenticated user in the org can list departments
**Logic:** `Department.find({ organizationId: req.organizationId, isActive: true })`

#### `GET /api/departments/:id` — Get Department Details
**Access:** Any authenticated user in the org
**Logic:** Fetch department, verify org match, populate manager info

#### `PATCH /api/departments/:id` — Update Department
**Access:** Admin/Owner only
**Request Body:** `{ name, description, managerId, isActive }`
**Logic:** Update fields, re-validate managerId if changed

#### `DELETE /api/departments/:id` — Deactivate Department
**Access:** Admin/Owner only
**Logic:**
1. Set `isActive = false`
2. Optionally reassign or unassign employees from this department

---

### Step 3.3: Create User Management Routes
**File:** `backendAPI/routes/users.js` *(NEW)*

```js
POST   /api/users/invite      → auth + tenantIsolation + roleGuard('owner','admin','manager') + createUser
GET    /api/users              → auth + tenantIsolation + roleGuard('owner','admin','manager') + listUsers
GET    /api/users/:id          → auth + tenantIsolation + getUser
PATCH  /api/users/:id          → auth + tenantIsolation + roleGuard('owner','admin','manager') + updateUser
DELETE /api/users/:id          → auth + tenantIsolation + roleGuard('owner','admin') + deactivateUser
```

---

### Step 3.4: Create Department Routes
**File:** `backendAPI/routes/departments.js` *(NEW)*

```js
POST   /api/departments        → auth + tenantIsolation + roleGuard('owner','admin') + createDept
GET    /api/departments        → auth + tenantIsolation + listDepts
GET    /api/departments/:id    → auth + tenantIsolation + getDept
PATCH  /api/departments/:id    → auth + tenantIsolation + roleGuard('owner','admin') + updateDept
DELETE /api/departments/:id    → auth + tenantIsolation + roleGuard('owner','admin') + deactivateDept
```

---

### Step 3.5: Register New Routes in Server
**File:** `backendAPI/server.js` *(MODIFY)*

Add:
```js
import userRoutes from './routes/users.js';
import departmentRoutes from './routes/departments.js';

app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
```

---

### Step 3.6: Remove/Disable Public Self-Registration
**File:** `backendAPI/controllers/authController.js` *(MODIFY)*

**Changes:**
1. Remove or disable the `POST /api/auth/register` endpoint
2. Or repurpose it: keep it but ONLY for org onboarding (redirect to `/api/org/register`)
3. The login endpoint remains unchanged — users still log in with email + password
4. Update `signToken()` to include `organizationId` in the JWT

**File:** `backendAPI/routes/auth.js` *(MODIFY)*
- Remove the `/register` route (or return a message pointing to org onboarding)

---

## 🔷 PHASE 4: Frontend — Onboarding UI & Updated Auth Flow

> **Goal:** Build the "Onboard Your Org" UI, replace self-registration with admin/manager-driven user creation, and update the login flow.

### Step 4.1: Update the Login Page
**File:** `src/pages/Login.tsx` *(MODIFY)*

**Changes:**
1. Remove the "Register" tab entirely (employees no longer self-register)
2. Add a prominent **"Onboard Your Organization"** button/link below the login form
3. This button navigates to `/onboard`

**Updated UI layout:**
```
┌────────────────────────────┐
│        Timeley             │
│  Sign in to your account   │
│                            │
│  [Email input]             │
│  [Password input]          │
│  [Sign In button]          │
│                            │
│  ─── or ───                │
│                            │
│  [Onboard Your Org]        │
└────────────────────────────┘
```

---

### Step 4.2: Create Onboarding Pages
**Files:** *(ALL NEW)*
- `src/pages/Onboard.tsx` — Main onboarding page
- `src/components/OnboardingWizard.tsx` — Multi-step wizard component

**Step 1: Organization Details**
```
┌────────────────────────────┐
│  Step 1 of 3: Your Org     │
│                            │
│  Organization Name: [____] │
│  Your Full Name:    [____] │
│  Admin Email:       [____] │
│    (must be admin@your.org)│
│  Password:          [____] │
│  Confirm Password:  [____] │
│                            │
│  [Next →]                  │
└────────────────────────────┘
```

**Step 2: Verify Email**
```
┌────────────────────────────┐
│  Step 2 of 3: Verify Email │
│                            │
│  We sent a 6-digit code to │
│  admin@acme.com            │
│                            │
│  Enter code: [_ _ _ _ _ _] │
│                            │
│  [Verify & Continue →]     │
│  [Resend Code]             │
└────────────────────────────┘
```

**Step 3: Success — You're In!**
```
┌────────────────────────────┐
│  Step 3 of 3: All Set!     │
│                            │
│  Acme Corp is ready!       │
│  You are the org owner.    │
│                            │
│  Next steps:               │
│  • Create departments      │
│  • Invite managers         │
│  • Add employees           │
│                            │
│  [Go to Dashboard →]       │
└────────────────────────────┘
```

---

### Step 4.3: Update the Frontend API Client
**File:** `src/lib/api.ts` *(MODIFY)*

**Add new API functions:**
```ts
// Organization API
export const orgApi = {
  register: async (data: OrgRegisterData) => apiFetch('/org/register', { method: 'POST', body: data }),
  verify: async (data: { email: string; code: string }) => apiFetch('/org/verify', { method: 'POST', body: data }),
  getMyOrg: async () => apiFetch('/org/me'),
  updateSettings: async (settings: OrgSettings) => apiFetch('/org/settings', { method: 'PATCH', body: settings }),
};

// User Management API
export const userManagementApi = {
  inviteUser: async (data: InviteUserData) => apiFetch('/users/invite', { method: 'POST', body: data }),
  listUsers: async (params?) => apiFetch(`/users?${new URLSearchParams(params)}`),
  getUser: async (id: string) => apiFetch(`/users/${id}`),
  updateUser: async (id: string, data) => apiFetch(`/users/${id}`, { method: 'PATCH', body: data }),
  deactivateUser: async (id: string) => apiFetch(`/users/${id}`, { method: 'DELETE' }),
};

// Department API
export const departmentApi = {
  create: async (data) => apiFetch('/departments', { method: 'POST', body: data }),
  list: async () => apiFetch('/departments'),
  get: async (id: string) => apiFetch(`/departments/${id}`),
  update: async (id: string, data) => apiFetch(`/departments/${id}`, { method: 'PATCH', body: data }),
  deactivate: async (id: string) => apiFetch(`/departments/${id}`, { method: 'DELETE' }),
};
```

**Update the `User` interface:**
```ts
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'employee' | 'manager' | 'admin' | 'owner';
  organizationId: string;
  departmentId?: string;
  leaveBalance: { annualLeave: number; sickLeave: number; casualLeave: number };
  isActive: boolean;
}
```

---

### Step 4.4: Update Auth Context
**File:** `src/contexts/AuthContext.tsx` *(MODIFY)*

**Changes:**
1. Remove the `register` function (no more self-registration)
2. Add organization info to the auth state
3. After login, also fetch org details and store in context

---

### Step 4.5: Update Protected Routes
**File:** `src/components/ProtectedRoute.tsx` *(MODIFY)*

**Changes:**
1. Add role-based route guards:
   - `AdminRoute` — only `owner` and `admin`
   - `ManagerRoute` — only `owner`, `admin`, and `manager`
2. Redirect unauthorized users to the main dashboard with a toast message

---

### Step 4.6: Update the Router
**File:** `src/App.tsx` *(MODIFY)*

**Add new routes:**
```tsx
<Route path="/onboard" element={<PublicRoute><Onboard /></PublicRoute>} />
<Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
```

---

## 🔷 PHASE 5: Admin Dashboard (Frontend)

> **Goal:** Build the admin panel where owners/admins manage their organization.

### Step 5.1: Create Admin Dashboard Layout
**File:** `src/pages/AdminDashboard.tsx` *(NEW)*

**Sub-routes:**
- `/admin` — Dashboard overview (org stats, quick actions)
- `/admin/departments` — Department management
- `/admin/users` — User management
- `/admin/settings` — Org settings

**Layout:**
```
┌─────────────────────────────────────────────┐
│  Sidebar              │  Main Content       │
│                       │                     │
│  Overview             │  [Dynamic content   │
│  Departments          │   based on selected │
│  Users                │   sidebar item]     │
│  Settings             │                     │
│                       │                     │
│  ← Back to App        │                     │
└─────────────────────────────────────────────┘
```

---

### Step 5.2: Create Department Management Page
**File:** `src/components/admin/DepartmentManagement.tsx` *(NEW)*

**Features:**
- View all departments in a table/card grid
- "Create Department" button → opens a modal with name, description, assign manager (dropdown of managers)
- Edit department inline or via modal
- Deactivate department (soft delete)
- Shows count of employees per department

---

### Step 5.3: Create User Management Page
**File:** `src/components/admin/UserManagement.tsx` *(NEW)*

**Features:**
- Table listing all users in the org (paginated)
- Filters: by role, by department, by status (active/inactive)
- Search by name or email
- "Invite User" button → modal:
  - Name, Email, Role (dropdown), Department (dropdown), Temp Password
  - "Send Invite Email" checkbox
- Edit user: change role, department, reset password, update leave balance
- Deactivate/reactivate user
- Owner-only: promote user to admin / demote admin to manager

---

### Step 5.4: Create Org Settings Page
**File:** `src/components/admin/OrgSettings.tsx` *(NEW)*

**Features:**
- Edit org name
- Set default working hours per day
- Set working days per week
- Set default leave balances for new employees
- Set timezone
- View org domain (read-only)
- View org owner (read-only)

---

### Step 5.5: Create Admin Overview/Dashboard Page
**File:** `src/components/admin/AdminOverview.tsx` *(NEW)*

**Features:**
- Total employees, managers, admins count
- Total departments
- Pending leave requests count (quick link)
- Active employees today (currently punched in)
- Quick action buttons: "Add Employee", "Create Department"

---

## 🔷 PHASE 6: Scope Existing Features to Org & Update Manager View

> **Goal:** Ensure time tracking, leave management, and all existing features are properly org-scoped in the frontend.

### Step 6.1: Update Time Tracker Component
**File:** `src/components/TimeTracker.tsx` *(MODIFY)*

**Changes:**
- No major changes needed if the backend properly scopes data
- The component already works with the current user's data
- Verify that the API returns only org-scoped data

---

### Step 6.2: Update Leave Management Component
**File:** `src/components/LeaveManagement.tsx` *(MODIFY)*

**Changes:**
- Team leaves tab: should now show department-scoped leaves (for managers) or all org leaves (for admins)
- The backend handles scoping, but verify the UI correctly displays org-scoped data

---

### Step 6.3: Update Calendar View
**File:** `src/components/CalendarView.tsx` *(MODIFY)*

**Changes:**
- Minimal changes — the calendar should already work with user-scoped data
- Verify it works correctly with the updated API responses

---

### Step 6.4: Update Manager-Specific Views
**Files:** Various components

**Changes:**
- Managers should see a "My Team" view with employees in their department
- Quick access to approve/reject leaves from their team
- Ability to invite new employees to their department

---

### Step 6.5: Add Org Name & Context to the UI
**File:** `src/pages/Index.tsx` *(MODIFY)*, various components

**Changes:**
- Show the organization name in the header/sidebar
- Show the current user's role badge
- Add an "Admin Panel" link in the nav for owner/admin users

---

## 🔷 PHASE 7: Polish, Security Hardening & Edge Cases

> **Goal:** Final security review, edge case handling, and production readiness.

### Step 7.1: Security Audit
- **CRITICAL:** Verify that EVERY database query in EVERY controller includes `organizationId` filter
- Automated check: search all controller files for `find(`, `findOne(`, `findById(` calls and ensure they include org scoping
- Test cross-org access attempts: a user from Org A should NEVER be able to access data from Org B

### Step 7.2: Input Validation
- Add express-validator rules to ALL new endpoints
- Validate email format for org registration
- Validate that `admin@` prefix rule is enforced
- Sanitize all string inputs

### Step 7.3: Rate Limiting for Onboarding
**File:** `backendAPI/server.js` *(MODIFY)*

**Changes:**
- Add a specific rate limit for `/api/org/register` (e.g., 3 attempts per 15 minutes per IP)
- Add a specific rate limit for `/api/org/verify` (e.g., 5 attempts per 15 minutes per email)

### Step 7.4: Error Handling
- Ensure all new endpoints have proper try/catch blocks
- Return consistent error response format:
  ```json
  { "success": false, "error": { "code": "ERROR_CODE", "message": "Human readable message" } }
  ```

### Step 7.5: Data Integrity
- Prevent deleting an org owner account
- Prevent deleting the last admin of an org
- When deactivating a manager, reassign their employees' `managerId`
- When deactivating a department, handle employees in that department

### Step 7.6: API Response Updates
- All user-related API responses should NEVER include data from other organizations
- Populate `organizationId` → org name in user responses for frontend convenience
- Populate `departmentId` → department name in user responses

### Step 7.7: Update `.env.example`
**File:** `backendAPI/.env.example` *(MODIFY)*

Add new environment variables:
```
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@timeley.app

# Or use a service like Resend
# RESEND_API_KEY=re_xxxxx
```

---

## 📦 New Dependencies Needed

### Backend
| Package | Purpose |
|---------|---------|
| `nodemailer` | Sending verification & invite emails |
| `slugify` | Generating org slugs from names |
| `crypto` (built-in) | Generating verification codes |

### Frontend
| Package | Purpose |
|---------|---------|
| (none expected) | shadcn/ui already provides all needed components |

---

## 🗂️ Summary: New & Modified Files

### New Files (Backend)
| File | Purpose |
|------|---------|
| `backendAPI/models/Organization.js` | Organization schema |
| `backendAPI/models/Department.js` | Department schema |
| `backendAPI/models/OrgVerification.js` | Temp verification tokens |
| `backendAPI/middleware/tenantIsolation.js` | Org-scoping middleware |
| `backendAPI/controllers/orgController.js` | Org onboarding endpoints |
| `backendAPI/controllers/userManagementController.js` | User CRUD for admins |
| `backendAPI/controllers/departmentController.js` | Department CRUD |
| `backendAPI/routes/org.js` | Org routes |
| `backendAPI/routes/users.js` | User management routes |
| `backendAPI/routes/departments.js` | Department routes |
| `backendAPI/seeds/migrateToMultiTenant.js` | Data migration script |

### New Files (Frontend)
| File | Purpose |
|------|---------|
| `src/pages/Onboard.tsx` | Org onboarding page |
| `src/components/OnboardingWizard.tsx` | Multi-step onboarding wizard |
| `src/pages/AdminDashboard.tsx` | Admin panel layout |
| `src/components/admin/AdminOverview.tsx` | Admin dashboard overview |
| `src/components/admin/DepartmentManagement.tsx` | Dept management UI |
| `src/components/admin/UserManagement.tsx` | User management UI |
| `src/components/admin/OrgSettings.tsx` | Org settings UI |

### Modified Files
| File | Changes |
|------|---------|
| `backendAPI/models/User.js` | Add `organizationId`, `departmentId`, `invitedBy`; update role enum |
| `backendAPI/models/TimeEntry.js` | Add `organizationId` |
| `backendAPI/models/LeaveRequest.js` | Add `organizationId` |
| `backendAPI/middleware/auth.js` | Ensure org info on `req.user` |
| `backendAPI/middleware/roleGuard.js` | Add `owner` role |
| `backendAPI/controllers/authController.js` | Update JWT payload; remove/disable self-register |
| `backendAPI/controllers/timeEntryController.js` | Add org scoping to all queries |
| `backendAPI/controllers/leaveRequestController.js` | Add org scoping to all queries |
| `backendAPI/server.js` | Register new routes, apply tenant middleware |
| `backendAPI/.env.example` | Add email config vars |
| `src/lib/api.ts` | Add org, user mgmt, department APIs; update User interface |
| `src/contexts/AuthContext.tsx` | Remove register; add org state |
| `src/components/ProtectedRoute.tsx` | Add role-based route guards |
| `src/App.tsx` | Add new routes |
| `src/pages/Login.tsx` | Remove register tab; add onboard button |
| `src/pages/Index.tsx` | Show org name; add admin link |
| `src/components/LeaveManagement.tsx` | Verify org-scoped team leaves |

---

## ✅ Execution Checklist

Use this to track progress across sessions:

- [ ] **PHASE 1:** Backend Foundation
  - [ ] 1.1 — Organization model
  - [ ] 1.2 — Department model
  - [ ] 1.3 — Update User model
  - [ ] 1.4 — Update TimeEntry model
  - [ ] 1.5 — Update LeaveRequest model
  - [ ] 1.6 — Tenant isolation middleware
  - [ ] 1.7 — Update role guard
  - [ ] 1.8 — Update auth middleware & JWT
  - [ ] 1.9 — Update all controllers for tenant scoping
  - [ ] 1.10 — Apply tenant middleware to routes
  - [ ] 1.11 — Migration script
- [ ] **PHASE 2:** Org Onboarding (Backend)
  - [ ] 2.1 — Email utility
  - [ ] 2.2 — OrgVerification model
  - [ ] 2.3 — Org controller
  - [ ] 2.4 — Org routes
  - [ ] 2.5 — Register routes in server
- [ ] **PHASE 3:** User Management (Backend)
  - [ ] 3.1 — User management controller
  - [ ] 3.2 — Department management controller
  - [ ] 3.3 — User management routes
  - [ ] 3.4 — Department routes
  - [ ] 3.5 — Register routes in server
  - [ ] 3.6 — Remove/disable self-registration
- [ ] **PHASE 4:** Frontend Auth & Onboarding
  - [ ] 4.1 — Update Login page
  - [ ] 4.2 — Onboarding wizard pages
  - [ ] 4.3 — Update API client
  - [ ] 4.4 — Update Auth context
  - [ ] 4.5 — Update Protected routes
  - [ ] 4.6 — Update router
- [ ] **PHASE 5:** Admin Dashboard (Frontend)
  - [ ] 5.1 — Admin dashboard layout
  - [ ] 5.2 — Department management page
  - [ ] 5.3 — User management page
  - [ ] 5.4 — Org settings page
  - [ ] 5.5 — Admin overview page
- [ ] **PHASE 6:** Scope Existing Features
  - [ ] 6.1 — Update Time Tracker
  - [ ] 6.2 — Update Leave Management
  - [ ] 6.3 — Update Calendar View
  - [ ] 6.4 — Update Manager views
  - [ ] 6.5 — Add org context to UI
- [ ] **PHASE 7:** Polish & Security
  - [ ] 7.1 — Security audit
  - [ ] 7.2 — Input validation
  - [ ] 7.3 — Rate limiting
  - [ ] 7.4 — Error handling
  - [ ] 7.5 — Data integrity
  - [ ] 7.6 — API response updates
  - [ ] 7.7 — Update .env.example
