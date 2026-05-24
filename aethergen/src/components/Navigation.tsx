import { useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDemosOpen, setIsDemosOpen] = useState(false);
  const location = useLocation();
  const closeTimer = useRef<number | null>(null);

  const openMenu = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setIsOpen(true);
  };

  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setIsOpen(false), 220);
  };

  const navigationItems = [
    { name: 'Account', href: '/account', current: location.pathname === '/account' },
    { name: 'Dashboard', href: '/account/dashboard', current: location.pathname.startsWith('/account/dashboard') },
    { name: 'Home', href: '/', current: location.pathname === '/' },
    { name: 'About', href: '/about', current: location.pathname === '/about' },
    { name: 'Investors', href: '/investors', current: location.pathname.startsWith('/investors') },
    { name: 'Request a Pilot', href: '/pilot', current: location.pathname.startsWith('/pilot') },
    { name: 'Features', href: '/features', current: location.pathname === '/features' },
    { name: 'Technology', href: '/technology', current: location.pathname === '/technology' },
    { name: 'Roadmap', href: '/roadmap', current: location.pathname === '/roadmap' },
    { name: 'Pricing', href: '/pricing', current: location.pathname === '/pricing' },
    { name: 'FAQ', href: '/faq', current: location.pathname === '/faq' },
    { name: 'Funding', href: '/funding', current: location.pathname === '/funding' },
    { name: 'Blog', href: '/blog', current: location.pathname === '/blog' },
    { name: 'Hallucination Controls', href: '/blog/hallucination-controls-runtime-gating-evidence', current: location.pathname.includes('hallucination-controls-runtime-gating-evidence') },
    { name: 'Docs', href: '/docs', current: location.pathname === '/docs' || location.pathname.startsWith('/docs/') },
    { name: 'Resources', href: '/resources', current: location.pathname === '/resources' },
    { name: 'Hero Art', href: '/hero-art', current: location.pathname === '/hero-art' },
    { name: 'Press', href: '/press', current: location.pathname === '/press' },
    { name: 'Contact', href: '/contact', current: location.pathname === '/contact' },
  ];

  const demoItems = [
    { name: 'Operational Stability (Drift & SLOs)', href: '/stability-demo' },
    { name: 'Efficiency & Optimization', href: '/efficiency-demo' },
    { name: 'Air‑Gapped Packaging & Verification', href: '/air-gapped-demo' },
    { name: 'Automotive Quality (Golden Run)', href: '/automotive-demo' },
    { name: 'Marketplace & Trials', href: '/marketplace-demo' },
    { name: 'Dataset & Model Cards', href: '/cards-demo' },
    { name: 'Financial Crime Lab (Synthetic Graphs)', href: '/financial-crime-demo' },
    { name: 'Swarm Safety (8D Topology)', href: '/swarm-safety-demo' },
    { name: 'Insurance Fraud Playbooks', href: '/insurance-fraud-demo' },
  ];

  // Technology dropdown removed - now single page with sections

  // About dropdown removed - now single page with tabs

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  // Hover-driven open/close; no modal, no header jump

  return (
    <nav className={"fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-transparent"}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <Logo className="h-12 w-12" />
              <span className={`ml-2 text-xl font-bold text-white`}>
                Auspexi
              </span>
            </Link>
          </div>

          {/* Hamburger Menu - right side with hover dropdown */}
          <div className="hidden md:block relative" onMouseEnter={openMenu} onMouseLeave={scheduleClose}>
            <button
              onMouseEnter={openMenu}
              className={`inline-flex items-center justify-center p-2 rounded-md transition-colors text-white hover:text-blue-300`}
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Invisible hover bridge to remove any gap between trigger and menu */}
            <div
              className="absolute right-0 w-48 h-2"
              style={{ top: '100%' }}
              onMouseEnter={openMenu}
            />

            {/* Dropdown Menu - Positioned directly under hamburger button */}
            <div
              onMouseEnter={openMenu}
              onMouseLeave={scheduleClose}
              className={`absolute right-0 mt-0 w-56 bg-white rounded-md shadow-lg border border-slate-200 transition-all duration-200 ${
              isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
            }`}
            >
              <div className="py-1 max-h-[70vh] overflow-y-auto overscroll-contain pr-1">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`block px-4 py-2 text-sm text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors ${
                      isActive(item.href) ? 'text-blue-600 bg-blue-50' : ''
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}

                {/* Demos parent with right-side popout */}
                <div
                  className={`relative px-4 py-2 text-sm text-slate-700 hover:text-blue-600 hover:bg-slate-50 cursor-pointer`}
                  onMouseEnter={() => setIsDemosOpen(true)}
                  onMouseLeave={() => setIsDemosOpen(false)}
                >
                  Demos ▸
                  <div
                    className={`absolute top-0 right-full mr-1 w-96 bg-white rounded-md shadow-lg border border-slate-200 transition-all duration-200 z-10 ${
                      isDemosOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                    } max-h-[70vh] overflow-y-auto overscroll-contain`}
                    onMouseEnter={() => setIsDemosOpen(true)}
                    onMouseLeave={() => setIsDemosOpen(false)}
                  >
                    <div className="py-2">
                      {demoItems.map((d) => (
                        <Link
                          key={d.name}
                          to={d.href}
                          className={`block px-4 py-2 text-sm text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors ${
                            isActive(d.href) ? 'text-blue-600 bg-blue-50' : ''
                          }`}
                          onClick={() => { setIsOpen(false); setIsDemosOpen(false); }}
                        >
                          {d.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`inline-flex items-center justify-center p-2 rounded-md transition-colors text-white hover:text-blue-300`}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Only for mobile devices */}
      <div className={`md:hidden transition-all duration-300 ${
        isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
      } overflow-hidden`}>
        <div className="bg-white shadow-lg border-t border-slate-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                  isActive(item.href)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;