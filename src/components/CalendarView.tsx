import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  TimeEntry,
  LeaveRequest,
  LeaveStatus,
  WorkingDay,
  getWeeklyStats,
  getWeekStart,
  formatHours,
} from '@/lib/timeTracking';
import { timeEntriesApi, leaveRequestsApi } from '@/lib/api';
import { HoursBreakdown } from './HoursBreakdown';
import { DayDetailPanel } from './DayDetailPanel';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  entries: TimeEntry[];
  leaves: LeaveRequest[];
  onRefresh?: () => void;
}

// Helper to convert API working day to local format
const toLocalWorkingDay = (wd: { date: string; status: string; totalHours: number; entries: any[]; hasIncompleteShift: boolean }): WorkingDay => ({
  date: new Date(wd.date),
  status: wd.status as WorkingDay['status'],
  totalHours: wd.totalHours,
  entries: wd.entries.map((e: any) => ({
    id: e._id,
    timestamp: new Date(e.timestamp),
    action: e.action as 'IN' | 'OUT',
  })),
  hasIncompleteShift: wd.hasIncompleteShift,
});

export const CalendarView = ({ entries, leaves, onRefresh }: CalendarViewProps) => {
  const [viewMonth, setViewMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [workingDays, setWorkingDays] = useState<WorkingDay[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<{ totalDaysWorked: number; totalHours: number; incompleteDays: number; expectedWorkingDays: number }>({
    totalDaysWorked: 0,
    totalHours: 0,
    incompleteDays: 0,
    expectedWorkingDays: 0,
  });
  const [leaveDateMap, setLeaveDateMap] = useState<Map<string, LeaveStatus>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const currentYear = viewMonth.getFullYear();
  const currentMonth = viewMonth.getMonth();

  // Memoize weekStart as a string to avoid infinite re-render loops
  // (getWeekStart returns a new Date object each time → breaks useEffect deps)
  const weekStartStr = (() => {
    const ws = getWeekStart(new Date());
    return ws.toISOString().split('T')[0];
  })();

  // Fetch working days and stats from API
  useEffect(() => {
    const fetchCalendarData = async () => {
      setIsLoading(true);
      try {
        // Fetch working days for the month
        const wdRes = await timeEntriesApi.getWorkingDays(currentYear, currentMonth);
        if (wdRes.success) {
          setWorkingDays(wdRes.data.map(toLocalWorkingDay));
        }

        // Fetch weekly stats
        const wsRes = await timeEntriesApi.getWeeklyStats(weekStartStr);
        if (wsRes.success) {
          setWeeklyStats(wsRes.data);
        }

        // Fetch leaves for the month
        const leaveRes = await leaveRequestsApi.getLeavesForMonth(currentYear, currentMonth);
        if (leaveRes.success) {
          const map = new Map<string, LeaveStatus>();
          Object.entries(leaveRes.data.dateMap).forEach(([date, status]) => {
            map.set(date, status as LeaveStatus);
          });
          setLeaveDateMap(map);
        }
      } catch (error) {
        console.error('Failed to fetch calendar data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalendarData();
  }, [currentYear, currentMonth, weekStartStr, entries]);

  const getDateStatus = (date: Date): WorkingDay | undefined => {
    return workingDays.find(wd => wd.date.toDateString() === date.toDateString());
  };

  const getLeaveStatus = (date: Date): LeaveStatus | undefined => {
    return leaveDateMap.get(date.toDateString());
  };

  const getDayClassName = (date: Date) => {
    const leaveStatus = getLeaveStatus(date);
    if (leaveStatus === 'approved') return cn('relative', 'bg-primary/20 text-primary-foreground hover:bg-primary/30');
    if (leaveStatus === 'pending') return cn('relative', 'bg-warning/30 text-warning-foreground hover:bg-warning/40');

    const dayInfo = getDateStatus(date);
    if (!dayInfo) return '';
    const base = 'relative';
    switch (dayInfo.status) {
      case 'working': return cn(base, 'bg-success/20 text-success-foreground hover:bg-success/30');
      case 'partial': return cn(base, 'bg-warning/20 text-warning-foreground hover:bg-warning/30');
      case 'weekend': return cn(base, 'text-muted-foreground');
      case 'absent': return cn(base, 'text-muted-foreground hover:bg-muted/30');
      default: return base;
    }
  };

  const renderDayContent = (date: Date) => {
    const leaveStatus = getLeaveStatus(date);
    if (leaveStatus && leaveStatus !== 'rejected') {
      return (
        <div className="flex flex-col items-center gap-0.5">
          <span>{date.getDate()}</span>
          <div className="text-xs px-1 rounded font-medium leading-tight">
            {leaveStatus === 'approved' ? '🏖' : '⏳'}
          </div>
        </div>
      );
    }

    const dayInfo = getDateStatus(date);
    if (!dayInfo || dayInfo.status === 'weekend' || dayInfo.status === 'absent') {
      return date.getDate();
    }

    return (
      <div className="flex flex-col items-center gap-0.5">
        <span>{date.getDate()}</span>
        {dayInfo.totalHours > 0 && (
          <div className="text-xs bg-primary/10 text-primary px-1 rounded leading-tight">
            {Math.round(dayInfo.totalHours)}h
          </div>
        )}
        {dayInfo.hasIncompleteShift && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full"></div>
        )}
      </div>
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setViewMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newMonth;
    });
  };

  // Derive selected day data
  const selectedDayInfo = workingDays.find(
    wd => wd.date.toDateString() === selectedDate.toDateString()
  );
  const selectedDayLeave = leaves.find(l => {
    const s = new Date(l.startDate);
    const e = new Date(l.endDate);
    return selectedDate >= s && selectedDate <= e;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Clock className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weekly Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-card shadow-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <div>
                <p className="text-2xl font-bold text-foreground">{weeklyStats.totalDaysWorked}</p>
                <p className="text-xs text-muted-foreground">Days Worked This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{formatHours(weeklyStats.totalHours)}</p>
                <p className="text-xs text-muted-foreground">Hours This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              <div>
                <p className="text-2xl font-bold text-foreground">{weeklyStats.incompleteDays}</p>
                <p className="text-xs text-muted-foreground">Incomplete Shifts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {weeklyStats.expectedWorkingDays > 0
                    ? Math.round((weeklyStats.totalDaysWorked / weeklyStats.expectedWorkingDays) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Attendance Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hours Breakdown */}
      <HoursBreakdown
        entries={entries}
        leaves={leaves}
        year={currentYear}
        month={currentMonth}
      />

      {/* Calendar + Day Detail Panel */}
      <Card className="bg-gradient-card shadow-card border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              Work Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 lg:divide-x divide-border">
            {/* Left: Calendar */}
            <div className="lg:col-span-3 pr-0 lg:pr-6 pb-6 lg:pb-0">
              {/* Legend */}
              <div className="flex flex-wrap gap-3 text-xs mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-success/20 border border-success/30 rounded"></div>
                  <span>Working</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-warning/20 border border-warning/30 rounded"></div>
                  <span>Partial</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-muted border border-border rounded"></div>
                  <span>Absent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-primary/20 border border-primary/30 rounded"></div>
                  <span>Leave</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-destructive rounded-full"></div>
                  <span>Incomplete</span>
                </div>
              </div>

              {/* Calendar */}
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                month={viewMonth}
                onMonthChange={setViewMonth}
                className="pointer-events-auto w-full"
                classNames={{
                  months: "w-full",
                  month: "w-full",
                  table: "w-full border-collapse",
                  head_row: "flex w-full",
                  head_cell: "text-muted-foreground flex-1 font-normal text-[0.8rem] text-center",
                  row: "flex w-full mt-1",
                  cell: "flex-1 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                  day: "w-full h-12 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground font-semibold",
                  day_outside: "text-muted-foreground opacity-40",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_hidden: "invisible",
                  caption: "hidden",
                  nav: "hidden",
                }}
                modifiers={{
                  working: workingDays.filter(wd => wd.status === 'working').map(wd => wd.date),
                  partial: workingDays.filter(wd => wd.status === 'partial').map(wd => wd.date),
                  absent: workingDays.filter(wd => wd.status === 'absent').map(wd => wd.date),
                }}
                modifiersClassNames={{
                  working: 'bg-success/20 text-success-foreground hover:bg-success/30',
                  partial: 'bg-warning/20 text-warning-foreground hover:bg-warning/30',
                  absent: 'text-muted-foreground hover:bg-muted/30',
                }}
                components={{
                  Day: ({ date, ...props }) => (
                    <button
                      className={cn(
                        'w-full h-12 p-1 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-sm',
                        getDayClassName(date),
                        selectedDate.toDateString() === date.toDateString()
                          ? 'ring-2 ring-primary ring-offset-1'
                          : ''
                      )}
                      onClick={() => setSelectedDate(date)}
                    >
                      {renderDayContent(date)}
                    </button>
                  ),
                }}
              />
            </div>

            {/* Right: Day Detail Panel */}
            <div className="lg:col-span-2 pt-6 lg:pt-0 lg:pl-6">
              <DayDetailPanel
                date={selectedDate}
                dayInfo={selectedDayInfo}
                leaveForDay={selectedDayLeave}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
