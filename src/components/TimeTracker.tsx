import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, TrendingUp, Calendar, Award, BarChart3, Umbrella, LogOut, ShieldCheck, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { timeEntriesApi, leaveRequestsApi, TimeEntry as ApiTimeEntry, LeaveRequest as ApiLeaveRequest } from '@/lib/api';
import { TimeEntry, LeaveRequest } from '@/lib/timeTracking';
import { TimeLogTable } from './TimeLogTable';
import { CalendarView } from './CalendarView';
import { LeaveManagement } from './LeaveManagement';
import { useToast } from '@/hooks/use-toast';

// Helper to convert API entry to frontend format
const toLocalEntry = (entry: ApiTimeEntry): TimeEntry => ({
  id: entry._id,
  timestamp: new Date(entry.timestamp),
  action: entry.action,
});

// Helper to convert API leave to frontend format
const toLocalLeave = (leave: ApiLeaveRequest): LeaveRequest => ({
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

export const TimeTracker = () => {
  const { user, logout } = useAuth();
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPunching, setIsPunching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch entries from API
  const fetchEntries = useCallback(async () => {
    try {
      const response = await timeEntriesApi.getEntries();
      if (response.success) {
        setEntries(response.data.map(toLocalEntry));
      }
    } catch (error) {
      console.error('Failed to fetch entries:', error);
    }
  }, []);

  // Fetch leaves from API
  const fetchLeaves = useCallback(async () => {
    try {
      const response = await leaveRequestsApi.getMyLeaves();
      if (response.success) {
        setLeaves(response.data.map(toLocalLeave));
      }
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchEntries(), fetchLeaves()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchEntries, fetchLeaves]);

  // Clock timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePunch = async (action: 'IN' | 'OUT') => {
    setIsPunching(true);
    try {
      const response = await timeEntriesApi.punch(action);
      if (response.success) {
        const newEntry = toLocalEntry(response.data);
        setEntries(prev => [...prev, newEntry]);
        toast({
          title: action === 'IN' ? 'Punched In' : 'Punched Out',
          description: `Recorded at ${new Date(response.data.timestamp).toLocaleTimeString()}`,
        });
      }
    } catch (error) {
      toast({
        title: 'Punch Failed',
        description: error instanceof Error ? error.message : 'Could not record punch',
        variant: 'destructive',
      });
    } finally {
      setIsPunching(false);
    }
  };

  const today = new Date();
  const lastEntry = entries.length > 0
    ? entries.reduce((latest, entry) =>
      entry.timestamp > latest.timestamp ? entry : latest
    )
    : null;
  const isCurrentlyWorking = lastEntry?.action === 'IN';

  // Calculate today's hours from API
  const [todayHours, setTodayHours] = useState(0);
  const [monthlyHours, setMonthlyHours] = useState(0);
  const [yearlyHours, setYearlyHours] = useState(0);

  useEffect(() => {
    const fetchHours = async () => {
      const now = new Date();
      try {
        const dateStr = now.toISOString().split('T')[0];
        const dailyRes = await timeEntriesApi.getDailySummary(dateStr);
        if (dailyRes.success) {
          setTodayHours(dailyRes.data.totalHours);
        }

        const monthlyRes = await timeEntriesApi.getMonthlyHours(now.getFullYear(), now.getMonth());
        if (monthlyRes.success) {
          setMonthlyHours(monthlyRes.data.totalHours);
        }

        const yearlyRes = await timeEntriesApi.getYearlyHours(now.getFullYear());
        if (yearlyRes.success) {
          setYearlyHours(yearlyRes.data.totalHours);
        }
      } catch (error) {
        console.error('Failed to fetch hours:', error);
      }
    };
    fetchHours();
  }, [entries.length]);

  const formatHours = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  const handleLogout = () => {
    logout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Clock className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-between max-w-7xl mx-auto mb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Timeley</h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{user?.name}</span>
                <Badge
                  className={`text-xs font-medium ${user?.role === 'admin'
                      ? 'bg-purple-500/15 text-purple-600 border-purple-500/30'
                      : user?.role === 'manager'
                        ? 'bg-blue-500/15 text-blue-600 border-blue-500/30'
                        : 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                    }`}
                >
                  {user?.role === 'admin' && <ShieldCheck className="w-3 h-3 mr-1" />}
                  {user?.role === 'manager' && <Users className="w-3 h-3 mr-1" />}
                  {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Employee'}
                </Badge>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground text-lg">
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          <p className="text-2xl font-mono text-primary">
            {currentTime.toLocaleTimeString()}
          </p>
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="leave" className="flex items-center gap-2">
              <Umbrella className="w-4 h-4" />
              Leave
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">

            {/* Status Card */}
            <Card className="bg-gradient-card shadow-card border-0">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${isCurrentlyWorking
                    ? 'bg-success/10 text-success border border-success/20'
                    : 'bg-muted text-muted-foreground border border-border'
                    }`}>
                    <Clock className="w-4 h-4" />
                    {isCurrentlyWorking ? 'Currently Working' : 'Not Working'}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      size="lg"
                      onClick={() => handlePunch('IN')}
                      disabled={isCurrentlyWorking || isPunching}
                      className="bg-gradient-success hover:bg-success-hover text-success-foreground shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-lg font-semibold py-6 px-8"
                    >
                      <Clock className="w-5 h-5 mr-2" />
                      Punch In
                    </Button>

                    <Button
                      size="lg"
                      onClick={() => handlePunch('OUT')}
                      disabled={!isCurrentlyWorking || isPunching}
                      className="bg-gradient-warning hover:bg-warning-hover text-warning-foreground shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-lg font-semibold py-6 px-8"
                    >
                      <Clock className="w-5 h-5 mr-2" />
                      Punch Out
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-card shadow-card border-0 animate-fade-in">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Today</CardTitle>
                  <Clock className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{formatHours(todayHours)}</div>
                  <p className="text-xs text-muted-foreground">Hours worked today</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card shadow-card border-0 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
                  <Calendar className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{formatHours(monthlyHours)}</div>
                  <p className="text-xs text-muted-foreground">
                    {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card shadow-card border-0 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">This Year</CardTitle>
                  <Award className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{formatHours(yearlyHours)}</div>
                  <p className="text-xs text-muted-foreground">{today.getFullYear()} total</p>
                </CardContent>
              </Card>
            </div>

            {/* Time Log Table */}
            <Card className="bg-gradient-card shadow-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Time Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TimeLogTable entries={entries} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <CalendarView
              entries={entries}
              leaves={leaves}
              onRefresh={fetchEntries}
            />
          </TabsContent>

          <TabsContent value="leave" className="mt-6">
            <LeaveManagement
              role={user?.role as 'employee' | 'manager' | 'admin'}
              onRefresh={fetchLeaves}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
