'use client';

import { useEffect, useState } from 'react';

type Status = 'idle' | 'working' | 'done' | 'error';

export default function UnsubscribePage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  // Read ?email= from the URL on the client (avoids a Suspense boundary).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const e = params.get('email');
    if (e) setEmail(e);
  }, []);

  const submit = async () => {
    if (!email.trim()) return;
    setStatus('working');
    setError('');
    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Unsubscribe failed');
      setStatus('done');
    } catch (e: any) {
      setError(e.message);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8">
        <h1 className="text-2xl font-extrabold tracking-tight mb-2">
          L8<span style={{ color: '#ff1493' }}>EntSpace</span>
        </h1>

        {status === 'done' ? (
          <p className="text-zinc-300 leading-relaxed">
            You&apos;ve been unsubscribed{email ? ` (${email})` : ''}. You won&apos;t receive any further
            emails from the GEO report series. Thanks for taking a look.
          </p>
        ) : (
          <>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              Unsubscribe from the L8EntSpace GEO report emails. Enter your email to confirm.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/40 mb-4"
            />
            {error && <p className="text-rose-400 text-sm mb-4">{error}</p>}
            <button
              onClick={submit}
              disabled={status === 'working' || !email.trim()}
              className="w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
            >
              {status === 'working' ? 'Unsubscribing…' : 'Unsubscribe'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
