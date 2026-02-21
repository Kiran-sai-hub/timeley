import { Link } from 'react-router-dom';
import { Clock, BarChart3, Shield, Users, CalendarDays, Timer, FileText, Bell, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: Timer,
    title: 'One-Tap Punch Clock',
    desc: 'Clock in and out with a single tap. Real-time status shows whether you\'re currently on shift or off duty.',
  },
  {
    icon: BarChart3,
    title: 'Hours Analytics',
    desc: 'Automatic daily, weekly, monthly, and yearly hour breakdowns. See regular vs overtime hours at a glance.',
  },
  {
    icon: CalendarDays,
    title: 'Interactive Calendar',
    desc: 'Color-coded calendar view showing working days, partial days, absences, and leave, all with a detail panel for each day.',
  },
  {
    icon: Shield,
    title: 'Leave Requests',
    desc: 'Submit annual, sick, or casual leave requests. Track approval status and remaining balances in real time.',
  },
  {
    icon: Users,
    title: 'Manager Dashboard',
    desc: 'Managers can view the full team\'s attendance, approve or reject leave requests, and see who\'s in or out today.',
  },
  {
    icon: FileText,
    title: 'Hours Breakdown Table',
    desc: 'Detailed day-by-day table of hours worked, showing date, regular hours, overtime, and total per row.',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    desc: 'Get notified when your leave is approved or rejected, and when you forget to punch out at end of day.',
  },
  {
    icon: Clock,
    title: 'Shift Tracking',
    desc: 'Track multiple shifts per day with individual punch-in and punch-out pairs displayed on a timeline.',
  },
];

const Features = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Clock className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold font-sans text-foreground tracking-tight">Timeley</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/features" className="text-sm font-medium text-foreground transition-colors">Features</Link>
            <Link to="/pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/login">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground font-sans">What We Offer</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Everything your team needs to track time, manage leaves, and stay organized, all in one place, built into one seamless platform.
        </p>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="bg-card border-border hover:shadow-lg transition-shadow group">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="font-semibold text-foreground text-lg">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Why Timely */}
      <section className="bg-card/50 border-y border-border">
        <div className="max-w-4xl mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold text-foreground text-center font-sans mb-12">Why teams choose Timeley</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              'No complex setup, just works out of the box',
              'Role-based access for employees & managers',
              'Real-time sync across all devices',
              'Privacy-first, your data is your\'s only',
              'Beautiful calendar with day-by-day detail',
              'Overtime calculated automatically',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-foreground font-sans">Start tracking today</h2>
        <p className="mt-3 text-muted-foreground">Create your free account and set up your team in minutes.</p>
        <Link to="/login">
          <Button size="lg" className="mt-8 text-base px-10">
            Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
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
    </div>
  );
};

export default Features;
