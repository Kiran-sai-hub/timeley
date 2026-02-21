import { Link } from 'react-router-dom';
import { Clock, Shield, BarChart3, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import dashboardPreview from '@/assets/dashboard-preview.png';

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Clock className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold font-sans text-foreground tracking-tight">Timeley</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/login">
              <Button size="sm">Get Started <ArrowRight className="ml-1 h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/30 pointer-events-none" />
        <div className="flex flex-col overflow-hidden">
          <ContainerScroll
            titleComponent={
            <div className="text-center">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight max-w-3xl mx-auto font-sans">
                  Track time. <br className="hidden sm:block" />
                  <span className="text-primary">Manage leaves.</span> <br className="hidden sm:block" />
                  Stay in control.
                </h1>
                <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                  Timeley helps teams punch in, track hours, request leave, and get manager approvals, all in one clean dashboard.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                </div>
              </div>
            }>

            <img
              src={dashboardPreview}
              alt="Timely dashboard preview showing calendar, punch clock, and weekly stats"
              className="mx-auto rounded-2xl object-cover h-full w-full object-left-top"
              draggable={false} />

          </ContainerScroll>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
          { value: '99.9%', label: 'Uptime' },
          { value: '10k+', label: 'Active Users' },
          { value: '2M+', label: 'Hours Tracked' },
          { value: '4.9★', label: 'User Rating' }].
          map((stat) =>
          <div key={stat.label}>
              <div className="text-3xl font-bold text-primary font-mono">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          )}
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground font-sans">Everything you need</h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">Simple tools that keep your workforce organized and accountable.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
          { icon: Clock, title: 'Punch Clock', desc: 'One-tap punch in / out with real-time status tracking.' },
          { icon: BarChart3, title: 'Hours Analytics', desc: 'Daily, weekly, monthly, and yearly hour breakdowns.' },
          { icon: Shield, title: 'Leave Management', desc: 'Submit requests, track balances, get manager approvals.' },
          { icon: Users, title: 'Team Overview', desc: 'Managers see who\'s in, who\'s out, and pending requests.' }].
          map((feature) =>
          <Card key={feature.title} className="bg-card border-border hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="font-semibold text-foreground text-lg">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary/5 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl font-bold text-foreground font-sans">Ready to get started?</h2>
          <p className="mt-3 text-muted-foreground">Join thousands of teams already using Timeley to track their time.</p>
          <Link to="/login">
            <Button size="lg" className="mt-8 text-base px-10">
              Create Your Account <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Timeley</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/features" className="hover:text-foreground transition-colors">Features</Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/login" className="hover:text-foreground transition-colors">Login</Link>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Timeley. All rights reserved.</p>
        </div>
      </footer>
    </div>);

};

export default Landing;