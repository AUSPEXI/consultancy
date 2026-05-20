import Link from 'next/link';

export function PublicHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/70 backdrop-blur-md border-b border-zinc-900 h-20 flex items-center px-6">
      <div className="max-w-7xl w-full mx-auto flex justify-between items-center">
        <Link href="/" className="font-heading text-xl font-bold tracking-widest text-white">
          AUSPEXI
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/about" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">About</Link>
          <Link href="/blog" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Blog</Link>
          <Link href="/faq" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">FAQ</Link>
          <Link href="/resources" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Resources</Link>
          <Link href="/roadmap" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Roadmap</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="px-5 py-2 rounded-full border border-zinc-800 text-sm font-semibold text-white bg-zinc-950 hover:bg-zinc-900 transition-all font-sans">
            Dashboard
          </Link>
        </div>
      </div>
    </header>
  );
}
