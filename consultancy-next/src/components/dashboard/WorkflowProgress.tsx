'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ChevronRight, ArrowRight, ArrowLeft } from 'lucide-react';

export const WORKFLOW_STEPS = [
  { step: 1, key: 'step1', label: 'Probe',     path: '/dashboard/cite-probe',     desc: 'Find where AI ignores your brand' },
  { step: 2, key: 'step2', label: 'Fact Vault', path: '/dashboard/fact-vault',     desc: 'Store brand facts + generate embeddings' },
  { step: 3, key: 'step3', label: 'Pipeline',   path: '/dashboard/agents',          desc: 'Generate GEO articles from your facts' },
  { step: 4, key: 'step4', label: 'Score',      path: '/dashboard/content-scorer',  desc: 'Optimise content for AI citation' },
  { step: 5, key: 'step5', label: 'Deploy',     path: '/dashboard/technical',       desc: 'Add JSON-LD schema to your site' },
] as const;

export function markStepComplete(step: number) {
  try {
    const stored = localStorage.getItem('geo_workflow_progress');
    const progress = stored ? JSON.parse(stored) : {};
    const s = WORKFLOW_STEPS.find(s => s.step === step);
    if (s) { progress[s.key] = true; localStorage.setItem('geo_workflow_progress', JSON.stringify(progress)); }
  } catch {}
}

export function getWorkflowProgress(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem('geo_workflow_progress');
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

interface WorkflowProgressProps {
  currentStep: 1 | 2 | 3 | 4 | 5;
}

export function WorkflowProgress({ currentStep }: WorkflowProgressProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    const progress = getWorkflowProgress();
    const done = new Set<number>();
    WORKFLOW_STEPS.forEach(s => { if (progress[s.key]) done.add(s.step); });
    setCompletedSteps(done);
  }, []);

  const prevStep = WORKFLOW_STEPS.find(s => s.step === currentStep - 1);
  const nextStep = WORKFLOW_STEPS.find(s => s.step === currentStep + 1);
  const current  = WORKFLOW_STEPS.find(s => s.step === currentStep)!;
  const doneCount = completedSteps.size;

  return (
    <div className="mb-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
      {/* Top row: progress label */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black tracking-[0.2em] text-zinc-600 uppercase">GEO Workflow</span>
          <span className="text-[10px] text-zinc-700">·</span>
          <span className="text-[10px] text-pink-500 font-semibold">Step {currentStep} of {WORKFLOW_STEPS.length}</span>
          {doneCount > 0 && (
            <span className="text-[10px] text-zinc-600">· {doneCount} complete</span>
          )}
        </div>
        {/* Prev / next quick nav */}
        <div className="flex items-center gap-2">
          {prevStep && (
            <Link href={prevStep.path} className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-300 transition-colors">
              <ArrowLeft className="w-3 h-3" />{prevStep.label}
            </Link>
          )}
          {nextStep && (
            <Link href={nextStep.path} className="flex items-center gap-1 text-[10px] text-pink-500 hover:text-pink-400 font-semibold transition-colors">
              {nextStep.label} <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-1">
        {WORKFLOW_STEPS.map((s, i) => {
          const isDone    = completedSteps.has(s.step);
          const isCurrent = s.step === currentStep;
          return (
            <div key={s.step} className="flex items-center gap-1 min-w-0">
              <Link
                href={s.path}
                title={s.desc}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isCurrent ? 'bg-pink-500/10 border border-pink-500/30 text-pink-300' :
                  isDone    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
                              'border border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <span className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center shrink-0 ${
                    isCurrent ? 'bg-pink-500 text-white' : 'bg-zinc-800 text-zinc-500'
                  }`}>{s.step}</span>
                )}
                <span className="hidden sm:block">{s.label}</span>
              </Link>
              {i < WORKFLOW_STEPS.length - 1 && (
                <ChevronRight className="w-3 h-3 text-zinc-700 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Current step description */}
      <p className="mt-3 text-xs text-zinc-600 pt-2 border-t border-zinc-800/60">{current.desc}</p>
    </div>
  );
}
