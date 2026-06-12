'use client';

import { useState } from 'react';

export default function LeadCaptureForm() {
  const [email, setEmail] = useState('');
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!email || !domain) return;
    setLoading(true);
    try {
      await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, domain }),
      });
      setDone(true);
    } catch {
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center py-4">
        <p className="text-green-400 font-semibold text-lg">
          Report is on its way. Check your inbox.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
      <input
        type="email"
        placeholder="Work email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 h-12 px-4 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-zinc-500 focus:outline-none focus:border-pink-500/50 text-sm"
      />
      <input
        type="text"
        placeholder="Company domain (e.g. acme.com)"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        className="flex-1 h-12 px-4 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-zinc-500 focus:outline-none focus:border-pink-500/50 text-sm"
      />
      <button
        onClick={handleSubmit}
        disabled={loading || !email || !domain}
        className="h-12 px-6 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-semibold text-sm transition disabled:opacity-40 whitespace-nowrap"
      >
        {loading ? 'Generating…' : 'Get Free GEO Report'}
      </button>
    </div>
  );
}
