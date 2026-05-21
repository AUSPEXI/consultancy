'use client'

import { useState, useEffect } from 'react';
import { X, Loader2, Save, Plus } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';

interface NeuralTraceConfigProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialPrompts: string[];
  onSaved: () => void;
}

export function NeuralTraceConfig({
  isOpen,
  onClose,
  userId,
  initialPrompts,
  onSaved
}: NeuralTraceConfigProps) {
  const [editPromptsState, setEditPromptsState] = useState<string[]>(initialPrompts);
  const [isSavingPrompts, setIsSavingPrompts] = useState(false);

  useEffect(() => {
    setEditPromptsState(initialPrompts);
  }, [initialPrompts]);

  if (!isOpen) return null;

  const handleSavePrompts = async () => {
    setIsSavingPrompts(true);
    try {
      await setDoc(doc(db, 'users', userId), {
        sentimentPrompts: editPromptsState.filter(p => p.trim() !== '')
      }, { merge: true });
      onSaved();
      onClose();
    } catch (e) {
      console.error("Failed to save custom prompts", e);
    } finally {
      setIsSavingPrompts(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-sm z-20 rounded-xl p-6 flex flex-col animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-white">Customize Reputational Prompts</h4>
        <button onClick={onClose} className="text-zinc-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-3 flex-1 overflow-y-auto pr-2">
        {editPromptsState.map((val, idx) => (
          <div key={idx} className="flex items-center gap-2">
             <span className="text-zinc-500 text-xs w-4">{idx + 1}.</span>
             <input
               className="flex-1 bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-zinc-200 focus:outline-none focus:border-pink-500"
               value={val}
               onChange={(e) => {
                 const n = [...editPromptsState];
                 n[idx] = e.target.value;
                 setEditPromptsState(n);
               }}
               placeholder={`Custom reputational prompt ${idx + 1}`}
             />
          </div>
        ))}
        {editPromptsState.length < 5 && (
          <button onClick={() => setEditPromptsState([...editPromptsState, ""])} className="text-xs text-pink-400 hover:text-pink-300 mt-2 flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add Prompt
          </button>
        )}
      </div>
      <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-end">
        <button
          onClick={handleSavePrompts}
          disabled={isSavingPrompts}
          className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {isSavingPrompts ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Configuration
        </button>
      </div>
    </div>
  );
}
