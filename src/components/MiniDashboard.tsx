import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Coffee, LogOut, CheckCircle2, ChevronRight, Calendar as CalendarIcon, PieChart } from "lucide-react";

export const MiniDashboard = () => {
    const [currentTime, setCurrentTime] = useState("");

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        };

        // Initial call
        updateTime();

        // Update every second
        const intervalId = setInterval(updateTime, 1000);

        // Cleanup interval on unmount
        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="w-full h-full bg-background flex rounded-2xl overflow-hidden border border-border shadow-sm text-foreground">
            {/* Sidebar */}
            <div className="w-20 md:w-64 bg-card border-r border-border flex flex-col justify-between py-6">
                <div>
                    <div className="px-6 items-center gap-2 mb-8 hidden md:flex">
                        <Clock className="h-6 w-6 text-primary" />
                        <span className="font-bold text-lg tracking-tight">Timeley</span>
                    </div>
                    <div className="px-0 md:px-4 space-y-2">
                        {[
                            { icon: PieChart, label: "Dashboard", active: true },
                            { icon: CalendarIcon, label: "Timesheet", active: false },
                            { icon: Coffee, label: "Time Off", active: false },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className={`flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer ${item.active
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                    }`}
                            >
                                <item.icon className="h-5 w-5" />
                                <span className="hidden md:block text-sm">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="px-4 hidden md:block">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer">
                        <LogOut className="h-5 w-5" />
                        <span className="text-sm">Log out</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4 md:p-8 flex flex-col gap-6 overflow-y-auto bg-muted/20 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Good morning, Alex</h1>
                        <p className="text-sm text-muted-foreground mt-1">Here is what's happening today.</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 text-primary font-semibold">
                        AL
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Quick Punch Card */}
                    <Card className="col-span-1 md:col-span-2 border-border/50 shadow-sm bg-card hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Current Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <div className="text-4xl font-bold font-mono text-foreground">{currentTime}</div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                                        <span className="text-sm font-medium text-green-600 dark:text-green-400">Punched In (Since 9:00 AM)</span>
                                    </div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <Button className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white gap-2">
                                        Punch Out <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm flex flex-col justify-center bg-primary/5">
                        <CardContent className="pt-6 pb-6 text-center">
                            <div className="text-sm font-medium text-muted-foreground mb-1">Time Off Balance</div>
                            <div className="text-3xl font-bold text-primary">12 Days</div>
                            <Button variant="link" className="mt-2 h-auto p-0 text-sm">Request Leave &rarr;</Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Activity Feed */}
                <Card className="border-border/50 shadow-sm flex-1">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { time: "Today, 9:00 AM", event: "Punched In", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
                                { time: "Yesterday, 5:30 PM", event: "Punched Out", icon: LogOut, color: "text-red-500", bg: "bg-red-500/10" },
                                { time: "Yesterday, 1:00 PM", event: "Returned from Lunch", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
                                { time: "Yesterday, 12:00 PM", event: "Lunch Break", icon: Coffee, color: "text-orange-500", bg: "bg-orange-500/10" },
                            ].map((activity, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className={`h-9 w-9 rounded-full flex items-center justify-center ${activity.bg}`}>
                                        <activity.icon className={`h-4 w-4 ${activity.color}`} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium">{activity.event}</div>
                                        <div className="text-xs text-muted-foreground">{activity.time}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
