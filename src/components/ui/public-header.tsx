import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function PublicHeader({ onLoginClick }: { onLoginClick: () => void }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    if (location.pathname === '/') {
      e.preventDefault();
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', hash);
      }
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Mobile Hamburger */}
        <div className="md:hidden flex items-center">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-zinc-300 hover:text-white">
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="font-heading font-bold text-xl tracking-tight text-white">Auspexi</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <Link to="/#features" onClick={(e) => handleNavClick(e, '#features')} className="hover:text-white transition-colors">Features</Link>
          <Link to="/#pricing" onClick={(e) => handleNavClick(e, '#pricing')} className="hover:text-white transition-colors">Pricing</Link>
          <Link to="/about" className="hover:text-white transition-colors">About</Link>
          <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
          <Link to="/faq" className="hover:text-white transition-colors">FAQ</Link>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <Link to="/dashboard">
              <Button className="bg-zinc-800 hover:bg-zinc-700 text-white border-0">
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <button onClick={onLoginClick} className="hidden md:block text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                Sign In
              </button>
              <Button onClick={onLoginClick} className="bg-white hover:bg-zinc-200 text-black border-0">
                Get Started
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-zinc-950 border-b border-zinc-800/50 p-4 flex flex-col gap-4 shadow-xl">
          <Link to="/#features" onClick={(e) => handleNavClick(e, '#features')} className="text-zinc-300 hover:text-white font-medium">Features</Link>
          <Link to="/#pricing" onClick={(e) => handleNavClick(e, '#pricing')} className="text-zinc-300 hover:text-white font-medium">Pricing</Link>
          <Link to="/about" onClick={() => setIsMenuOpen(false)} className="text-zinc-300 hover:text-white font-medium">About</Link>
          <Link to="/blog" onClick={() => setIsMenuOpen(false)} className="text-zinc-300 hover:text-white font-medium">Blog</Link>
          <Link to="/faq" onClick={() => setIsMenuOpen(false)} className="text-zinc-300 hover:text-white font-medium">FAQ</Link>
          {!user && (
            <button onClick={() => { onLoginClick(); setIsMenuOpen(false); }} className="text-left text-zinc-300 hover:text-white font-medium">
              Sign In
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
