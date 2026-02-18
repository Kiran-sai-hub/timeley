Remove Manager View Toggle — Prep for Backend Role-Based Access

### The Problem

The current `LeaveManagement` component has a `Switch` toggle that lets anyone flip between Employee and Manager mode. This is wrong because:

- It's a frontend-only illusion of access control
- Any user can grant themselves manager powers
- When you add auth later (`db.users.findOne({username})`), this toggle will be dead code and confusing

### The Fix — Clean Employee-Only View

The component will be simplified to show **only the employee's perspective**. The manager approval UI will be stripped out and preserved as a comment/note for when the backend role-passing is wired up later.

#### What gets removed:

- The `isManager` state variable
- The `Switch` toggle and the entire "Manager View" header bar
- The `ShieldCheck` icon and "Manager View" label
- The manager Approve/Reject action buttons inside each leave card
- The `reviewNote` state (only used by manager actions)
- The `handleAction` function (only used by manager)
- Conditional title `{isManager ? 'All Leave Requests' : 'My Leave Requests'}` → always "My Leave Requests"
- Unused imports: `Switch`, `ShieldCheck`, `updateLeaveStatus` (no longer called from UI)

#### What stays (Employee view, unchanged):

- Apply for Leave form (date pickers, leave type, reason, submit)
- My Leave Requests list with status badges (Pending / Approved / Rejected)
- Status filter buttons (All / Pending / Approved / Rejected)
- Review notes display (read-only — employees can still *see* a note a manager left)

#### Future-proofing — prop-based role injection:

The component signature will be updated to accept an optional `role` prop:

```typescript
interface LeaveManagementProps {
  role?: 'employee' | 'manager'; // Will come from auth context later
}

export const LeaveManagement = ({ role = 'employee' }: LeaveManagementProps) => { ... }
```

This means when you wire up your backend auth:

```typescript
// Future usage in TimeTracker.tsx
const { user } = useAuth(); // from your auth system
<LeaveManagement role={user.role} />
```

The manager-specific JSX (Approve/Reject buttons, review note textarea, `updateLeaveStatus` call) will be added back **conditioned on `role === 'manager'**` at that point — but driven by real backend data, not a toggle.

### Files Changed


| File                                 | Change                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------- |
| `src/components/LeaveManagement.tsx` | Remove toggle, manager state, manager action UI; add `role` prop for future use |


No other files need to change — `TimeTracker.tsx` renders `<LeaveManagement />` without passing role for now, which defaults to `'employee'`.