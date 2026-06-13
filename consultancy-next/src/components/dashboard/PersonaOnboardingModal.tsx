'use client';

import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

type PersonaType = 'marketer' | 'agency' | 'founder' | 'other';

const PERSONAS: { value: PersonaType; label: string; description: string }[] = [
  {
    value: 'marketer',
    label: 'In-house marketer',
    description: 'Marketing or growth role at a company — need to show results to leadership',
  },
  {
    value: 'agency',
    label: 'Agency owner / consultant',
    description: 'Running client accounts — need deliverables and reporting for clients',
  },
  {
    value: 'founder',
    label: 'Founder / solo builder',
    description: 'Building a product or brand myself — need automation and fast wins',
  },
  {
    value: 'other',
    label: 'Something else',
    description: "I'll figure out my own path",
  },
];

export function PersonaOnboardingModal() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<PersonaType | null>(null);
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (!selected || !user) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        { personaType: selected, onboardingCompleted: true },
        { merge: true },
      );
    } catch (err) {
      console.error('Failed to save persona:', err);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-white">Welcome to L8EntSpace</h2>
          <p className="text-sm text-zinc-400 mt-1">
            One quick question — it helps us tailor the experience.
          </p>
        </div>

        <p className="text-sm font-medium text-zinc-300 mb-3">What best describes you?</p>

        <div className="space-y-2">
          {PERSONAS.map((p) => (
            <button
              key={p.value}
              onClick={() => setSelected(p.value)}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                selected === p.value
                  ? 'border-pink-500 bg-pink-500/10 text-white'
                  : 'border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600 hover:text-white'
              }`}
            >
              <span className="text-sm font-medium block">{p.label}</span>
              <span className="text-xs text-zinc-500 mt-0.5 block">{p.description}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleConfirm}
          disabled={!selected || saving}
          className="mt-5 w-full py-2.5 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? 'Saving…' : 'Get started'}
        </button>
      </div>
    </div>
  );
}
