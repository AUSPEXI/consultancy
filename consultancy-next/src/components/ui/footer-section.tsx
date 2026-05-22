'use client'

import Link from 'next/link';
import { Send, Instagram, Youtube, MessageSquare } from 'lucide-react';
import { useState } from 'react';

const XIcon = ({ className }: { className?: string }) => (
  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" className={className}>
    <title>X</title>
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

const TiktokIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export function Footerdemo() {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setEmail('');
  };

  return (
    <footer className="relative border-t bg-zinc-950 text-zinc-400 border-zinc-800 overflow-hidden">
      <div className="container mx-auto px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">

          {/* Brand + Newsletter */}
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <img src="/auspexi-logo.png" alt="Auspexi" className="w-8 h-8 object-contain" />
              <span className="font-heading text-xl font-bold text-white tracking-widest">AUSPEXI</span>
            </div>
            <p className="mb-6 text-sm text-zinc-400">Master Brand Visibility in the Era of AI Search.</p>
            <form className="relative" onSubmit={handleSubscribe}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full pr-12 pl-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-pink-500/50"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 h-8 w-8 rounded-md bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-colors"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Subscribe</span>
              </button>
            </form>
            <div className="absolute -right-4 top-0 h-24 w-24 rounded-full bg-zinc-600/10 blur-2xl" />
          </div>

          {/* Platform */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white font-heading">Platform</h3>
            <nav className="space-y-2 text-sm">
              <Link href="/about" className="block transition-colors hover:text-white">About</Link>
              <Link href="/roadmap" className="block transition-colors hover:text-white">Roadmap</Link>
              <Link href="/investors" className="block transition-colors hover:text-white">Investors</Link>
              <Link href="/#features" className="block transition-colors hover:text-white">Features</Link>
              <Link href="/#pricing" className="block transition-colors hover:text-white">Pricing</Link>
              <a href="/#strategy" className="block transition-colors hover:text-white">GEO Strategy</a>
              <Link href="/voice-agents" className="block transition-colors hover:text-white">Voice Agents</Link>
              <Link href="/#testimonials" className="block transition-colors hover:text-white">Case Studies</Link>
            </nav>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white font-heading">Resources</h3>
            <nav className="space-y-2 text-sm">
              <Link href="/resources" className="block transition-colors hover:text-white">Resources</Link>
              <Link href="/blog" className="block transition-colors hover:text-white">Blog</Link>
              <Link href="/faq" className="block transition-colors hover:text-white">FAQ</Link>
              <a href="https://www.reddit.com/user/Gold-Charge-6536/" target="_blank" rel="noopener noreferrer" className="block transition-colors hover:text-white">Community (Reddit)</a>
            </nav>
          </div>

          {/* Social */}
          <div className="relative">
            <h3 className="mb-4 text-sm font-semibold text-white font-heading">Follow Us</h3>
            <div className="mb-6 flex flex-wrap gap-3">
              {[
                { href: 'https://x.com/Auspexi', label: 'X (formerly Twitter)', Icon: XIcon },
                { href: 'https://www.instagram.com/auspexidotcom/', label: 'Instagram', Icon: Instagram },
                { href: 'https://www.tiktok.com/@auspexi.com', label: 'TikTok', Icon: TiktokIcon },
                { href: 'https://www.youtube.com/channel/UCYcTIGhBKY_IIx5WcM68zdg', label: 'YouTube', Icon: Youtube },
                { href: 'https://www.reddit.com/user/Gold-Charge-6536/', label: 'Reddit', Icon: MessageSquare },
                { href: 'https://www.linkedin.com/company/auspexi', label: 'LinkedIn', Icon: LinkedinIcon },
              ].map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-10 h-10 rounded-full border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-700 flex items-center justify-center transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-zinc-800 pt-8 text-center md:flex-row">
          <p className="text-sm text-zinc-500">&copy; {new Date().getFullYear()} Auspexi. All rights reserved.</p>
          <nav className="flex gap-6 text-sm">
            <Link href="/privacy" className="transition-colors hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="transition-colors hover:text-white">Terms of Service</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
