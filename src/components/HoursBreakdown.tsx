import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import {
  TimeEntry,
  LeaveRequest,
  getHoursBreakdown,
  formatHours,
  LeaveType,
} from '@/lib/timeTracking';

interface HoursBreakdownProps {
  entries: TimeEntry[];
  leaves: LeaveRequest[];
  year: number;
  month: number;
}

const LEAVE_TYPES: LeaveType[] = ['Annual Leave', 'Sick Leave', 'Casual Leave', 'Holiday'];

export const HoursBreakdown = ({ entries, leaves, year, month }: HoursBreakdownProps) => {
  const breakdown = useMemo(
    () => getHoursBreakdown(entries, leaves, year, month),
    [entries, leaves, year, month]
  );

  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const rows: { label: string; hours: number; section: 'work' | 'leave' }[] = [
    { label: 'Regular Hours', hours: breakdown.regularHours, section: 'work' },
    { label: 'Overtime', hours: breakdown.overtime, section: 'work' },
    ...LEAVE_TYPES.map(lt => ({ label: lt, hours: breakdown.leaveHours[lt], section: 'leave' as const })),
  ];

  return (
    <Card className="bg-gradient-card shadow-card border-0 overflow-hidden">
      {/* Dark header */}
      <CardHeader className="bg-foreground text-background py-3 px-5">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-background">
          <Clock className="w-4 h-4" />
          Pay Period Breakdown — {monthLabel}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/60 border-b border-border">
              <th className="text-left px-5 py-2 font-medium text-muted-foreground">Time Type</th>
              <th className="text-right px-5 py-2 font-medium text-muted-foreground">Pay Period Total</th>
            </tr>
          </thead>
          <tbody>
            {/* Work Hours section */}
            <tr className="bg-primary/5">
              <td colSpan={2} className="px-5 py-1.5 text-xs font-semibold text-primary uppercase tracking-wide">
                Hours Worked
              </td>
            </tr>
            {rows.filter(r => r.section === 'work').map((row, i) => (
              <tr key={row.label} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                <td className="px-5 py-2.5 text-foreground">{row.label}</td>
                <td className="px-5 py-2.5 text-right font-mono font-medium text-foreground">
                  {row.hours > 0 ? formatHours(row.hours) : '—'}
                </td>
              </tr>
            ))}

            {/* Time Off section */}
            <tr className="bg-accent/30">
              <td colSpan={2} className="px-5 py-1.5 text-xs font-semibold text-accent-foreground uppercase tracking-wide">
                Time Off Used
              </td>
            </tr>
            {rows.filter(r => r.section === 'leave').map((row, i) => (
              <tr key={row.label} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                <td className="px-5 py-2.5 text-foreground">{row.label}</td>
                <td className="px-5 py-2.5 text-right font-mono font-medium text-foreground">
                  {row.hours > 0 ? formatHours(row.hours) : '—'}
                </td>
              </tr>
            ))}

            {/* Total row */}
            <tr className="border-t border-border bg-muted/40">
              <td className="px-5 py-3 font-semibold text-foreground">Total Hours Worked</td>
              <td className="px-5 py-3 text-right font-mono font-bold text-foreground">
                {formatHours(breakdown.totalWorked)}
              </td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};
