import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Umbrella
} from 'lucide-react';
import { 
  TimeEntry, 
  LeaveRequest,
  LeaveStatus,
  getWorkingDaysInMonth, 
  getWeeklyStats,
  getWeekStart,
  formatTime,
  formatHours,
  WorkingDay,
  getStoredLeaveRequests,
  getLeaveDatesForMonth,
} from '@/lib/timeTracking';
import { HoursBreakdown } from './HoursBreakdown';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  entries: TimeEntry[];
}

export type LeaveStatusColor = 'approved' | 'pending';

export const CalendarView = ({ entries }: CalendarViewProps) => {
  const [viewMonth, setViewMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<WorkingDay | null>(null);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);

  const currentYear = viewMonth.getFullYear();
  const currentMonth = viewMonth.getMonth();
  
  const workingDays = getWorkingDaysInMonth(currentYear, currentMonth, entries);
  const weekStart = getWeekStart(new Date());
  const weeklyStats = getWeeklyStats(weekStart, entries);

  // Refresh leaves whenever calendar is shown or month changes
  useEffect(() => {
    setLeaves(getStoredLeaveRequests());
  }, [currentYear, currentMonth]);

  const leaveDateMap = getLeaveDatesForMonth(currentYear, currentMonth);

  const getDateStatus = (date: Date): WorkingDay | undefined => {
    return workingDays.find(wd => wd.date.toDateString() === date.toDateString());
  };

  const getLeaveStatus = (date: Date): LeaveStatus | undefined => {
    return leaveDateMap.get(date.toDateString());
  };

  const getDayClassName = (date: Date) => {
    const leaveStatus = getLeaveStatus(date);
    if (leaveStatus === 'approved') return cn('relative', 'bg-primary/20 text-primary-foreground hover:bg-primary/30');
    if (leaveStatus === 'pending')  return cn('relative', 'bg-warning/30 text-warning-foreground hover:bg-warning/40');

    const dayInfo = getDateStatus(date);
    if (!dayInfo) return '';
    const base = 'relative';
    switch (dayInfo.status) {
      case 'working': return cn(base, 'bg-success/20 text-success-foreground hover:bg-success/30');
      case 'partial':  return cn(base, 'bg-warning/20 text-warning-foreground hover:bg-warning/30');
      case 'weekend':  return cn(base, 'text-muted-foreground');
      case 'absent':   return cn(base, 'text-muted-foreground hover:bg-muted/30');
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
      <div className="flex flex-col items-center gap-1">
        <span>{date.getDate()}</span>
        {dayInfo.totalHours > 0 && (
          <div className="text-xs bg-primary/10 text-primary px-1 rounded">
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

      {/* Calendar */}
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
          <div className="space-y-4">
            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-success/20 border border-success/30 rounded"></div>
                <span>Working Day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-warning/20 border border-warning/30 rounded"></div>
                <span>Partial Day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-muted border border-border rounded"></div>
                <span>Absent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary/20 border border-primary/30 rounded"></div>
                <span>Approved Leave</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-warning/30 border border-warning/40 rounded"></div>
                <span>Pending Leave</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-destructive rounded-full"></div>
                <span>Incomplete Shift</span>
              </div>
            </div>

            {/* Calendar Grid */}
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              month={viewMonth}
              onMonthChange={setViewMonth}
              className="pointer-events-auto"
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
                Day: ({ date, ...props }) => {
                  const dayInfo = getDateStatus(date);
                  const leaveStatus = getLeaveStatus(date);
                  const leaveForDay = leaves.find(l => {
                    const s = new Date(l.startDate);
                    const e = new Date(l.endDate);
                    return date >= s && date <= e;
                  });

                  return (
                    <Dialog>
                      <DialogTrigger asChild>
                        <button
                          className={cn(
                            'w-full h-full p-1 hover:bg-accent hover:text-accent-foreground',
                            getDayClassName(date)
                          )}
                          onClick={() => setSelectedDay(dayInfo || null)}
                        >
                          {renderDayContent(date)}
                        </button>
                      </DialogTrigger>
                      {(dayInfo || leaveForDay) && (
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <CalendarIcon className="w-5 h-5" />
                              {date.toLocaleDateString('en-US', {
                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                              })}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {/* Leave info */}
                            {leaveForDay && (
                              <div className={cn(
                                'flex items-center gap-2 p-3 rounded-md',
                                leaveForDay.status === 'approved' ? 'bg-primary/10' : 'bg-warning/10'
                              )}>
                                <Umbrella className="w-4 h-4 shrink-0" />
                                <div>
                                  <p className="text-sm font-medium">{leaveForDay.leaveType}</p>
                                  <p className="text-xs text-muted-foreground capitalize">
                                    Status: {leaveForDay.status}
                                    {leaveForDay.reviewNote && ` — ${leaveForDay.reviewNote}`}
                                  </p>
                                </div>
                              </div>
                            )}

                            {dayInfo && (
                              <>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Status:</span>
                                  <Badge
                                    variant={
                                      dayInfo.status === 'working' ? 'default' :
                                      dayInfo.status === 'partial' ? 'secondary' : 'outline'
                                    }
                                    className={
                                      dayInfo.status === 'working' ? 'bg-success text-success-foreground' :
                                      dayInfo.status === 'partial' ? 'bg-warning text-warning-foreground' : ''
                                    }
                                  >
                                    {dayInfo.status.charAt(0).toUpperCase() + dayInfo.status.slice(1)}
                                  </Badge>
                                </div>

                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Total Hours:</span>
                                  <span className="font-medium">{formatHours(dayInfo.totalHours)}</span>
                                </div>

                                {dayInfo.hasIncompleteShift && (
                                  <div className="flex items-center gap-2 p-2 bg-destructive/10 text-destructive rounded">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-sm">Incomplete shift detected</span>
                                  </div>
                                )}

                                {dayInfo.entries.length > 0 && (
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-medium">Time Entries:</h4>
                                    <div className="space-y-1">
                                      {dayInfo.entries
                                        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
                                        .map((entry) => (
                                          <div key={entry.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                            <span className="font-mono text-sm">{formatTime(entry.timestamp)}</span>
                                            <Badge variant={entry.action === 'IN' ? 'default' : 'secondary'}>
                                              {entry.action}
                                            </Badge>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </DialogContent>
                      )}
                    </Dialog>
                  );
                }
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
