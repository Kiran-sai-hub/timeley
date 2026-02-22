import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Link } from 'react-router-dom';
import { Rocket, CheckCircle2, ArrowRight, Timer, BarChart3, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const cards = [
    {
        icon: Timer,
        title: 'Live in under 5 minutes',
        desc: 'Sign up, add your team, and start tracking. No configuration, no consultants.',
    },
    {
        icon: BarChart3,
        title: 'Instant visibility',
        desc: "See who's working right now, today's hours, and this week's totals all without asking anyone.",
    },
    {
        icon: Shield,
        title: 'Leave management included',
        desc: 'Your team can submit leave requests and get manager approval in the same app.',
    },
];

const Startups = () => (
    <div className="min-h-screen bg-background">
        <Navbar activePage="solutions" />

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground font-sans leading-tight">
                Time tracking that<br />
                <span className="text-primary">doesn&apos;t slow you down</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                When you&apos;re building fast, the last thing you want is heavy HR software. Timeley gets your
                team tracking time in minutes. No IT setup, no training, no nonsense.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/login">
                    <Button size="lg" className="px-8">
                        Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
                <Link to="/pricing">
                    <Button size="lg" variant="outline" className="px-8">See Pricing</Button>
                </Link>
            </div>
        </section>

        {/* Why section */}
        <section className="border-y border-border bg-card/50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <h2 className="text-2xl font-bold text-foreground font-sans text-center mb-10">
                    Why Timeley works for startups
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cards.map(({ icon: Icon, title, desc }) => (
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

        {/* What you get */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="text-2xl font-bold text-foreground font-sans mb-8">What you actually get</h2>
            <div className="space-y-3">
                {[
                    'Free plan for up to 5 users, no credit card',
                    'Punch in / out from any device, including mobile browsers',
                    'Automatic overtime calculation (beyond 8 hrs/day)',
                    'Leave requests with manager approval flow',
                    'Color-coded attendance calendar per employee',
                    'Role-based access: employee vs. manager views',
                ].map((item) => (
                    <div key={item} className="flex items-start gap-3 py-3 border-b border-border last:border-0">
                        <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-foreground">{item}</span>
                    </div>
                ))}
            </div>
        </section>

        {/* Honest note */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <div className="rounded-xl border border-border bg-muted/30 px-6 py-5">
                <p className="text-sm font-semibold text-foreground mb-1">Honest heads-up</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Timeley is early-stage software. We&apos;re building in public and improving fast.
                    Some features listed on the roadmap (like native mobile apps and email notifications) aren&apos;t live yet.
                    What&apos;s here today works well and we ship updates regularly.
                </p>
            </div>
        </section>

        {/* CTA */}
        <section className="bg-primary/5 border-t border-border">
            <div className="max-w-3xl mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold text-foreground font-sans">Start free today</h2>
                <p className="mt-3 text-muted-foreground">No credit card. No commitment. Just sign up and go.</p>
                <Link to="/login">
                    <Button size="lg" className="mt-6 px-10">Create Your Account</Button>
                </Link>
            </div>
        </section>

        <Footer />
    </div>
);

export default Startups;
