'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { CheckCircle2, Clock, AlertCircle, Zap, ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeTier } from '@/constants/tiers';

const TOOL_LABELS: Record<string, string> = {
  'brand-monitor': 'Brand Monitor',
  'cite-probe':    'Citation Tracker',
  'daily-audit':   'SOV Audit',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function nextRunLabel(tier: string): string {
  const t = normalizeTier(tier);
  if (t === 'Pro' || t === 'Business') return 'tomorrow 07:00 UTC';
  return 'next week';
}

export function AutomationStatus() {
  const { user, tier, userData } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [automation, setAutomation] = useState<Record<string, any>>({});
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid);
    return onSnapshot(ref, snap => {
      setAutomation(snap.data()?.automation ?? {});
    });
  }, [user]);

  if (!user) return null;

  const enabled = automation.enabled !== false; // default on
  const lastRunAt = automation.lastRunAt;
  const lastResults: Record<string, any> = automation.lastResults ?? {};
  const hasResults = Object.keys(lastResults).length > 0;

  const toggle = async () => {
    if (!user || toggling) return;
    setToggling(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { 'automation.enabled': !enabled });
    } finally {
      setToggling(false);
    }
  };

  const tierLabel = normalizeTier(tier);
  const cadence = (tierLabel === 'Pro' || tierLabel === 'Business') ? 'Daily' : 'Weekly';

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Zap className={`w-4 h-4 shrink-0 ${enabled ? 'text-pink-400' : 'text-zinc-600'}`} />
          <span className="text-sm font-semibold text-zinc-100 truncate">
            Autopilot
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
            enabled ? 'bg-pink-500/20 text-pink-400' : 'bg-zinc-800 text-zinc-500'
          }`}>
            {enabled ? cadence : 'Paused'}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {lastRunAt && (
            <span className="text-[11px] text-zinc-500 hidden sm:block">
              Last run {timeAgo(lastRunAt)}
            </span>
          )}
          <button
            onClick={toggle}
            disabled={toggling}
            aria-label={enabled ? 'Pause autopilot' : 'Resume autopilot'}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            {enabled
              ? <ToggleRight className="w-5 h-5 text-pink-400" />
              : <ToggleLeft className="w-5 h-5" />}
          </button>
          {hasResults && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label={expanded ? 'Collapse' : 'Expand results'}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Status: no results yet */}
      {!hasResults && enabled && (
        <div className="px-4 pb-3 text-[11px] text-zinc-500">
          <Clock className="w-3 h-3 inline mr-1" />
          First run scheduled — {nextRunLabel(tier ?? 'Free')}
        </div>
      )}

      {/* Status: paused */}
      {!enabled && (
        <div className="px-4 pb-3 text-[11px] text-zinc-500">
          Autopilot is paused. Toggle on to resume automated monitoring.
        </div>
      )}

      {/* Expanded results */}
      {expanded && hasResults && (
        <div className="border-t border-zinc-800 divide-y divide-zinc-800/60">
          {Object.entries(lastResults).map(([tool, result]: [string, any]) => (
            <div key={tool} className="px-4 py-2.5 flex items-start gap-2.5">
              {result.success
                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                : <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />}
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-zinc-300">
                  {TOOL_LABELS[tool] ?? tool}
                  <span className="ml-2 font-normal text-zinc-500">{timeAgo(result.ranAt)}</span>
                </p>
                <p className="text-[11px] text-zinc-500 leading-snug mt-0.5 truncate">
                  {result.summary}
                </p>
              </div>
            </div>
          ))}
          <div className="px-4 py-2 text-[10px] text-zinc-600">
            Next run: {nextRunLabel(tier ?? 'Free')}
          </div>
        </div>
      )}
    </div>
  );
}
