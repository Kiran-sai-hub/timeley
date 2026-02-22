import { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Clock, Timer, BarChart3, Shield, CalendarDays, Users, Bell,
    ChevronDown, Rocket, TrendingUp, Globe, Building2, ClipboardList, MapPin,
    ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ──────────────────────────────────────────────
// Menu data
// ──────────────────────────────────────────────
const products = [
    { icon: Timer, label: 'Punch Clock', desc: 'One-tap clock in / out', href: '/products#punch-clock' },
    { icon: BarChart3, label: 'Hours Analytics', desc: 'Daily, weekly & monthly breakdowns', href: '/products#analytics' },
    { icon: Shield, label: 'Leave Management', desc: 'Submit, track & approve requests', href: '/products#leave' },
    { icon: CalendarDays, label: 'Interactive Calendar', desc: 'Color-coded attendance calendar', href: '/products#calendar' },
    { icon: Users, label: 'Manager Dashboard', desc: 'Full team view & approvals', href: '/products#manager' },
    { icon: Bell, label: 'Smart Notifications', desc: 'Alerts for approvals & missed punches', href: '/products#notifications' },
];

const solutions = [
    { icon: Rocket, label: 'Startups', desc: 'Lightweight setup, zero overhead', href: '/solutions/startups' },
    { icon: TrendingUp, label: 'Growing Teams', desc: 'Scale as your headcount grows', href: '/solutions/growing-teams' },
    { icon: Globe, label: 'Remote Teams', desc: 'Track distributed teams easily', href: '/solutions/remote-teams' },
    { icon: Building2, label: 'Enterprise', desc: 'Role-based access & compliance', href: '/solutions/enterprise' },
    { icon: ClipboardList, label: 'HR Departments', desc: 'Streamline leave workflows', href: '/solutions/hr-departments' },
    { icon: MapPin, label: 'Field Workers', desc: 'Mobile-friendly time tracking', href: '/solutions/field-workers' },
];

// ──────────────────────────────────────────────
// Dropdown sub-component
// ──────────────────────────────────────────────
interface DropdownItem {
    icon: React.ElementType;
    label: string;
    desc: string;
    href: string;
}

function NavDropdown({ items, visible }: { items: DropdownItem[]; visible: boolean }) {
    return (
        <div
            className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[480px] rounded-xl border border-border bg-card shadow-2xl shadow-black/20 transition-all duration-200 origin-top ${visible ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
                }`}
        >
            <div className="p-2 grid grid-cols-2 gap-1">
                {items.map(({ icon: Icon, label, desc, href }) => (
                    <Link
                        key={label}
                        to={href}
                        className="flex items-start gap-3 rounded-lg px-3 py-3 hover:bg-accent/60 transition-colors group"
                    >
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-foreground leading-tight">{label}</div>
                            <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────
// Main Navbar
// ──────────────────────────────────────────────
type ActivePage = 'home' | 'products' | 'solutions' | 'pricing' | 'contact';

interface NavbarProps {
    activePage?: ActivePage;
}

export function Navbar({ activePage }: NavbarProps) {
    const [openMenu, setOpenMenu] = useState<'products' | 'solutions' | null>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleMouseEnter = (menu: 'products' | 'solutions') => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setOpenMenu(menu);
    };

    const handleMouseLeave = () => {
        closeTimer.current = setTimeout(() => setOpenMenu(null), 120);
    };

    const linkClass = (page: ActivePage) =>
        `text-sm font-medium transition-colors ${activePage === page ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
        }`;

    const chevronClass = (menu: 'products' | 'solutions') =>
        `h-3.5 w-3.5 ml-0.5 transition-transform duration-200 ${openMenu === menu ? 'rotate-180' : ''}`;

    return (
        <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">

                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 shrink-0">
                    <Clock className="h-7 w-7 text-primary" />
                    <span className="text-xl font-bold font-sans text-foreground tracking-tight">Timeley</span>
                </Link>

                {/* Desktop nav links */}
                <div className="hidden md:flex items-center gap-1">

                    {/* Products dropdown */}
                    <div
                        className="relative"
                        onMouseEnter={() => handleMouseEnter('products')}
                        onMouseLeave={handleMouseLeave}
                    >
                        <Link
                            to="/products"
                            className={`flex items-center gap-0.5 px-3 py-2 rounded-md ${linkClass('products')}`}
                        >
                            Products <ChevronDown className={chevronClass('products')} />
                        </Link>
                        <NavDropdown items={products} visible={openMenu === 'products'} />
                    </div>

                    {/* Solutions dropdown */}
                    <div
                        className="relative"
                        onMouseEnter={() => handleMouseEnter('solutions')}
                        onMouseLeave={handleMouseLeave}
                    >
                        <button
                            className={`flex items-center gap-0.5 px-3 py-2 rounded-md ${linkClass('solutions')}`}
                        >
                            Solutions <ChevronDown className={chevronClass('solutions')} />
                        </button>
                        <NavDropdown items={solutions} visible={openMenu === 'solutions'} />
                    </div>

                    <Link to="/pricing" className={`px-3 py-2 rounded-md ${linkClass('pricing')}`}>Pricing</Link>
                    <Link to="/contact" className={`px-3 py-2 rounded-md ${linkClass('contact')}`}>Contact</Link>
                </div>

                {/* CTA buttons */}
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
    );
}

export default Navbar;
