import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, CheckCircle2, XCircle, Clock, Umbrella } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LeaveRequest,
  LeaveType,
  LeaveStatus,
  getStoredLeaveRequests,
  saveLeaveRequest,
} from '@/lib/timeTracking';
import { useToast } from '@/hooks/use-toast';

// Future-proofing: role prop will be injected from auth context later
// Usage: const { user } = useAuth(); <LeaveManagement role={user.role} />
// Manager-specific UI (Approve/Reject buttons, review note textarea, updateLeaveStatus)
// will be re-added conditioned on role === 'manager' when backend auth is wired up.
interface LeaveManagementProps {
  role?: 'employee' | 'manager'; // Will come from auth context later
}

const LEAVE_TYPES: LeaveType[] = ['Annual Leave', 'Sick Leave', 'Casual Leave', 'Holiday'];

const statusColors: Record<LeaveStatus, string> = {
  pending: 'bg-warning/20 text-warning-foreground border-warning/40',
  approved: 'bg-success/20 text-success-foreground border-success/40',
  rejected: 'bg-destructive/20 text-destructive-foreground border-destructive/40',
};

const statusIcons: Record<LeaveStatus, React.ReactNode> = {
  pending: <Clock className="w-3 h-3" />,
  approved: <CheckCircle2 className="w-3 h-3" />,
  rejected: <XCircle className="w-3 h-3" />,
};

export const LeaveManagement = ({ role = 'employee' }: LeaveManagementProps) => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<LeaveStatus | 'all'>('all');

  // Form state
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [leaveType, setLeaveType] = useState<LeaveType>('Annual Leave');
  const [reason, setReason] = useState('');
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const { toast } = useToast();

  const refresh = () => setLeaves(getStoredLeaveRequests());

  useEffect(() => {
    refresh();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast({ title: 'Please select both start and end dates', variant: 'destructive' });
      return;
    }
    if (endDate < startDate) {
      toast({ title: 'End date must be after start date', variant: 'destructive' });
      return;
    }

    const req: LeaveRequest = {
      id: crypto.randomUUID(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      leaveType,
      reason,
      status: 'pending',
      appliedAt: new Date().toISOString(),
    };
    saveLeaveRequest(req);
    refresh();
    setStartDate(undefined);
    setEndDate(undefined);
    setReason('');
    setLeaveType('Annual Leave');
    toast({ title: 'Leave request submitted!', description: `${leaveType} from ${format(startDate, 'MMM d')} to ${format(endDate, 'MMM d')}` });
  };

  const displayed = leaves.filter(l => filterStatus === 'all' || l.status === filterStatus);

  return (
    <div className="space-y-6">
      {/* Apply for Leave */}
      <Card className="bg-gradient-card shadow-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Umbrella className="w-4 h-4 text-primary" />
            Apply for Leave
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Popover open={startOpen} onOpenChange={setStartOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn('w-full justify-start text-left font-normal', !startDate && 'text-muted-foreground')}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(d) => { setStartDate(d); setStartOpen(false); }}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Popover open={endOpen} onOpenChange={setEndOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn('w-full justify-start text-left font-normal', !endDate && 'text-muted-foreground')}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(d) => { setEndDate(d); setEndOpen(false); }}
                      disabled={(d) => startDate ? d < startDate : false}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Leave Type */}
            <div className="space-y-1.5">
              <Label>Leave Type</Label>
              <Select value={leaveType} onValueChange={(v) => setLeaveType(v as LeaveType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map(lt => (
                    <SelectItem key={lt} value={lt}>{lt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <Label>Reason (optional)</Label>
              <Textarea
                placeholder="Brief reason for leave..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full">
              <Umbrella className="w-4 h-4 mr-2" />
              Submit Leave Request
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* My Leave Requests */}
      <Card className="bg-gradient-card shadow-card border-0">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base">My Leave Requests</CardTitle>
            {/* Status filter */}
            <div className="flex gap-1.5 flex-wrap">
              {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
                <Button
                  key={s}
                  size="sm"
                  variant={filterStatus === s ? 'default' : 'outline'}
                  onClick={() => setFilterStatus(s)}
                  className="text-xs h-7 px-2.5 capitalize"
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {displayed.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No leave requests found.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {displayed.map(leave => (
                <div key={leave.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="space-y-0.5">
                      <p className="font-medium text-foreground">{leave.leaveType}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(leave.startDate), 'MMM d, yyyy')}
                        {leave.startDate !== leave.endDate && ` → ${format(new Date(leave.endDate), 'MMM d, yyyy')}`}
                      </p>
                      {leave.reason && (
                        <p className="text-xs text-muted-foreground italic">"{leave.reason}"</p>
                      )}
                      {leave.reviewNote && (
                        <p className="text-xs text-muted-foreground">Note: {leave.reviewNote}</p>
                      )}
                    </div>
                    <Badge className={cn('flex items-center gap-1 border text-xs', statusColors[leave.status])}>
                      {statusIcons[leave.status]}
                      {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
