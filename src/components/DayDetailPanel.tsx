import { CalendarIcon, AlertCircle, Umbrella, Clock, LogIn, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WorkingDay, LeaveRequest, formatHours, calculateDailyHours } from '@/lib/timeTracking';
import { cn } from '@/lib/utils';

interface DayDetailPanelProps {
  date: Date;
  dayInfo: WorkingDay | undefined;
  leaveForDay: LeaveRequest | undefined;
}

const STATUS_CONFIG = {
  working: { label: 'Working', className: 'bg-success text-success-foreground' },
  partial:  { label: 'Partial',  className: 'bg-warning text-warning-foreground' },
  absent:   { label: 'Absent',   className: 'bg-muted text-muted-foreground' },
  weekend:  { label: 'Weekend',  className: 'bg-muted text-muted-foreground' },
};

// Future MongoDB swap:
// Replace `dayInfo` prop derivation in CalendarView with:
// const { data: dayInfo } = useQuery(['day', selectedDate], () =>
//   fetch(`/api/entries?date=${selectedDate.toISOString()}&userId=${user._id}`).then(r => r.json())
// );

export const DayDetailPanel = ({ date, dayInfo, leaveForDay }: DayDetailPanelProps) => {
  const dateLabel = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const isOnLeave = !!leaveForDay && leaveForDay.status !== 'rejected';
  const status = isOnLeave ? null : dayInfo?.status;
  const statusConfig = status ? STATUS_CONFIG[status] : null;

  const sortedEntries = dayInfo?.entries
    ? [...dayInfo.entries].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    : [];

  const regularHours = dayInfo ? Math.min(dayInfo.totalHours, 8) : 0;
  const overtime = dayInfo ? Math.max(0, dayInfo.totalHours - 8) : 0;

  const hasRecords = sortedEntries.length > 0 || isOnLeave;

  return (
    <div className="h-full flex flex-col">
      {/* Date Header */}
      <div className="mb-5">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Selected Day</p>
            <h3 className="text-lg font-semibold text-foreground leading-tight">{dateLabel}</h3>
          </div>
          {isOnLeave ? (
            <Badge className="bg-primary/20 text-primary border-primary/30 shrink-0">
              On Leave
            </Badge>
          ) : statusConfig ? (
            <Badge className={cn(statusConfig.className, 'shrink-0')}>
              {statusConfig.label}
            </Badge>
          ) : null}
        </div>
      </div>

      {/* Hours Summary Row */}
      {dayInfo && dayInfo.totalHours > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-foreground">{formatHours(dayInfo.totalHours)}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-foreground">{formatHours(regularHours)}</p>
            <p className="text-xs text-muted-foreground">Regular</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <p className={cn('text-lg font-bold', overtime > 0 ? 'text-warning' : 'text-foreground')}>
              {formatHours(overtime)}
            </p>
            <p className="text-xs text-muted-foreground">Overtime</p>
          </div>
        </div>
      )}

      {/* Leave Banner */}
      {leaveForDay && leaveForDay.status !== 'rejected' && (
        <div className={cn(
          'flex items-start gap-3 p-3 rounded-lg mb-5 border',
          leaveForDay.status === 'approved'
            ? 'bg-primary/10 border-primary/20'
            : 'bg-warning/10 border-warning/20'
        )}>
          <Umbrella className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-sm font-medium">{leaveForDay.leaveType}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {leaveForDay.status === 'approved' ? 'Approved' : 'Pending approval'}
            </p>
            {leaveForDay.reviewNote && (
              <p className="text-xs text-muted-foreground mt-1 italic">
                Note: {leaveForDay.reviewNote}
              </p>
            )}
          </div>
          <Badge
            className={cn(
              'ml-auto shrink-0 text-xs',
              leaveForDay.status === 'approved'
                ? 'bg-success/20 text-success-foreground border-success/30'
                : 'bg-warning/20 text-warning-foreground border-warning/30'
            )}
          >
            {leaveForDay.status}
          </Badge>
        </div>
      )}

      {/* Punch Timeline */}
      {sortedEntries.length > 0 && (
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Punch Timeline
            </p>
          </div>
          <div className="space-y-0">
            {sortedEntries.map((entry, idx) => {
              const isIn = entry.action === 'IN';
              const isLast = idx === sortedEntries.length - 1;
              return (
                <div key={entry.id} className="flex items-stretch gap-3">
                  {/* Timeline spine */}
                  <div className="flex flex-col items-center w-8 shrink-0">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 shrink-0',
                      isIn
                        ? 'bg-success/20 border-success text-success'
                        : 'bg-background border-muted-foreground/40 text-muted-foreground'
                    )}>
                      {isIn
                        ? <LogIn className="w-3.5 h-3.5" />
                        : <LogOut className="w-3.5 h-3.5" />
                      }
                    </div>
                    {!isLast && (
                      <div className="w-0.5 flex-1 bg-border my-1" />
                    )}
                  </div>
                  {/* Entry info */}
                  <div className={cn('pb-4', isLast && 'pb-2')}>
                    <p className={cn(
                      'text-sm font-semibold',
                      isIn ? 'text-success' : 'text-foreground'
                    )}>
                      {isIn ? 'Punch In' : 'Punch Out'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.timestamp.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Incomplete shift warning */}
          {dayInfo?.hasIncompleteShift && (
            <div className="flex items-center gap-2 mt-2 p-2.5 bg-warning/10 border border-warning/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-warning shrink-0" />
              <span className="text-xs text-warning font-medium">Open shift — no punch-out recorded</span>
            </div>
          )}
        </div>
      )}

      {/* Empty / no data state */}
      {!hasRecords && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-10 text-muted-foreground">
          <CalendarIcon className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">No records for this day</p>
          <p className="text-xs opacity-70 mt-1">
            {dayInfo?.status === 'weekend' ? 'This is a weekend' : 'No punch entries found'}
          </p>
        </div>
      )}
    </div>
  );
};
