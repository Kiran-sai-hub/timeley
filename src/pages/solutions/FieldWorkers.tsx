import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Link } from 'react-router-dom';
import { MapPin, CheckCircle2, ArrowRight, Timer, CalendarDays, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

const FieldWorkers = () => (
    <div className="min-h-screen bg-background">
        <Navbar activePage="solutions" />

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground font-sans leading-tight">
                Clock in from anywhere.<br />
                <span className="text-primary">No desk required.</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Field workers don't sit at a computer all day and they shouldn't have to just to log their hours.
                Timeley works on any mobile browser, so clocking in is just a tap away.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/login">
                    <Button size="lg" className="px-8">Get Started Free <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </Link>
                <Link to="/pricing">
                    <Button size="lg" variant="outline" className="px-8">See Pricing</Button>
                </Link>
            </div>
        </section>

        <section className="border-y border-border bg-card/50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <h2 className="text-2xl font-bold text-foreground font-sans text-center mb-10">
                    Built to work on-the-go
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { icon: Timer, title: 'One-tap from a phone', desc: 'The punch clock works on any mobile browser. Open it, tap once and you\'re in. Tap again when done.' },
                        { icon: CalendarDays, title: 'Your full history is always there', desc: 'Check your own attendance calendar, leave balance, and hours from your phone at any time.' },
                        { icon: Bell, title: 'Reminders so you don\'t forget', desc: 'Timeley can remind you if you forget to punch out, useful when your day ends away from a desk.' },
                    ].map(({ icon: Icon, title, desc }) => (
                        <div key={title} className="rounded-xl border border-border bg-card p-6">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="text-2xl font-bold text-foreground font-sans mb-8">What you get</h2>
            <div className="space-y-3">
                {[
                    'Fully responsive works on any modern mobile browser',
                    'One-tap punch in / punch out',
                    'Your attendance calendar on your phone',
                    'Submit leave requests from mobile',
                    'Get notified when leave is approved or rejected',
                    'Auto-remind if you forgot to punch out',
                ].map((item) => (
                    <div key={item} className="flex items-start gap-3 py-3 border-b border-border last:border-0">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-foreground">{item}</span>
                    </div>
                ))}
            </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <div className="rounded-xl border border-border bg-muted/30 px-6 py-5">
                <p className="text-sm font-semibold text-foreground mb-1">Honest heads-up</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Timeley is a responsive web app, it is not a native iOS or Android app yet. It works well
                    in mobile browsers, but there is no "Add to Home Screen" PWA support or push notifications yet.
                    A native app is on our roadmap. The in-app notifications work on web only today.
                </p>
            </div>
        </section>

        <section className="bg-primary/5 border-t border-border">
            <div className="max-w-3xl mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold text-foreground font-sans">Track hours wherever the work is</h2>
                <p className="mt-3 text-muted-foreground">Free to start, works from any phone browser.</p>
                <Link to="/login">
                    <Button size="lg" className="mt-6 px-10">Get Started</Button>
                </Link>
            </div>
        </section>

        <Footer />
    </div>
);

export default FieldWorkers;
