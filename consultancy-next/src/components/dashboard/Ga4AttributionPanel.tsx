'use client';

import { useEffect, useState, useCallback } from 'react';
import { authFetch } from '@/lib/auth-fetch';
import { BarChart3, Loader2, Link2, RefreshCw, ExternalLink } from 'lucide-react';

interface Property { propertyId: string; displayName: string; account: string }
interface EngineRow { key: string; label: string; sessions: number; keyEvents: number }
interface Report {
  totalSessions: number; totalKeyEvents: number;
  byEngine: EngineRow[]; byDate: { date: string; sessions: number }[]; rangeDays: number;
}
interface Status {
  configured: boolean; connected: boolean;
  propertyId?: string | null; properties?: Property[];
}

export function Ga4AttributionPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [needsReconnect, setNeedsReconnect] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const r = await authFetch('/api/integrations/ga4/status');
      const d = await r.json();
      setStatus(d);
      return d as Status;
    } catch { setStatus({ configured: false, connected: false }); return null; }
  }, []);

  const loadReport = useCallback(async () => {
    const r = await authFetch('/api/integrations/ga4/attribution?days=30');
    const d = await r.json();
    if (d.needsReconnect) setNeedsReconnect(true);
    if (d.report) setReport(d.report);
  }, []);

  useEffect(() => {
    (async () => {
      const s = await loadStatus();
      if (s?.connected && s.propertyId) await loadReport().catch(() => {});
      setLoading(false);
    })();
  }, [loadStatus, loadReport]);

  const connect = async () => {
    setBusy(true);
    try {
      const r = await authFetch('/api/integrations/ga4/connect', { method: 'POST' });
      const d = await r.json();
      if (d.url) window.location.href = d.url;
      else setBusy(false);
    } catch { setBusy(false); }
  };

  const selectProperty = async (propertyId: string) => {
    setBusy(true);
    await authFetch('/api/integrations/ga4/status', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId }),
    });
    await loadStatus();
    await loadReport().catch(() => {});
    setBusy(false);
  };

  const disconnect = async () => {
    setBusy(true);
    await authFetch('/api/integrations/ga4/status', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disconnect: true }),
    });
    setReport(null); setNeedsReconnect(false);
    await loadStatus();
    setBusy(false);
  };

  if (loading) return null;
  if (!status?.configured) return null; // GA4 not set up on the server — hide entirely

  const Header = (
    <div className="flex items-center gap-2 mb-1">
      <BarChart3 className="w-5 h-5 text-pink-400" />
      <h3 className="text-base font-semibold text-white">AI Referral Attribution</h3>
    </div>
  );

  // Not connected
  if (!status.connected) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        {Header}
        <p className="text-sm text-zinc-400 mb-4">Connect Google Analytics to see how much traffic and how many conversions AI engines actually send you.</p>
        <button onClick={connect} disabled={busy}
          className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
          Connect Google Analytics
        </button>
      </div>
    );
  }

  // Connected — needs property selection
  if (!status.propertyId) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        {Header}
        <p className="text-sm text-zinc-400 mb-3">Choose which GA4 property to attribute.</p>
        <select disabled={busy} onChange={e => e.target.value && selectProperty(e.target.value)}
          className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500/40">
          <option value="">Select a property…</option>
          {(status.properties || []).map(p => (
            <option key={p.propertyId} value={p.propertyId}>{p.displayName} ({p.account})</option>
          ))}
        </select>
      </div>
    );
  }

  // Connected + property selected
  const maxEngine = report?.byEngine[0]?.sessions || 1;
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        {Header}
        <button onClick={disconnect} disabled={busy} className="text-[11px] text-zinc-500 hover:text-zinc-300 shrink-0">Disconnect</button>
      </div>

      {needsReconnect && (
        <div className="mb-4 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 flex items-center justify-between gap-3">
          <span>Google access expired. Reconnect to refresh attribution.</span>
          <button onClick={connect} className="inline-flex items-center gap-1.5 text-amber-300 hover:text-amber-200"><RefreshCw className="w-3.5 h-3.5" /> Reconnect</button>
        </div>
      )}

      {!report && !needsReconnect && (
        <div className="flex items-center gap-2 text-sm text-zinc-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading attribution…</div>
      )}

      {report && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">AI-referred sessions</p>
              <p className="text-3xl font-black text-white">{report.totalSessions.toLocaleString()}</p>
              <p className="text-[11px] text-zinc-600 mt-1">last {report.rangeDays} days</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Key events (conversions)</p>
              <p className="text-3xl font-black text-emerald-400">{report.totalKeyEvents.toLocaleString()}</p>
              <p className="text-[11px] text-zinc-600 mt-1">from AI referrals</p>
            </div>
          </div>

          {report.byEngine.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-1">By engine</p>
              {report.byEngine.map(e => (
                <div key={e.key} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 text-zinc-300">{e.label}</span>
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-pink-500 rounded-full" style={{ width: `${Math.round((e.sessions / maxEngine) * 100)}%` }} />
                  </div>
                  <span className="w-28 text-right text-zinc-400 text-xs">{e.sessions.toLocaleString()} sess · {e.keyEvents} conv</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No AI-referral traffic detected in this window yet. Many AI engines don&apos;t pass a referrer, so this undercounts (treat it as a floor, not the full picture).</p>
          )}

          <p className="text-[11px] text-zinc-600 mt-4 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> Source: your Google Analytics 4 property · referral sessions from known AI engine domains
          </p>
        </>
      )}
    </div>
  );
}
