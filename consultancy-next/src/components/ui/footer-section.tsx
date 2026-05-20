import Link from 'next/link';

export function Footerdemo() {
  return (
    <footer id="footer-section" className="bg-zinc-950 border-t border-zinc-900 py-16 text-zinc-400">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-heading text-xl font-bold text-white tracking-widest">AUSPEXI</span>
          </div>
          <p className="text-sm">The leading Generative Engine Optimization (GEO) platform.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm font-heading">Solutions</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-white transition-colors">Platform Overview</Link></li>
            <li><Link href="/roadmap" className="hover:text-white transition-colors">Our Master Plan</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm font-heading">Resources</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/blog" className="hover:text-white transition-colors">Insights Blog</Link></li>
            <li><Link href="/resources" className="hover:text-white transition-colors">Downloads & Playbooks</Link></li>
            <li><Link href="/faq" className="hover:text-white transition-colors">Frequently Asked Questions</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm font-heading">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-white transition-colors">About Our Team</Link></li>
            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy & Cookies</Link></li>
            <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-zinc-900/60 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono">
        <div>&copy; {new Date().getFullYear()} Auspexi. All rights reserved.</div>
        <div>Deterministic Reputation Architecture</div>
      </div>
    </footer>
  );
}
