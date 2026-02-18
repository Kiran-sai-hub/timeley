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
import {
  CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Umbrella,
  Loader2,
  Users,
  User as UserIcon,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LeaveRequest as LocalLeaveRequest,
  LeaveType,
  LeaveStatus,
} from '@/lib/timeTracking';
import { leaveRequestsApi, LeaveRequest as ApiLeaveRequest } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface LeaveManagementProps {
  role?: 'employee' | 'manager' | 'admin';
  onRefresh?: () => void;
}

// Helper to convert API leave to local format
const toLocalLeave = (leave: ApiLeaveRequest): LocalLeaveRequest => ({
  id: leave._id,
  startDate: leave.startDate,
  endDate: leave.endDate,
  leaveType: leave.leaveType,
  reason: leave.reason,
  status: leave.status,
  appliedAt: leave.appliedAt,
  reviewedAt: leave.reviewedAt,
  reviewNote: leave.reviewNote,
});

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

// ═══════════════════════════════════════════════════════════
// Team Leave Request Card (used in Manager / Admin view)
// ═══════════════════════════════════════════════════════════
interface TeamLeaveItem {
  _id: string;
  userId: { _id: string; name: string; email: string; department: string; role?: string };
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;
  reviewNote?: string;
}

const TeamLeaveCard = ({
  leave,
  onAction,
  isActioning,
}: {
  leave: TeamLeaveItem;
  onAction: (id: string, status: 'approved' | 'rejected', note?: string) => void;
  isActioning: string | null;
}) => {
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const user = leave.userId;

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email} · {user.department}</p>
            </div>
          </div>
          <div className="pl-10 space-y-0.5">
            <p className="text-sm text-foreground font-medium">{leave.leaveType}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(leave.startDate), 'MMM d, yyyy')}
              {leave.startDate !== leave.endDate && ` → ${format(new Date(leave.endDate), 'MMM d, yyyy')}`}
            </p>
            {leave.reason && (
              <p className="text-xs text-muted-foreground italic">"{leave.reason}"</p>
            )}
            <p className="text-xs text-muted-foreground">
              Applied {format(new Date(leave.appliedAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        <Badge className={cn('flex items-center gap-1 border text-xs shrink-0', statusColors[leave.status])}>
          {statusIcons[leave.status]}
          {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
        </Badge>
      </div>

      {/* Approve / Reject actions for pending requests */}
      {leave.status === 'pending' && (
        <div className="pl-10 space-y-2">
          {showNote && (
            <Textarea
              placeholder="Add a note (optional)..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="text-sm"
            />
          )}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isActioning === leave._id}
              onClick={() => onAction(leave._id, 'approved', note || undefined)}
            >
              {isActioning === leave._id ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1 h-3 w-3" />
              )}
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={isActioning === leave._id}
              onClick={() => onAction(leave._id, 'rejected', note || undefined)}
            >
              {isActioning === leave._id ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <XCircle className="mr-1 h-3 w-3" />
              )}
              Reject
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs"
              onClick={() => setShowNote(!showNote)}
            >
              <MessageSquare className="mr-1 h-3 w-3" />
              {showNote ? 'Hide Note' : 'Add Note'}
            </Button>
          </div>
        </div>
      )}

      {/* Show review note if already reviewed */}
      {leave.reviewNote && leave.status !== 'pending' && (
        <div className="pl-10">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Review note:</span> {leave.reviewNote}
          </p>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// Main LeaveManagement Component
// ═══════════════════════════════════════════════════════════
export const LeaveManagement = ({ role = 'employee', onRefresh }: LeaveManagementProps) => {
  const hasTeamView = role === 'manager' || role === 'admin';

  // --- View toggle ---
  const [activeView, setActiveView] = useState<'my' | 'team'>(hasTeamView ? 'team' : 'my');

  // --- My Leaves state ---
  const [leaves, setLeaves] = useState<LocalLeaveRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<LeaveStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Team Leaves state ---
  const [teamLeaves, setTeamLeaves] = useState<TeamLeaveItem[]>([]);
  const [teamFilterStatus, setTeamFilterStatus] = useState<LeaveStatus | 'all'>('pending');
  const [isTeamLoading, setIsTeamLoading] = useState(false);
  const [isActioning, setIsActioning] = useState<string | null>(null);

  // --- Form state ---
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [leaveType, setLeaveType] = useState<LeaveType>('Annual Leave');
  const [reason, setReason] = useState('');
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const { toast } = useToast();

  // ---- Fetch own leaves ----
  const fetchLeaves = async () => {
    setIsLoading(true);
    try {
      const response = await leaveRequestsApi.getMyLeaves();
      if (response.success) {
        setLeaves(response.data.map(toLocalLeave));
      }
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
      toast({ title: 'Error', description: 'Failed to load leave requests', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // ---- Fetch team leaves ----
  const fetchTeamLeaves = async () => {
    if (!hasTeamView) return;
    setIsTeamLoading(true);
    try {
      const statusParam = teamFilterStatus === 'all' ? undefined : teamFilterStatus;
      const response = await leaveRequestsApi.getTeamLeaves(statusParam);
      if (response.success) {
        setTeamLeaves(response.data.leaves as unknown as TeamLeaveItem[]);
      }
    } catch (error) {
      console.error('Failed to fetch team leaves:', error);
      toast({ title: 'Error', description: 'Failed to load team leave requests', variant: 'destructive' });
    } finally {
      setIsTeamLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  useEffect(() => {
    if (hasTeamView) {
      fetchTeamLeaves();
    }
  }, [teamFilterStatus]);

  // ---- Submit own leave ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast({ title: 'Please select both start and end dates', variant: 'destructive' });
      return;
    }
    if (endDate < startDate) {
      toast({ title: 'End date must be after start date', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      await leaveRequestsApi.submit({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        leaveType,
        reason,
      });

      toast({
        title: 'Leave request submitted!',
        description: `${leaveType} from ${format(startDate, 'MMM d')} to ${format(endDate, 'MMM d')}`,
      });

      setStartDate(undefined);
      setEndDate(undefined);
      setReason('');
      setLeaveType('Annual Leave');
      fetchLeaves();
      onRefresh?.();
    } catch (error) {
      toast({
        title: 'Submission failed',
        description: error instanceof Error ? error.message : 'Could not submit leave request',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- Review (approve / reject) ----
  const handleReview = async (leaveId: string, status: 'approved' | 'rejected', reviewNote?: string) => {
    setIsActioning(leaveId);
    try {
      await leaveRequestsApi.review(leaveId, { status, reviewNote });
      toast({
        title: status === 'approved' ? 'Leave Approved ✅' : 'Leave Rejected ❌',
        description: `Leave request has been ${status}.`,
      });
      fetchTeamLeaves();
      onRefresh?.();
    } catch (error) {
      toast({
        title: 'Action failed',
        description: error instanceof Error ? error.message : `Could not ${status} leave`,
        variant: 'destructive',
      });
    } finally {
      setIsActioning(null);
    }
  };

  const displayed = leaves.filter(l => filterStatus === 'all' || l.status === filterStatus);

  return (
    <div className="space-y-6">
      {/* ── View Toggle (Manager / Admin only) ── */}
      {hasTeamView && (
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg w-fit">
          <Button
            size="sm"
            variant={activeView === 'team' ? 'default' : 'ghost'}
            onClick={() => setActiveView('team')}
            className="gap-1.5"
          >
            {role === 'admin' ? <ShieldCheck className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            {role === 'admin' ? 'All Leaves' : 'Team Leaves'}
          </Button>
          <Button
            size="sm"
            variant={activeView === 'my' ? 'default' : 'ghost'}
            onClick={() => setActiveView('my')}
            className="gap-1.5"
          >
            <UserIcon className="w-4 h-4" />
            My Leaves
          </Button>
        </div>
      )}

      {/* ═══════════ TEAM VIEW (Manager / Admin) ═══════════ */}
      {activeView === 'team' && hasTeamView && (
        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                {role === 'admin' ? (
                  <><ShieldCheck className="w-4 h-4 text-primary" /> All Leave Requests</>
                ) : (
                  <><Users className="w-4 h-4 text-primary" /> Team Leave Requests</>
                )}
              </CardTitle>
              {/* Status filter */}
              <div className="flex gap-1.5 flex-wrap">
                {(['pending', 'approved', 'rejected', 'all'] as const).map(s => (
                  <Button
                    key={s}
                    size="sm"
                    variant={teamFilterStatus === s ? 'default' : 'outline'}
                    onClick={() => setTeamFilterStatus(s)}
                    className="text-xs h-7 px-2.5 capitalize"
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isTeamLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : teamLeaves.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No {teamFilterStatus !== 'all' ? teamFilterStatus : ''} leave requests found.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {teamLeaves.map(leave => (
                  <TeamLeaveCard
                    key={leave._id}
                    leave={leave}
                    onAction={handleReview}
                    isActioning={isActioning}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ═══════════ MY LEAVES VIEW ═══════════ */}
      {activeView === 'my' && (
        <>
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

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : displayed.length === 0 ? (
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
        </>
      )}
    </div>
  );
};
