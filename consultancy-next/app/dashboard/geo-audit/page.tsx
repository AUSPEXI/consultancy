'use client';

// Full GEO Audit — the one-click "aha" run. Fires the three core diagnostics
// (Citation Probe, Bing indexation, entity grounding) against the user's brand
// and composes a single readiness report. Reuses the existing API routes so all
// metering, cost auditing, and Firestore persistence happen exactly as if each
// tool were run individually.

import { useState } from 'react';
import { Zap, Search, Shield, Loader2, CheckCircle2, XCircle, AlertTriangle, ArrowRight, Rocket } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { authFetch } from '@/lib/auth-fetch';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';

type StepState = 'pending' | 'running' | 'done' | 'error';

interface StepStatus { probe: StepState; bing: StepState; entity: StepState }

export default function GeoAuditPage() {
  const { user, userData } = useAuth();

  const [brand, setBrand] = useState(userData?.brand || '');
  const [domain, setDomain] = useState(userData?.domain || '');
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<StepStatus>({ probe: 'pending', bing: 'pending', entity: 'pending' });
  const [probe, setProbe] = useState<any>(null);
  const [bing, setBing] = useState<any>(null);
  const [entity, setEntity] = useState<any>(null);
  const [error, setError] = useState('');
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);

  const autopilotAlreadyOn = userData?.automation?.enabled === true;

  // One-click set-and-forget: persist brand/domain and switch on the weekly
  // automation cron with the email digest, so the audit the user just ran
  // keeps repeating without them ever visiting Settings.
  const activateAutopilot = async () => {
    if (!user || activating) return;
    setActivating(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        brand,
        domain,
        'automation.enabled': true,
        'automation.emailDigest': true,
        'automation.tools': { 'brand-monitor': true, 'cite-probe': true, 'daily-audit': true, 'indexnow-sync': true },
      }, { merge: true });
      setActivated(true);
    } catch (e: any) {
      setError(e?.message || 'Could not activate Autopilot');
    } finally {
      setActivating(false);
    }
  };

  const setStep = (k: keyof StepStatus, v: StepState) => setSteps(s => ({ ...s, [k]: v }));

  const runAudit = async () => {
    if (!brand || !domain || running) return;
    setRunning(true);
    setError('');
    setProbe(null); setBing(null); setEntity(null);
    setSteps({ probe: 'running', bing: 'running', entity: 'running' });

    const keywords: string[] = userData?.keywords || [];

    // The three diagnostics are independent — run them concurrently.
    const probeP = authFetch('/api/cite-probe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand, domain, keywords }),
    }).then(async r => {
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.message || d.error || 'Citation probe failed');
      setProbe(d); setStep('probe', 'done');
    }).catch(e => { setStep('probe', 'error'); setError(prev => prev || e.message); });

    const bingP = authFetch(`/api/bing-index?domain=${encodeURIComponent(domain)}`)
      .then(async r => {
        const d = await r.json();
        if (!d.success) throw new Error(d.error || 'Bing check failed');
        setBing(d); setStep('bing', 'done');
      }).catch(e => { setStep('bing', 'error'); setError(prev => prev || e.message); });

    const entityP = authFetch('/api/entity-audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand, domain }),
    }).then(async r => {
      const d = await r.json();
      if (!d.success) throw new Error(d.error || 'Entity audit failed');
      setEntity(d); setStep('entity', 'done');
    }).catch(e => { setStep('entity', 'error'); setError(prev => prev || e.message); });

    await Promise.allSettled([probeP, bingP, entityP]);
    setRunning(false);
  };

  // Composite readiness: citation rate (50%), Bing indexed (20%), entity score (30%).
  // Only computed from the parts that succeeded.
  const readiness = (() => {
    const parts: { weight: number; value: number }[] = [];
    if (probe) parts.push({ weight: 0.5, value: probe.citationRate ?? 0 });
    if (bing) parts.push({ weight: 0.2, value: bing.indexed ? 100 : 0 });
    if (entity) parts.push({ weight: 0.3, value: entity.score ?? 0 });
    if (parts.length === 0) return null;
    const totalW = parts.reduce((a, p) => a + p.weight, 0);
    return Math.round(parts.reduce((a, p) => a + p.value * p.weight, 0) / totalW);
  })();

  const StepRow = ({ k, icon: Icon, label }: { k: keyof StepStatus; icon: any; label: string }) => (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="w-4 h-4 text-zinc-500" />
      <span className="text-zinc-300 flex-1">{label}</span>
      {steps[k] === 'pending' && <span className="text-xs text-zinc-600">waiting</span>}
      {steps[k] === 'running' && <Loader2 className="w-4 h-4 animate-spin text-pink-400" />}
      {steps[k] === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
      {steps[k] === 'error' && <XCircle className="w-4 h-4 text-pink-400" />}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Full GEO Audit</h1>
        <p className="text-sm text-zinc-400 mt-1">
          One run, three diagnostics: how often AI engines cite you, whether Bing (ChatGPT&apos;s search index)
          can see you, and whether the knowledge sources AI relies on know you exist.
        </p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Brand name"
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500/40" />
          <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="yourdomain.com"
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500/40" />
        </div>

        <button onClick={runAudit} disabled={running || !brand || !domain}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors">
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {running ? 'Auditing…' : 'Run Full GEO Audit'}
        </button>

        {(running || probe || bing || entity) && (
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <StepRow k="probe" icon={Zap} label="Citation Probe — live queries across AI engines" />
            <StepRow k="bing" icon={Search} label="Bing indexation — ChatGPT's search index" />
            <StepRow k="entity" icon={Shield} label="Entity grounding — Wikidata, Wikipedia, Crunchbase" />
          </div>
        )}

        {error && <p className="text-sm text-pink-400">{error}</p>}
      </div>

      {readiness !== null && !running && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">GEO Readiness</p>
              <p className={`text-6xl font-black ${readiness >= 60 ? 'text-emerald-400' : readiness >= 30 ? 'text-amber-400' : 'text-pink-400'}`}>{readiness}</p>
              <p className="text-[11px] text-zinc-600 mt-1">citation 50% · Bing 20% · entity 30%</p>
            </div>
            <div className="flex-1 space-y-3 text-sm">
              {probe && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">AI citation rate</span>
                  <span className="text-white font-bold">
                    {probe.citationRate}%
                    {probe.ci95 && <span className="text-zinc-600 font-normal text-xs ml-1.5">(95% CI {probe.ci95[0]}–{probe.ci95[1]}%)</span>}
                  </span>
                </div>
              )}
              {bing && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Bing indexation</span>
                  <span className={`font-bold ${bing.indexed ? 'text-emerald-400' : 'text-pink-400'}`}>
                    {bing.indexed ? `Indexed${bing.estimatedPages ? ` (~${bing.estimatedPages.toLocaleString()} pages)` : ''}` : 'Not indexed'}
                  </span>
                </div>
              )}
              {entity && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Entity grounding score</span>
                  <span className="text-white font-bold">{entity.score}/100</span>
                </div>
              )}
            </div>
          </div>

          {/* Prioritised next actions, drawn from whichever diagnostic scored worst */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Do these first</p>
            {bing && !bing.indexed && (
              <ActionRow text="Your domain is invisible to ChatGPT search. Fix Bing indexation first — it gates everything else." href="/dashboard/geo-health" cta="GEO Health" />
            )}
            {entity && entity.score < 60 && (
              <ActionRow text={`Entity grounding is weak (${entity.score}/100). AI can't confidently say who you are.`} href="/dashboard/geo-health" cta="Entity Audit" />
            )}
            {probe && probe.citationRate === 0 && (
              <ActionRow text="No AI engine cited you on any test query. Start publishing grounded, citable content." href="/dashboard/agents" cta="Content Pipeline" />
            )}
            {probe && probe.citationRate > 0 && probe.citationRate < 50 && (
              <ActionRow text="You're being cited sometimes. See exactly which queries and engines miss you, then target those." href="/dashboard/cite-probe" cta="Citation Probe" />
            )}
            {(probe?.misinformationCount ?? 0) > 0 && (
              <ActionRow text={`${probe.misinformationCount} misinformation citation(s) detected — AI is saying false things about your brand.`} href="/dashboard/cite-probe" cta="Review" />
            )}
            {bing?.indexed && (entity?.score ?? 0) >= 60 && (probe?.citationRate ?? 0) >= 50 && (
              <p className="text-sm text-emerald-300 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Strong foundations across all three checks. Defend the position: keep facts fresh and re-probe monthly.</p>
            )}
          </div>

          {/* Set-and-forget: the natural next step after a first audit */}
          {!autopilotAlreadyOn && !activated && (
            <div className="flex items-center justify-between gap-4 bg-pink-500/5 border border-pink-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Rocket className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white">Keep this running automatically</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Turn on Autopilot: weekly citation tracking on these exact queries, brand monitoring,
                    and an email digest when anything changes. One click — adjust anytime in Settings.
                  </p>
                </div>
              </div>
              <button onClick={activateAutopilot} disabled={activating}
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors">
                {activating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                Activate Autopilot
              </button>
            </div>
          )}
          {(autopilotAlreadyOn || activated) && (
            <p className="text-sm text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Autopilot is on — this audit repeats automatically and you&apos;ll get an email digest when things change.
              <Link href="/dashboard/settings" className="text-pink-400 hover:text-pink-300 font-bold">Adjust</Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ActionRow({ text, href, cta }: { text: string; href: string; cta: string }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-zinc-950 border border-zinc-800 rounded-lg p-3">
      <div className="flex items-start gap-2.5 text-sm text-zinc-300">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <span>{text}</span>
      </div>
      <Link href={href} className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-pink-400 hover:text-pink-300">
        {cta} <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
