'use client'

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export function PublicHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    if (pathname === '/') {
      e.preventDefault();
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="font-heading text-xl font-bold tracking-widest text-white" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          AUSPEXI
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <Link href="/#features" onClick={(e) => handleNavClick(e, '#features')} className="hover:text-white transition-colors">Features</Link>
          <Link href="/#pricing" onClick={(e) => handleNavClick(e, '#pricing')} className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="hidden md:inline-flex px-5 py-2 rounded-full border border-zinc-700 text-sm font-semibold text-white bg-zinc-900 hover:bg-zinc-800 transition-all"
          >
            Dashboard
          </Link>
          <button
            className="md:hidden p-2 text-zinc-400 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-zinc-800/50 bg-zinc-950/95 backdrop-blur-md px-6 py-4 flex flex-col gap-4 text-sm font-medium text-zinc-300">
          <Link href="/#features" onClick={(e) => { handleNavClick(e, '#features'); setIsMenuOpen(false); }} className="hover:text-white transition-colors">Features</Link>
          <Link href="/#pricing" onClick={(e) => { handleNavClick(e, '#pricing'); setIsMenuOpen(false); }} className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/about" onClick={() => setIsMenuOpen(false)} className="hover:text-white transition-colors">About</Link>
          <Link href="/blog" onClick={() => setIsMenuOpen(false)} className="hover:text-white transition-colors">Blog</Link>
          <Link href="/faq" onClick={() => setIsMenuOpen(false)} className="hover:text-white transition-colors">FAQ</Link>
          <Link href="/dashboard" onClick={() => setIsMenuOpen(false)} className="text-white font-semibold">Dashboard</Link>
        </div>
      )}
    </nav>
  );
}
