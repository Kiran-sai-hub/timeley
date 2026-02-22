import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Link } from 'react-router-dom';
import { ClipboardList, CheckCircle2, ArrowRight, Shield, Bell, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HRDepartments = () => (
    <div className="min-h-screen bg-background">
        <Navbar activePage="solutions" />

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground font-sans leading-tight">
                Less chasing.<br />
                <span className="text-primary">More clarity.</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                HR teams spend too much time chasing attendance records and leave requests.
                Timeley centralizes both, so your HR team has the data they need without the back-and-forth.
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
                    What HR teams get from Timeley
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { icon: Shield, title: 'Structured leave workflow', desc: 'Annual, sick, and casual leave go through a proper request → approval flow. No more handling requests over email.' },
                        { icon: Bell, title: 'Automatic notifications', desc: 'Employees get notified when their leave is approved or rejected, HR doesn\'t need to follow up manually.' },
                        { icon: BarChart3, title: 'Attendance records', desc: 'Every employee\'s punch history is timestamped and stored. Easy to review without digging through spreadsheets.' },
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
            <h2 className="text-2xl font-bold text-foreground font-sans mb-8">What HR gets today</h2>
            <div className="space-y-3">
                {[
                    'Leave request submission (annual, sick, casual)',
                    'Manager approval / rejection in one click',
                    'Leave balance tracking per employee',
                    'Attendance calendar per employee',
                    'Real-time notifications on approval decisions',
                    'Hours breakdown, daily totals per person',
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
                    Timeley does not yet support custom leave policies, payroll integrations, or bulk data exports.
                    These are on the roadmap. If these are blockers for you, we'd rather be upfront now than oversell.
                    Reach out via the Contact page and let's talk about your needs.
                </p>
            </div>
        </section>

        <section className="bg-primary/5 border-t border-border">
            <div className="max-w-3xl mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold text-foreground font-sans">Make leave management simple</h2>
                <p className="mt-3 text-muted-foreground">Start free and see how it fits your team's workflow.</p>
                <Link to="/login">
                    <Button size="lg" className="mt-6 px-10">Get Started</Button>
                </Link>
            </div>
        </section>

        <Footer />
    </div>
);

export default HRDepartments;
