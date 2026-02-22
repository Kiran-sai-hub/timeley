import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Link } from 'react-router-dom';
import { TrendingUp, CheckCircle2, ArrowRight, Users, BarChart3, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const cards = [
    {
        icon: Users,
        title: 'Manager view scales with you',
        desc: "Managers get a real-time view of who's clocked in across the whole team, no spreadsheets needed.",
    },
    {
        icon: BarChart3,
        title: 'Overtime tracked automatically',
        desc: 'As hours grow, Timeley automatically splits regular vs. overtime so payroll conversations are easy.',
    },
    {
        icon: Shield,
        title: 'Leave approval stays structured',
        desc: 'Leave requests go through a proper approval flow so nothing gets lost in Slack or email.',
    },
];

const GrowingTeams = () => (
    <div className="min-h-screen bg-background">
        <Navbar activePage="solutions" />

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground font-sans leading-tight">
                Built for teams that<br />
                <span className="text-primary">keep getting bigger</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                As your headcount grows, managing attendance and leave manually gets messy fast.
                Timeley keeps everyone accountable from your first hire to your fiftieth.
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
                    Why teams grow into Timeley
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

        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="text-2xl font-bold text-foreground font-sans mb-8">What&apos;s included</h2>
            <div className="space-y-3">
                {[
                    'Unlimited users on the Pro plan ($9/user/month)',
                    'Manager dashboard with team-wide attendance view',
                    'Leave request and approval workflow',
                    'Per-employee calendar with color-coded attendance',
                    'Hours breakdown table, daily view per person',
                    'Role-based access: employees see their own data, managers see all',
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
                    Timeley is early-stage. Advanced features like department-level analytics, cross-team reporting,
                    and payroll integrations are on the roadmap and are not live yet. What you get today is solid and
                    getting better with each update.
                </p>
            </div>
        </section>

        <section className="bg-primary/5 border-t border-border">
            <div className="max-w-3xl mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold text-foreground font-sans">Grow without the overhead</h2>
                <p className="mt-3 text-muted-foreground">Start on the free plan, upgrade when you&apos;re ready.</p>
                <Link to="/login">
                    <Button size="lg" className="mt-6 px-10">Get Started</Button>
                </Link>
            </div>
        </section>

        <Footer />
    </div>
);

export default GrowingTeams;
