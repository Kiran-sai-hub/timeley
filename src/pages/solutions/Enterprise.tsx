import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle2, ArrowRight, Shield, Users, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Enterprise = () => (
    <div className="min-h-screen bg-background">
        <Navbar activePage="solutions" />

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground font-sans leading-tight">
                Structured access.<br />
                <span className="text-primary">Clear accountability.</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Large organizations need more than a punch clock, they need role-based visibility,
                structured approval flows, and clean records. Timeley is building toward that.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/contact">
                    <Button size="lg" className="px-8">Talk to Us <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </Link>
                <Link to="/pricing">
                    <Button size="lg" variant="outline" className="px-8">See Pricing</Button>
                </Link>
            </div>
        </section>

        <section className="border-y border-border bg-card/50">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <h2 className="text-2xl font-bold text-foreground font-sans text-center mb-10">
                    What's available today
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { icon: Shield, title: 'Role-based access', desc: 'Employees see only their own data. Managers see their team. Clear separation from day one.' },
                        { icon: Users, title: 'Approval workflows', desc: 'Leave requests go through a structured manager-approval flow with full audit visibility.' },
                        { icon: BarChart3, title: 'Attendance records', desc: 'Every punch in and out is timestamped and logged. No manual edits, no ambiguity.' },
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
            <h2 className="text-2xl font-bold text-foreground font-sans mb-8">What's on the roadmap</h2>
            <div className="space-y-3">
                {[
                    'SSO / SAML authentication',
                    'Department-level reporting and analytics',
                    'Custom leave policy configuration',
                    'Audit logs for compliance',
                    'Dedicated account manager',
                    'SLA guarantee and on-premise option',
                ].map((item) => (
                    <div key={item} className="flex items-start gap-3 py-3 border-b border-border last:border-0">
                        <div className="h-5 w-5 rounded-full border-2 border-primary/40 shrink-0 mt-0.5 flex items-center justify-center">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                        </div>
                        <span className="text-muted-foreground">{item} <span className="text-xs text-primary/70 ml-1">— planned</span></span>
                    </div>
                ))}
            </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <div className="rounded-xl border border-border bg-muted/30 px-6 py-5">
                <p className="text-sm font-semibold text-foreground mb-1">Honest heads-up</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Enterprise features like SSO, audit logs, and custom integrations are not live yet. If your organization
                    has specific requirements, we'd love to talk. Please reach out via our Contact page and we'll be upfront about what we can and can't do today.
                </p>
            </div>
        </section>

        <section className="bg-primary/5 border-t border-border">
            <div className="max-w-3xl mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold text-foreground font-sans">Have specific requirements?</h2>
                <p className="mt-3 text-muted-foreground">Talk to us. We'll be honest about what we support today.</p>
                <Link to="/contact">
                    <Button size="lg" className="mt-6 px-10">Get in Touch</Button>
                </Link>
            </div>
        </section>

        <Footer />
    </div>
);

export default Enterprise;
