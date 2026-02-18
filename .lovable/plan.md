
## Calendar Redesign — Bigger Calendar + Right-Side Day Detail Panel

### What's Changing

The Calendar tab gets a full layout redesign inspired by the reference screenshot. Instead of a narrow calendar that opens a popup modal when you click a day, the layout becomes a **persistent two-column split**:

- **Left column** — A wider, taller calendar grid (color-coded days stay exactly as they are)
- **Right column** — A day detail panel that immediately shows punch-in/punch-out records for whichever day the employee clicks, no popup needed

The weekly stats cards and Hours Breakdown table move above the split, unchanged.

---

### Layout Overview

```text
┌─────────────────────────────────────────────────────┐
│   Weekly Stats (4 cards)                            │
├─────────────────────────────────────────────────────┤
│   Hours Breakdown Table                             │
├────────────────────────┬────────────────────────────┤
│                        │                            │
│   CALENDAR (bigger)    │   DAY DETAIL PANEL         │
│                        │                            │
│   Feb 2026             │   Wednesday, Feb 18 2026   │
│   ┌────────────────┐   │   Status: Working ✓        │
│   │ color-coded    │   │   ─────────────────────    │
│   │ day tiles      │   │   Total Hours: 8h 30m      │
│   │ (click a day)  │   │   Regular: 8h              │
│   └────────────────┘   │   Overtime: 0h 30m         │
│                        │   ─────────────────────    │
│   Legend               │   Punch Timeline           │
│                        │   ● IN   9:00 AM           │
│                        │   │                        │
│                        │   ○ OUT  5:30 PM           │
│                        │                            │
│                        │   (no leave on this day)   │
└────────────────────────┴────────────────────────────┘
```

On mobile (smaller than `lg` breakpoint), the two columns stack vertically — calendar on top, detail panel below.

---

### Technical Changes

#### `src/components/CalendarView.tsx` — Layout Redesign

**State:**
- Remove `selectedDay` state (no longer needed, was driving the old dialog)
- Keep `selectedDate` state — clicking a day sets it, which reactively populates the right panel
- Default `selectedDate` to `new Date()` so the panel shows today's info on first load

**Remove entirely:**
- The `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle` imports and all their JSX wrapping each calendar day
- The `setSelectedDay(dayInfo || null)` call inside the button `onClick`

**Add:**
- A `grid grid-cols-1 lg:grid-cols-5 gap-6` wrapper around the calendar + detail panel
- Calendar sits in `lg:col-span-3` (takes more horizontal space)
- Day detail panel sits in `lg:col-span-2`
- Calendar day `onClick` simply calls `setSelectedDate(date)`

**Calendar sizing:**
Override the `shadcn/ui` Calendar's default cell size from `h-9 w-9` to `h-12 w-12` using the `classNames` prop so each day tile is visibly larger and the hours badge fits comfortably inside.

#### New `src/components/DayDetailPanel.tsx` — Right Panel

A new dedicated component that receives the selected date and its derived data as props.

**Props interface:**
```typescript
interface DayDetailPanelProps {
  date: Date;
  dayInfo: WorkingDay | undefined;
  leaveForDay: LeaveRequest | undefined;
}
// Future: replace dayInfo with a useQuery result from your MongoDB API
```

**What it renders (in order):**

1. **Date header** — Large date string (e.g., "Wednesday, Feb 18") with a status badge (Working / Partial / Absent / On Leave / Weekend)

2. **Hours summary row** — Three small stats in a row: Total Hours, Regular Hours, Overtime

3. **Leave banner** (conditional) — If `leaveForDay` exists, a colored card showing leave type, status badge, and any manager review note. Blue for approved, amber for pending.

4. **Punch Timeline** — A vertical timeline showing each IN/OUT entry:
   - Filled circle `●` for Punch In entries (green-tinted)
   - Outlined circle `○` for Punch Out entries (muted)
   - A vertical connector line between pairs
   - Each entry shows: label (Punch In / Punch Out) + time (e.g., 9:02 AM)

5. **Incomplete shift warning** — If `hasIncompleteShift` is true, a small amber alert: "Open shift — no punch-out recorded"

6. **Empty / no data state** — If no entries and no leave: "No records for this day" with a subtle calendar icon

7. **Default state** (future date or no data yet selected): "Click any day on the calendar to view details"

**Database-ready structure:**
The component is intentionally prop-driven. When you add your Node.js/MongoDB backend, the swap in `CalendarView` is one line:
```typescript
// Now (localStorage):
const selectedDayInfo = workingDays.find(wd => ...)

// Future (MongoDB API):
const { data: selectedDayInfo } = useQuery(['day', selectedDate], () =>
  fetch(`/api/entries?date=${selectedDate}&userId=${user._id}`)
)
```
The `DayDetailPanel` component itself needs zero changes.

---

### Files Changed

| File | Action |
|---|---|
| `src/components/CalendarView.tsx` | Remove Dialog modals; redesign to two-column grid; make calendar bigger; wire `selectedDate` to drive right panel |
| `src/components/DayDetailPanel.tsx` | New component — date header, hours summary, leave banner, punch timeline, empty states |

---

### Key Design Decisions

- **No modals** — The persistent panel is always visible. Clicking between days is instant, with no open/dismiss cycle
- **Today pre-selected** — The panel always shows something useful on load (today's data)
- **Responsive** — Stacks vertically on mobile, side-by-side on desktop (`lg:` breakpoint)
- **Backend-ready** — Props-driven panel means the MongoDB swap is a one-liner in `CalendarView`, not a component rewrite
- **Calendar stays color-coded** — All existing status colors (green/orange/blue/amber) are preserved exactly as they are
