import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Link } from 'react-router-dom';
import {
    Timer, BarChart3, Shield, CalendarDays, Users, Bell, ArrowRight, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const features = [
    {
        id: 'punch-clock',
        icon: Timer,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        title: 'Punch Clock',
        tagline: "Clock in. Clock out. That's it.",
        description:
            "A single button is all it takes. Tap to start your shift, tap to end it. Timeley records your exact start and end times and shows your live status - so everyone knows who's on shift right now.",
        what: [
            'One-tap punch in / punch out',
            'Real-time "on duty" status visible to managers',
            'Multiple shifts per day supported',
            'Shift timeline visible on your profile',
        ],
        honest: 'Currently a web app. Mobile browser works well; a native app is on our roadmap.',
    },
    {
        id: 'analytics',
        icon: BarChart3,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        title: 'Hours Analytics',
        tagline: "Know exactly how much you've worked.",
        description:
            'Timeley automatically calculates your hours the moment you punch out. No manual entry, no guesswork. View totals by day, week, month, or year, see overtime broken out separately.',
        what: [
            'Daily, weekly, monthly, yearly totals',
            'Overtime auto-calculated (beyond 8 hrs/day)',
            'Regular vs. overtime split at a glance',
            'Exportable hours breakdown table',
        ],
        honest: 'Export is currently a planned feature, but the breakdown table is live and readable today.',
    },
    {
        id: 'leave',
        icon: Shield,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
        title: 'Leave Management',
        tagline: 'Request leave. Get it approved. Stay informed.',
        description:
            "Submit annual, sick, or casual leave directly in the app. Managers review and approve or reject in one click. You'll get notified instantly, no email chains, no chasing anyone.",
        what: [
            'Submit annual, sick, casual leave requests',
            'Track approval status in real time',
            'See your remaining leave balance',
            'Manager approves / rejects in one click',
        ],
        honest: 'Leave policies (e.g. custom leave types) are not configurable yet, we use standard categories for now.',
    },
    {
        id: 'calendar',
        icon: CalendarDays,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        title: 'Interactive Calendar',
        tagline: 'Your full attendance history, at a glance.',
        description:
            'A color-coded calendar shows every working day, partial day, absence, and approved leave at a glance. Click any day to open a detail panel showing exact punch times and hours.',
        what: [
            'Color-coded: worked, partial, absent, leave',
            'Day detail panel with exact punch times',
            'Navigate by month',
            'Quickly spot attendance gaps',
        ],
        honest: 'Calendar is read-only right now, you cannot manually edit punch times from the calendar view yet.',
    },
    {
        id: 'manager',
        icon: Users,
        color: 'text-rose-500',
        bg: 'bg-rose-500/10',
        title: 'Manager Dashboard',
        tagline: 'See your full team without micromanaging.',
        description:
            "Managers get a dedicated view showing who's currently clocked in, who's on leave, and any pending leave requests. Review and act on requests without leaving the dashboard.",
        what: [
            "Live 'who's in / who's out' team overview",
            'Pending leave requests with one-click approve / reject',
            'Attendance history per employee',
            'Role-based: only managers see this view',
        ],
        honest: 'The manager view is scoped to your own team. Cross-department views are planned for a future release.',
    },
    {
        id: 'notifications',
        icon: Bell,
        color: 'text-cyan-500',
        bg: 'bg-cyan-500/10',
        title: 'Smart Notifications',
        tagline: 'Stay in the loop automatically.',
        description:
            "Timeley sends you relevant alerts at the right time: when your leave request gets a decision, or when you've forgotten to punch out at the end of a shift.",
        what: [
            'Leave approved / rejected notifications',
            'Forgot to punch out reminder',
            'In-app notification center',
            'Real-time updates, no manual refresh needed',
        ],
        honest: 'Notifications are in-app only right now. Email and push notifications are on our roadmap.',
    },
];

const Products = () => {
    return (
        <div className="min-h-screen bg-background">
            <Navbar activePage="products" />

            {/* Hero */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 text-center">
                <h1 className="text-4xl sm:text-5xl font-bold text-foreground font-sans leading-tight">
                    Everything inside <span className="text-primary">Timeley</span>
                </h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                    A focused set of tools for time tracking and leave management. No bloat, no fluff -
                    just the things your team actually needs to stay organized and accountable.
                </p>
            </section>

            {/* Feature Sections */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-24">
                {features.map((f, idx) => {
                    const Icon = f.icon;
                    const isEven = idx % 2 === 0;
                    return (
                        <div
                            key={f.id}
                            id={f.id}
                            className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12 lg:gap-20`}
                        >
                            {/* Text */}
                            <div className="flex-1 space-y-5">
                                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.bg}`}>
                                    <Icon className={`h-6 w-6 ${f.color}`} />
                                </div>
                                <h2 className="text-3xl font-bold text-foreground font-sans">
                                    {f.title}
                                    <span className="block text-lg font-normal text-muted-foreground mt-1">{f.tagline}</span>
                                </h2>
                                <p className="text-muted-foreground leading-relaxed">{f.description}</p>

                                <ul className="space-y-2">
                                    {f.what.map((item) => (
                                        <li key={item} className="flex items-start gap-2.5 text-sm">
                                            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                            <span className="text-foreground">{item}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* Honest note */}
                                <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
                                    <span className="font-semibold text-foreground">Heads up: </span>
                                    {f.honest}
                                </div>
                            </div>

                            {/* Visual card */}
                            <div className="flex-1 w-full">
                                <Card className="border-border bg-card/60 overflow-hidden">
                                    <CardContent className="p-8 flex flex-col items-center justify-center min-h-[280px] gap-4">
                                        <div className={`h-20 w-20 rounded-2xl ${f.bg} flex items-center justify-center`}>
                                            <Icon className={`h-10 w-10 ${f.color}`} />
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-foreground">{f.title}</div>
                                            <div className="text-sm text-muted-foreground mt-1">{f.tagline}</div>
                                        </div>
                                        <Link to="/login">
                                            <Button size="sm" variant="outline" className="mt-2">
                                                Try it free <ArrowRight className="ml-1 h-3.5 w-3.5" />
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    );
                })}
            </section>

            {/* CTA */}
            <section className="bg-primary/5 border-t border-border">
                <div className="max-w-3xl mx-auto px-4 py-20 text-center">
                    <h2 className="text-3xl font-bold text-foreground font-sans">Ready to try it?</h2>
                    <p className="mt-3 text-muted-foreground">
                        Timeley is free to start. Set up your account and explore every feature today — no credit card required.
                    </p>
                    <Link to="/login">
                        <Button size="lg" className="mt-8 text-base px-10">
                            Create Free Account <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Products;
