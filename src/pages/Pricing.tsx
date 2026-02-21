import { Link } from 'react-router-dom';
import { Clock, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'For individuals and small teams getting started.',
    features: ['Up to 5 users', 'Punch in / out', 'Daily & weekly stats', 'Leave requests', 'Calendar view'],
    cta: 'Start Free',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/user/month',
    desc: 'For growing teams that need full control.',
    features: ['Unlimited users', 'Everything in Free', 'Manager dashboard', 'Overtime analytics', 'Hours breakdown export', 'Priority support'],
    cta: 'Upgrade to Pro',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For large organizations with custom needs.',
    features: ['Everything in Pro', 'SSO / SAML', 'Custom integrations', 'Dedicated account manager', 'SLA guarantee', 'On-premise option'],
    cta: 'Contact Sales',
    highlight: false,
  },
];

const faqs = [
  {
    q: 'How does the free plan work?',
    a: 'The free plan supports up to 5 users with full punch clock, calendar, and leave request functionality. No credit card required.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Yes! You can upgrade or downgrade at any time. When upgrading, you\'ll be billed pro-rata for the remainder of the billing cycle.',
  },
  {
    q: 'What happens to my data if I cancel?',
    a: 'Your data is retained for 30 days after cancellation. You can export all time entries and leave records before that.',
  },
  {
    q: 'Is there a mobile app?',
    a: 'Timely is a fully responsive web app that works great on mobile browsers. A native app is on our roadmap.',
  },
  {
    q: 'How does overtime calculation work?',
    a: 'Any hours beyond 8 per day are automatically counted as overtime. You can see the split in your daily summary and hours breakdown table.',
  },
  {
    q: 'Can managers see all employee data?',
    a: 'Managers can view team attendance status and approve/reject leave requests. They see aggregated data, not individual punch-by-punch logs.',
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Clock className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold font-sans text-foreground tracking-tight">Timely</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link to="/pricing" className="text-sm font-medium text-foreground transition-colors">Pricing</Link>
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

      {/* Pricing Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground font-sans">Simple, transparent pricing</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
          Start free. Upgrade when your team grows. No hidden fees.
        </p>
      </section>

      {/* Plans */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`border-border relative flex flex-col ${
                plan.highlight ? 'border-primary ring-2 ring-primary/20 shadow-lg' : 'bg-card'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg font-semibold text-foreground">{plan.name}</CardTitle>
                <div className="mt-3">
                  <span className="text-4xl font-bold text-foreground font-mono">{plan.price}</span>
                  {plan.period && <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>}
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.desc}</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/login" className="mt-6">
                  <Button
                    className="w-full"
                    variant={plan.highlight ? 'default' : 'outline'}
                  >
                    {plan.cta} {plan.highlight && <ArrowRight className="ml-1 h-4 w-4" />}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-card/50 border-y border-border">
        <div className="max-w-3xl mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold text-foreground text-center font-sans mb-10">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-foreground">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Timely</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/features" className="hover:text-foreground transition-colors">Features</Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/login" className="hover:text-foreground transition-colors">Login</Link>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Timely. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
