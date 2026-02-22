import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Mail, MessageSquare, Clock, Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const contactReasons = [
    {
        icon: MessageSquare,
        title: "Questions about what's built",
        desc: "Not sure if a feature exists yet? Just ask us, and we prefer being honest upfront.",
    },
    {
        icon: Clock,
        title: 'Feedback or bug reports',
        desc: 'Found something broken or confusing? We want to know. Every report helps.',
    },
    {
        icon: Mail,
        title: 'Enterprise or custom needs',
        desc: "Have specific requirements? We'll tell you plainly whether we can support them today or not.",
    },
];

const Contact = () => {
    const [sent, setSent] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSent(true);
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar activePage="contact" />

            {/* Hero */}
            <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 text-center">
                <h1 className="text-4xl sm:text-5xl font-bold text-foreground font-sans leading-tight">
                    Get in <span className="text-primary">touch</span>
                </h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                    Have a question, a feature request, or just want to know if Timeley is right for your team?
                    We&apos;d love to hear from you and we&apos;ll give you a straight answer.
                </p>
            </section>

            {/* Content */}
            <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 grid lg:grid-cols-2 gap-12 items-start">

                {/* Left — info */}
                <div className="space-y-8">
                    <div>
                        <h2 className="text-xl font-bold text-foreground font-sans mb-4">When to reach out</h2>
                        <div className="space-y-4">
                            {contactReasons.map(({ icon: Icon, title, desc }) => (
                                <div key={title} className="flex items-start gap-3">
                                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <Icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-foreground">{title}</div>
                                        <div className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-muted/30 px-5 py-4">
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-foreground">We&apos;re pre-launch</p>
                                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                                    Timeley is in active development. We don&apos;t have a support team yet, but we do read every
                                    message and respond personally. Expect a reply within 1&ndash;2 business days.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm text-muted-foreground">
                            You can also reach us directly at{' '}
                            <a href="mailto:hello@timeley.app" className="text-primary hover:underline font-medium">
                                hello@timeley.app
                            </a>
                        </p>
                    </div>
                </div>

                {/* Right — form */}
                <Card className="border-border bg-card">
                    <CardContent className="p-6">
                        {sent ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                                    <CheckCircle2 className="h-7 w-7 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">Message sent!</h3>
                                <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
                                    Thanks for reaching out. We&apos;ll get back to you within 1&ndash;2 business days.
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2"
                                    onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                                >
                                    Send another message
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <h3 className="text-lg font-bold text-foreground mb-5">Send us a message</h3>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="contact-name">Name</label>
                                        <input
                                            id="contact-name"
                                            type="text"
                                            required
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            placeholder="Your name"
                                            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="contact-email">Email</label>
                                        <input
                                            id="contact-email"
                                            type="email"
                                            required
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            placeholder="you@company.com"
                                            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="contact-subject">Subject</label>
                                    <select
                                        id="contact-subject"
                                        required
                                        value={form.subject}
                                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                                    >
                                        <option value="">Select a topic</option>
                                        <option value="question">Question about features</option>
                                        <option value="bug">Bug report</option>
                                        <option value="feedback">General feedback</option>
                                        <option value="enterprise">Enterprise / custom needs</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5" htmlFor="contact-message">Message</label>
                                    <textarea
                                        id="contact-message"
                                        required
                                        rows={5}
                                        value={form.message}
                                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                                        placeholder="Tell us what's on your mind..."
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition resize-none"
                                    />
                                </div>

                                <Button type="submit" className="w-full" size="lg">
                                    Send Message <Send className="ml-2 h-4 w-4" />
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </section>

            <Footer />
        </div>
    );
};

export default Contact;
