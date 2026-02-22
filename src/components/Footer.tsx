import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';

export function Footer() {
    return (
        <footer className="border-t border-border bg-card">
            <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-foreground">Timeley</span>
                </div>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <Link to="/products" className="hover:text-foreground transition-colors">Products</Link>
                    <Link to="/solutions/startups" className="hover:text-foreground transition-colors">Solutions</Link>
                    <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
                    <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
                    <Link to="/login" className="hover:text-foreground transition-colors">Login</Link>
                </div>
                <p className="text-xs text-muted-foreground">© 2026 Timeley. All rights reserved.</p>
            </div>
        </footer>
    );
}

export default Footer;
