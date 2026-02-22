import { Link } from 'react-router-dom';
import { Clock, Shield, BarChart3, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import { MiniDashboard } from '@/components/MiniDashboard';
import DisplayCards from '@/components/ui/display-cards';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar activePage="home" />

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
            }
          >
            <MiniDashboard />
          </ContainerScroll>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground font-sans leading-tight">
              Everything you need <br /><span className="text-primary">in one place</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Simple tools that keep your workforce organized and accountable. Punch clock, leave management, analytics, and a manager dashboard, all built in.
            </p>
            <div className="pt-4 flex justify-center lg:justify-start">
              <Link to="/products">
                <Button variant="outline" size="lg" className="rounded-full px-8">
                  View all features
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex-1 flex justify-center items-center min-h-[400px] w-full -translate-x-6 -translate-y-6">
            <DisplayCards cards={[
              {
                icon: <Clock className="size-4 text-blue-300" />,
                title: "Punch Clock",
                description: "One-tap punch in / out",
                date: "Real-time status tracking",
                iconClassName: "text-blue-500",
                titleClassName: "text-blue-500",
                className:
                  "z-10 [grid-area:stack] hover:-translate-x-44 hover:-translate-y-4 hover:z-50 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0 before:bg-[url(https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1000)] before:bg-cover",
              },
              {
                icon: <BarChart3 className="size-4 text-emerald-300" />,
                title: "Hours Analytics",
                description: "Detailed hour breakdowns",
                date: "Daily, Weekly, Monthly",
                iconClassName: "text-emerald-500",
                titleClassName: "text-emerald-500",
                className:
                  "z-20 [grid-area:stack] translate-x-8 translate-y-8 hover:-translate-x-36 hover:-translate-y-4 hover:z-50 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0 before:bg-[url(https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000)] before:bg-cover",
              },
              {
                icon: <Shield className="size-4 text-purple-300" />,
                title: "Leave Management",
                description: "Submit & track requests",
                date: "Quick manager approvals",
                iconClassName: "text-purple-500",
                titleClassName: "text-purple-500",
                className:
                  "z-30 [grid-area:stack] translate-x-16 translate-y-16 hover:-translate-x-28 hover:-translate-y-4 hover:z-50 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0 before:bg-[url(https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1000)] before:bg-cover",
              },
              {
                icon: <Users className="size-4 text-amber-300" />,
                title: "Team Overview",
                description: "See who's in and out",
                date: "Always updated view",
                iconClassName: "text-amber-500",
                titleClassName: "text-amber-500",
                className:
                  "z-40 [grid-area:stack] translate-x-24 translate-y-24 hover:-translate-x-20 hover:-translate-y-4 hover:z-50 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0 before:bg-[url(https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000)] before:bg-cover",
              },
            ]} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary/5 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl font-bold text-foreground font-sans">Ready to get started?</h2>
          <p className="mt-3 text-muted-foreground">
            Create a free account and give your team a better way to track time and manage leave.
          </p>
          <Link to="/login">
            <Button size="lg" className="mt-8 text-base px-10">
              Create Your Account <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;