import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, TrendingUp, Calendar, Award } from 'lucide-react';
import { TimeEntry, getStoredEntries, saveEntry, calculateDailyHours, calculateMonthlyHours, calculateYearlyHours, getLastEntry } from '@/lib/timeTracking';
import { TimeLogTable } from './TimeLogTable';
import { useToast } from '@/hooks/use-toast';

export const TimeTracker = () => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();

  useEffect(() => {
    setEntries(getStoredEntries());
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const handlePunch = (action: 'IN' | 'OUT') => {
    const entry = saveEntry(action);
    setEntries(prev => [...prev, entry]);
    
    toast({
      title: action === 'IN' ? 'Punched In' : 'Punched Out',
      description: `Recorded at ${entry.timestamp.toLocaleTimeString()}`,
    });
  };

  const today = new Date();
  const lastEntry = getLastEntry(entries);
  const isCurrentlyWorking = lastEntry?.action === 'IN';

  const todayHours = calculateDailyHours(entries, today);
  const monthlyHours = calculateMonthlyHours(entries, today.getFullYear(), today.getMonth());
  const yearlyHours = calculateYearlyHours(entries, today.getFullYear());

  const formatHours = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Time Tracker</h1>
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

        {/* Status Card */}
        <Card className="bg-gradient-card shadow-card border-0">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                isCurrentlyWorking 
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
                  disabled={isCurrentlyWorking}
                  className="bg-gradient-success hover:bg-success-hover text-success-foreground shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-lg font-semibold py-6 px-8"
                >
                  <Clock className="w-5 h-5 mr-2" />
                  Punch In
                </Button>
                
                <Button
                  size="lg"
                  onClick={() => handlePunch('OUT')}
                  disabled={!isCurrentlyWorking}
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

          <Card className="bg-gradient-card shadow-card border-0 animate-fade-in" style={{animationDelay: '0.1s'}}>
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

          <Card className="bg-gradient-card shadow-card border-0 animate-fade-in" style={{animationDelay: '0.2s'}}>
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
      </div>
    </div>
  );
};