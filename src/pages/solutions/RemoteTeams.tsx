import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Link } from 'react-router-dom';
import { Globe, CheckCircle2, ArrowRight, Timer, CalendarDays, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const RemoteTeams = () => (
    <div className="min-h-screen bg-background">
        <Navbar activePage="solutions" />

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground font-sans leading-tight">
                Your team is everywhere.<br />
                <span className="text-primary">Your data should be too.</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Remote teams don't have a shared office clock. Timeley gives everyone a single place to
                track their hours no matter where or when they work.
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
                    Why Timeley fits remote work
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { icon: Timer, title: 'Browser-based, works anywhere', desc: 'No install needed. Punch in from a laptop, desktop, or mobile browser wherever your team is.' },
                        { icon: CalendarDays, title: 'Async attendance visibility', desc: 'Managers see who\'s worked today, this week, and this month, without needing to be online at the same time.' },
                        { icon: Users, title: 'Leave stays organized', desc: 'Remote teams often run on async communication. Leave requests and approvals happen in-app, not in scattered Slack messages.' },
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
            <h2 className="text-2xl font-bold text-foreground font-sans mb-8">What's included</h2>
            <div className="space-y-3">
                {[
                    'Web app, accessible from any device, any location',
                    'Punch in / out from a mobile browser (responsive)',
                    'Manager dashboard, see team attendance asynchronously',
                    'Leave approval workflow without email back-and-forth',
                    'Per-employee calendar so nothing is hidden',
                    'Smart notifications for approvals and missed punches',
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
                    We don't currently support multiple time zones displayed simultaneously in the manager view. Your team can use Timeley from anywhere, but all times are stored and shown in the server's UTC format. Time zone display customization is on the roadmap.
                </p>
            </div>
        </section>

        <section className="bg-primary/5 border-t border-border">
            <div className="max-w-3xl mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold text-foreground font-sans">Work from anywhere, track from everywhere</h2>
                <p className="mt-3 text-muted-foreground">Free to start. No setup required.</p>
                <Link to="/login">
                    <Button size="lg" className="mt-6 px-10">Get Started</Button>
                </Link>
            </div>
        </section>

        <Footer />
    </div>
);

export default RemoteTeams;
