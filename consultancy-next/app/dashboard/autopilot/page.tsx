'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Zap, Play, CheckCircle2, Clock, AlertCircle, Mail, Code2, Search, PenTool, Layers, Loader2, X } from 'lucide-react';
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase';
import { checkTierAccess } from '@/constants/tiers';
import { logAuditAction } from '@/lib/audit';
import { authFetch } from '@/lib/auth-fetch';

type StepId = 'probe' | 'research' | 'schema' | 'write' | 'publish';
type ActiveStep = StepId | 'done' | null;

interface LoopRun {
  id: string;
  keyword: string;
  status: 'probing' | 'researching' | 'schema' | 'writing' | 'publishing' | 'complete' | 'failed';
  geoScore?: number;
  emailed?: boolean;
  createdAt: string;
  completedAt?: string;
}

const STEPS: { id: StepId; Icon: any; label: string; desc: string }[] = [
  { id: 'probe',    Icon: Zap,     label: 'Probe',    desc: 'Citation audit'         },
  { id: 'research', Icon: Search,   label: 'Research', desc: 'Crawl & extract facts'  },
  { id: 'schema',   Icon: Code2,    label: 'Schema',   desc: 'Generate JSON-LD'       },
  { id: 'write',    Icon: PenTool,  label: 'Write',    desc: 'Synthesize GEO article' },
  { id: 'publish',  Icon: Mail,     label: 'Deliver',  desc: 'Save & email'           },
];

export default function AutopilotPage() {
  const { user, userData, tier } = useAuth();
  const [topic, setTopic] = useState('');
  const [activeStep, setActiveStep] = useState<ActiveStep>(null);
  const [runs, setRuns] = useState<LoopRun[]>([]);
  const [latestResult, setLatestResult] = useState<{ keyword: string; geoScore: number; emailed: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [bulkItems, setBulkItems] = useState<{ keyword: string; status: 'pending' | 'running' | 'done' | 'error' }[]>([]);
  const [isBulkRunning, setIsBulkRunning] = useState(false);
  const [isSingleRunning, setIsSingleRunning] = useState(false);

  const isAdmin = user?.email === 'hopiumcalculator@gmail.com' || user?.email === 'sales@auspexi.com';
  const hasAccess = isAdmin || checkTierAccess(tier, 'Pro');
  const keywords = (userData?.keywords || []).filter(Boolean);
  const isRunning = isSingleRunning || isBulkRunning;

  useEffect(() => {
    if (keywords.length > 0 && selectedKeywords.length === 0) setSelectedKeywords(keywords);
  }, [userData]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'autopilot_runs'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    return onSnapshot(q, snap => {
      setRuns(snap.docs.map(d => ({ id: d.id, ...d.data() } as LoopRun)));
    });
  }, [user]);

  // Core pipeline — throws on hard failure, returns results on success
  const runPipeline = async (kw: string): Promise<{ article: string; facts: string; schema: string; geoScore: number; emailed: boolean }> => {
    // Step 1: Probe (best-effort — never blocks the pipeline)
    setActiveStep('probe');
    try {
      await authFetch('/api/geo-pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: kw, userId: user!.uid, brand: userData?.brand || '', domain: userData?.domain || '' }),
      });
    } catch { /* non-blocking */ }

    // Step 2: Research — crawl then extract facts
    setActiveStep('research');
    const crawlRes = await authFetch('/api/agent/crawl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: kw, userId: user!.uid }),
    });
    const crawlData = await crawlRes.json();
    if (!crawlData.success) throw new Error(crawlData.error || 'Crawl failed');

    const extractRes = await authFetch('/api/agent/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: kw, crawlerData: crawlData.result, userId: user!.uid }),
    });
    const extractData = await extractRes.json();
    if (!extractData.success) throw new Error(extractData.error || 'Extract failed');
    const facts: string = extractData.result || '';

    await new Promise(r => setTimeout(r, 5000));

    // Step 3: Schema
    setActiveStep('schema');
    const schemaRes = await authFetch('/api/agent/schema', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facts, userId: user!.uid }),
    });
    const schemaData = await schemaRes.json();
    if (!schemaData.success) throw new Error(schemaData.error || 'Schema failed');
    const schema: string = schemaData.result || '{}';

    await new Promise(r => setTimeout(r, 5000));

    // Step 4: Write article
    setActiveStep('write');
    const synthRes = await authFetch('/api/agent/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: kw, facts, brandName: userData?.brand || '', userId: user!.uid }),
    });
    const synthData = await synthRes.json();
    if (!synthData.success) throw new Error(synthData.error || 'Synthesis failed');
    const article: string = synthData.result || '';

    // GEO score — best-effort, doesn't block delivery
    let geoScore = 0;
    try {
      const scoreRes = await authFetch('/api/content-scorer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: article, contentType: 'blog', userId: user!.uid }),
      });
      const scoreData = await scoreRes.json();
      geoScore = scoreData.result?.overallScore ?? 0;
    } catch { /* non-blocking */ }

    // Step 5: Save + email + CMS webhook delivery (S4.7)
    setActiveStep('publish');
    const payload = {
      userId: user!.uid, topic: kw, article, facts, schema,
      brand: userData?.brand || '', geoScore,
      timestamp: new Date().toISOString(), source: 'autopilot',
    };

    const articleRef = await addDoc(collection(db, 'articles'), payload);

    let emailed = false;
    try {
      const emailRes = await authFetch('/api/notify-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const emailData = await emailRes.json();
      emailed = Boolean(emailData.success && emailData.emailed);
    } catch { /* non-blocking */ }

    // CMS webhook delivery with status logging (S4.7)
    if (userData?.cmsWebhookUrl && !userData.cmsWebhookUrl.includes('/api/notify-article')) {
      let webhookStatus: 'delivered' | 'failed' = 'failed';
      let webhookHttpStatus: number | null = null;
      let webhookAttempts = 0;
      const MAX_ATTEMPTS = 3;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        webhookAttempts = attempt;
        try {
          const wRes = await fetch(userData.cmsWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          webhookHttpStatus = wRes.status;
          if (wRes.ok) { webhookStatus = 'delivered'; break; }
          if (attempt < MAX_ATTEMPTS) await new Promise(r => setTimeout(r, attempt * 2000));
        } catch {
          if (attempt < MAX_ATTEMPTS) await new Promise(r => setTimeout(r, attempt * 2000));
        }
      }
      // Persist delivery result so the user has a real audit trail (S4.7)
      updateDoc(doc(db, 'articles', articleRef.id), {
        webhookStatus, webhookHttpStatus, webhookAttempts,
        webhookDeliveredAt: webhookStatus === 'delivered' ? new Date().toISOString() : null,
      }).catch(() => {});
    }

    return { article, facts, schema, geoScore, emailed };
  };

  const runSingleLoop = async () => {
    if (!user || !userData?.brand || !topic.trim()) return;
    setIsSingleRunning(true);
    setError(null);
    setLatestResult(null);
    const kw = topic.trim();

    const runRef = await addDoc(collection(db, 'autopilot_runs'), {
      userId: user.uid, keyword: kw, status: 'probing', createdAt: new Date().toISOString(),
    });

    try {
      const result = await runPipeline(kw);
      setActiveStep('done');
      await updateDoc(doc(db, 'autopilot_runs', runRef.id), {
        status: 'complete', geoScore: result.geoScore, emailed: result.emailed,
        completedAt: new Date().toISOString(),
      });
      setLatestResult({ keyword: kw, geoScore: result.geoScore, emailed: result.emailed });
      await logAuditAction(user.uid, 'Autopilot Run Complete', { keyword: kw, geoScore: result.geoScore, emailed: result.emailed });
    } catch (err: any) {
      setError(err.message || 'Run failed');
      await updateDoc(doc(db, 'autopilot_runs', runRef.id), { status: 'failed' });
    } finally {
      setIsSingleRunning(false);
      setTimeout(() => setActiveStep(null), 3000);
    }
  };

  const runAllKeywords = async () => {
    if (!user || !userData?.brand || selectedKeywords.length === 0) return;
    setIsBulkRunning(true);
    setError(null);
    setBulkItems(selectedKeywords.map(k => ({ keyword: k, status: 'pending' })));

    for (let i = 0; i < selectedKeywords.length; i++) {
      const kw = selectedKeywords[i];
      setBulkItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'running' } : it));

      const runRef = await addDoc(collection(db, 'autopilot_runs'), {
        userId: user.uid, keyword: kw, status: 'probing', createdAt: new Date().toISOString(),
      });

      try {
        const result = await runPipeline(kw);
        setActiveStep('done');
        await updateDoc(doc(db, 'autopilot_runs', runRef.id), {
          status: 'complete', geoScore: result.geoScore, emailed: result.emailed,
          completedAt: new Date().toISOString(),
        });
        await logAuditAction(user.uid, 'Bulk Autopilot Run Complete', { keyword: kw, geoScore: result.geoScore });
        setBulkItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'done' } : it));
      } catch (err: any) {
        await updateDoc(doc(db, 'autopilot_runs', runRef.id), { status: 'failed' });
        setBulkItems(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'error' } : it));
      }

      if (i < selectedKeywords.length - 1) await new Promise(r => setTimeout(r, 4000));
    }

    setIsBulkRunning(false);
    setTimeout(() => setActiveStep(null), 3000);
  };

  const toggleKeyword = (kw: string) =>
    setSelectedKeywords(prev => prev.includes(kw) ? prev.filter(k => k !== kw) : [...prev, kw]);

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium">GEO Autopilot requires Pro tier</p>
          <p className="text-zinc-600 text-sm mt-1">The full probe-research-schema-write-email loop is our most powerful execution feature.</p>
        </div>
      </div>
    );
  }

  const activeStepIndex = activeStep === 'done' ? STEPS.length : activeStep ? STEPS.findIndex(s => s.id === activeStep) : -1;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">GEO Autopilot</h1>
        <p className="text-zinc-400 max-w-2xl">
          Full pipeline in one click: probe → crawl → extract → JSON-LD schema → GEO article → email. Run your entire keyword list or a one-off topic.
        </p>
      </div>

      {/* Pipeline visualiser */}
      <div className="relative">
        <div className="absolute top-8 left-[2.25rem] right-[2.25rem] h-px bg-zinc-800 hidden md:block">
          <div
            className="h-full bg-pink-500 transition-all duration-700"
            style={{ width: activeStepIndex >= 0 ? `${(activeStepIndex / (STEPS.length - 1)) * 100}%` : '0%' }}
          />
        </div>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 relative z-10">
          {STEPS.map(({ id, Icon, label, desc }, i) => {
            const active = activeStep === id;
            const done = activeStepIndex > i;
            return (
              <div key={id} className={`flex flex-col items-center text-center p-3 rounded-2xl border transition-all duration-500 ${
                active ? 'border-pink-500/40 bg-pink-500/5' :
                done  ? 'border-emerald-500/20 bg-emerald-500/5' :
                        'border-zinc-800 bg-zinc-900/40'
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-all ${
                  active ? 'bg-pink-500/20 ring-2 ring-pink-500/40' :
                  done  ? 'bg-emerald-500/20' : 'bg-zinc-800'
                }`}>
                  {done   ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> :
                   active ? <Loader2 className="w-5 h-5 text-pink-400 animate-spin" /> :
                            <Icon className="w-5 h-5 text-zinc-500" />}
                </div>
                <p className={`text-xs font-bold mb-0.5 ${active ? 'text-pink-400' : done ? 'text-emerald-400' : 'text-zinc-400'}`}>{label}</p>
                <p className="text-[9px] text-zinc-600 leading-tight hidden sm:block">{desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bulk — keywords from Settings */}
      {keywords.length > 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" /> Run All Keywords
                </CardTitle>
                <CardDescription className="text-zinc-400 mt-1">
                  Toggle which keywords to include. Each runs the full 5-step pipeline and emails the article + JSON-LD schema to you.
                </CardDescription>
              </div>
              <Button
                onClick={runAllKeywords}
                disabled={isRunning || selectedKeywords.length === 0 || !userData?.brand}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shrink-0"
              >
                {isBulkRunning
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Running…</>
                  : <><Play className="w-4 h-4 mr-2 fill-current" />Run {selectedKeywords.length}</>}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {keywords.map(kw => {
                const item = bulkItems.find(it => it.keyword === kw);
                const sel = selectedKeywords.includes(kw);
                return (
                  <button
                    key={kw}
                    onClick={() => !isRunning && toggleKeyword(kw)}
                    disabled={isRunning}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      item?.status === 'done'    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                      item?.status === 'running' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse' :
                      item?.status === 'error'   ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                      sel ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' :
                            'bg-zinc-800 border-zinc-700 text-zinc-500'
                    }`}
                  >
                    {item?.status === 'done' && '✓ '}
                    {item?.status === 'running' && '⟳ '}
                    {item?.status === 'error' && '✗ '}
                    {kw}
                  </button>
                );
              })}
            </div>
            {isBulkRunning && (
              <p className="text-xs text-zinc-500">
                Processing {selectedKeywords.length} keywords in sequence — keep this tab open. Each article is emailed to <span className="text-zinc-300">{user?.email}</span> as it completes.
              </p>
            )}
            {!userData?.brand && (
              <p className="text-xs text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />Set your brand name in Settings first.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
            <p className="text-sm text-zinc-300 font-medium mb-1">No keywords configured</p>
            <p className="text-xs text-zinc-500">
              Add target keywords in <a href="/dashboard/settings" className="text-pink-400 underline">Settings</a> to enable Run All mode.
            </p>
          </CardContent>
        </Card>
      )}

      {/* One-off topic */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">One-off Topic</CardTitle>
          <CardDescription className="text-zinc-400">Run the full pipeline for a single topic not in your keyword list.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !isRunning && runSingleLoop()}
              placeholder={`e.g. best GEO platform for ${userData?.brand || 'B2B SaaS'}`}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/40 focus:border-pink-500"
            />
            <Button
              onClick={runSingleLoop}
              disabled={isRunning || !topic.trim() || !userData?.brand}
              className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white px-6 shrink-0"
            >
              {isSingleRunning ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Running</> : <><Play className="w-4 h-4 mr-2" />Run</>}
            </Button>
          </div>
          {!userData?.brand && (
            <p className="text-xs text-amber-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />Set your brand name in Settings first.
            </p>
          )}
          {error && (
            <p className="text-xs text-rose-400 flex items-center gap-1.5">
              <X className="w-3.5 h-3.5" />{error}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Latest single-run result */}
      {latestResult && (
        <Card className="bg-zinc-900 border-emerald-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Run Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              ['Topic',     latestResult.keyword],
              ['GEO Score', `${latestResult.geoScore}/100`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center gap-4 text-sm">
                <span className="text-zinc-400 w-20">{label}</span>
                <span className={`font-medium ${label === 'GEO Score' ? (latestResult.geoScore >= 80 ? 'text-emerald-400' : latestResult.geoScore >= 60 ? 'text-amber-400' : 'text-rose-400') : 'text-white'}`}>{value}</span>
              </div>
            ))}
            <div className="flex items-center gap-4 text-sm">
              <span className="text-zinc-400 w-20">Delivery</span>
              {latestResult.emailed ? (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />Emailed to {user?.email}
                </span>
              ) : (
                <span className="text-amber-400 text-xs">
                  Saved — email skipped (set EMAIL_USER + EMAIL_APP_PASSWORD in Netlify env vars)
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Run history */}
      {runs.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400" /> History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {runs.map(run => (
                <div key={run.id} className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-xs font-bold shrink-0 ${
                      run.status === 'complete' ? 'text-emerald-400' :
                      run.status === 'failed'   ? 'text-rose-400' : 'text-amber-400'
                    }`}>{run.status === 'complete' ? '✓' : run.status === 'failed' ? '✗' : '⟳'}</span>
                    <span className="text-zinc-400 text-xs truncate">"{run.keyword}"</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    {!!run.geoScore && <span className="text-xs text-zinc-500">GEO {run.geoScore}</span>}
                    {run.emailed && <Mail className="w-3 h-3 text-emerald-500" />}
                    <span className="text-xs text-zinc-700">{new Date(run.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
