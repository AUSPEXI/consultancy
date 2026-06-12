'use client';

/**
 * Onboarding checklist — the QUEST, made actionable.
 *
 * Replaces the static "set up your brand" prompt with a live 5-step checklist.
 * Each step auto-checks from REAL data (no fabrication): brand configured,
 * first probe run, 10+ facts in the vault, an article scored, schema deployed.
 * Dismissal persists to the user's Firestore doc so it stays gone once the user
 * closes it (or it auto-hides when all five steps are complete).
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, X, Rocket, ArrowRight } from 'lucide-react';
import { db } from '@/firebase';
import { collection, query, where, getCountFromServer, doc, updateDoc, getDoc } from 'firebase/firestore';

interface Props {
  userId: string;
  brandConfigured: boolean;
  /** Whether the user has run at least one citation probe (page already knows this). */
  hasProbed: boolean;
}

interface Step {
  id: string;
  label: string;
  hint: string;
  href: string;
  done: boolean;
}

export function OnboardingChecklist({ userId, brandConfigured, hasProbed }: Props) {
  const [dismissed, setDismissed] = useState(true); // hidden until we've loaded state
  const [factCount, setFactCount] = useState(0);
  const [articleScored, setArticleScored] = useState(false);
  const [schemaDeployed, setSchemaDeployed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      try {
        const userSnap = await getDoc(doc(db, 'users', userId));
        const ud = userSnap.exists() ? userSnap.data() : {};
        if (ud?.onboardingDismissed) { if (!cancelled) { setDismissed(true); setLoaded(true); } return; }

        const [facts, articles] = await Promise.all([
          getCountFromServer(query(collection(db, 'facts'), where('userId', '==', userId))),
          getCountFromServer(query(collection(db, 'articles'), where('userId', '==', userId))),
        ]);

        if (cancelled) return;
        setFactCount(facts.data().count);
        setArticleScored(articles.data().count > 0);
        setSchemaDeployed(!!ud?.schemaDeployed);
        setDismissed(false);
        setLoaded(true);
      } catch {
        if (!cancelled) { setDismissed(true); setLoaded(true); }
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  const steps: Step[] = [
    { id: 'configure', label: 'Configure your brand', hint: 'Name, domain & keywords', href: '/dashboard/settings', done: brandConfigured },
    { id: 'probe', label: 'Run your first Citation Probe', hint: 'See your starting score', href: '/dashboard/cite-probe', done: hasProbed },
    { id: 'facts', label: 'Add 10 Cite-Magnet facts', hint: `${Math.min(factCount, 10)}/10 in your vault`, href: '/dashboard/fact-vault', done: factCount >= 10 },
    { id: 'score', label: 'Score an article', hint: 'Quality-check before publishing', href: '/dashboard/content-scorer', done: articleScored },
    { id: 'deploy', label: 'Deploy your schema', hint: 'Push facts live as JSON-LD', href: '/dashboard/schema-deploy', done: schemaDeployed },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;

  const dismiss = async () => {
    setDismissed(true);
    try { await updateDoc(doc(db, 'users', userId), { onboardingDismissed: true }); } catch { /* non-blocking */ }
  };

  if (!loaded || dismissed || allDone) return null;

  return (
    <div className="relative bg-gradient-to-br from-pink-950/30 to-zinc-900/40 border border-pink-900/40 rounded-xl p-6 animate-in fade-in slide-in-from-top-2 duration-500">
      <button
        onClick={dismiss}
        className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        aria-label="Dismiss checklist"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
          <Rocket className="w-5 h-5 text-pink-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">Get cited by AI in 5 steps</h3>
          <p className="text-xs text-zinc-400">{doneCount} of {steps.length} complete. Finish the quest to start showing up in AI answers.</p>
        </div>
      </div>

      <div className="h-1.5 bg-zinc-800 rounded-full mt-3 mb-5 overflow-hidden">
        <div className="h-full bg-pink-500 transition-all duration-500" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>

      <div className="space-y-2">
        {steps.map((s) => (
          <Link
            key={s.id}
            href={s.href}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors group ${
              s.done ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            {s.done
              ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              : <Circle className="w-5 h-5 text-zinc-600 shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${s.done ? 'text-zinc-400 line-through' : 'text-zinc-200'}`}>{s.label}</p>
              <p className="text-xs text-zinc-500">{s.hint}</p>
            </div>
            {!s.done && <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-pink-400 transition-colors shrink-0" />}
          </Link>
        ))}
      </div>
    </div>
  );
}
