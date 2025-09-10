import { TimeEntry, formatTime, formatDate, calculateDailyHours } from '@/lib/timeTracking';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LogIn, LogOut } from 'lucide-react';

interface TimeLogTableProps {
  entries: TimeEntry[];
}

export const TimeLogTable = ({ entries }: TimeLogTableProps) => {
  // Sort entries by date (newest first)
  const sortedEntries = [...entries].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
  // Group entries by date for daily summaries
  const entriesByDate = new Map<string, TimeEntry[]>();
  sortedEntries.forEach(entry => {
    const dateKey = entry.timestamp.toDateString();
    if (!entriesByDate.has(dateKey)) {
      entriesByDate.set(dateKey, []);
    }
    entriesByDate.get(dateKey)!.push(entry);
  });

  const formatHours = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No time entries yet. Punch in to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Array.from(entriesByDate.entries()).map(([dateString, dayEntries]) => {
        const date = new Date(dateString);
        const dailyHours = calculateDailyHours(entries, date);
        const sortedDayEntries = dayEntries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        
        return (
          <div key={dateString} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                {formatDate(date)}
              </h3>
              <Badge variant="secondary" className="text-sm">
                Total: {formatHours(dailyHours)}
              </Badge>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[120px]">Time</TableHead>
                    <TableHead className="w-[100px]">Action</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDayEntries.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono text-sm">
                        {formatTime(entry.timestamp)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={entry.action === 'IN' ? 'default' : 'secondary'}
                          className={entry.action === 'IN' 
                            ? 'bg-success text-success-foreground hover:bg-success-hover' 
                            : 'bg-warning text-warning-foreground hover:bg-warning-hover'
                          }
                        >
                          {entry.action === 'IN' ? (
                            <LogIn className="w-3 h-3 mr-1" />
                          ) : (
                            <LogOut className="w-3 h-3 mr-1" />
                          )}
                          {entry.action === 'IN' ? 'Punch In' : 'Punch Out'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {entry.action === 'IN' ? 'Started work' : 'Finished work'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      })}
    </div>
  );
};