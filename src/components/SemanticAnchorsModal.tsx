import { useState, useEffect } from 'react';
import { X, Loader2, Sparkles, Activity, HelpCircle, Save, Plus } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { logAuditAction } from '@/lib/audit';

interface Anchor {
  label: string;
  color: string;
  baseType: string;
}

interface SemanticAnchorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  brand: string;
  domain: string;
  keywords: string[];
  initialAnchors: Anchor[];
  onSaved: () => void;
  showToast?: (text: string, type: 'success' | 'error' | 'info') => void;
}

export function SemanticAnchorsModal({ 
  isOpen, 
  onClose, 
  userId, 
  brand, 
  domain, 
  keywords, 
  initialAnchors,
  onSaved,
  showToast
}: SemanticAnchorsModalProps) {
  const [editAnchorsState, setEditAnchorsState] = useState<Anchor[]>(initialAnchors);
  const [isSavingAnchors, setIsSavingAnchors] = useState(false);
  const [isSuggestingAnchors, setIsSuggestingAnchors] = useState(false);

  useEffect(() => {
    setEditAnchorsState(initialAnchors);
  }, [initialAnchors]);

  if (!isOpen) return null;

  const handleSuggestAnchors = async () => {
    if (!brand || !domain) {
      showToast?.("Brand and domain required for autosuggest", "error");
      return;
    }

    setIsSuggestingAnchors(true);
    showToast?.("Engaging LLM for semantic anchor generation...", "info");
    
    try {
      const resp = await fetch('/api/suggest-anchors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          brand,
          domain,
          domainContext: keywords?.join(', ')
        })
      });

      if (!resp.ok) {
        const errorBody = await resp.json();
        throw new Error(errorBody.error || `HTTP error ${resp.status}`);
      }

      const data = await resp.json();
      if (data.success && data.anchors && Array.isArray(data.anchors)) {
        setEditAnchorsState(data.anchors.map((a: any) => ({
          label: a.label,
          color: a.color || '#ec4899',
          baseType: a.baseType || 'Signal Point'
        })));
        showToast?.("Semantic anchors suggested based on brand context.", "success");
      } else {
        showToast?.("Failed to generate anchors", "error");
      }
    } catch (e: any) {
      console.error("Failed to suggest anchors:", e);
      showToast?.("Error generating semantic anchors", "error");
    } finally {
      setIsSuggestingAnchors(false);
    }
  };

  const handleSaveAnchors = async () => {
    setIsSavingAnchors(true);
    try {
      await setDoc(doc(db, 'users', userId), {
        latentAnchors: editAnchorsState.filter(a => a.label.trim() !== '')
      }, { merge: true });
      await logAuditAction(userId, 'Updated Latent Anchors');
      showToast?.("Semantic architecture stabilized.", "success");
      onSaved();
      onClose();
    } catch (e) {
      console.error("Failed to save anchors", e);
      showToast?.("Failed to save semantic anchors.", "error");
    } finally {
      setIsSavingAnchors(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9000] bg-zinc-950/95 flex flex-col overflow-hidden backdrop-blur-3xl animate-in fade-in duration-300">
       <div className="max-w-5xl mx-auto w-full flex flex-col h-full p-6 sm:p-12 overflow-y-auto">
         <div className="flex items-start justify-between mb-8">
            <div>
               <h4 className="text-3xl font-bold text-white tracking-tighter">Configure Semantic Anchors</h4>
               <p className="text-sm text-zinc-500 mt-1 max-w-xl">Define the high-confidence monoliths that ground your brand in the latent space.</p>
               
               <div className="mt-6 p-4 bg-pink-500/5 border border-pink-500/10 rounded-2xl max-w-2xl">
                  <p className="text-[10px] text-pink-400 font-extrabold uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                     <HelpCircle className="w-4 h-4" /> Strategic Selection Criteria
                  </p>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                     Monitor <span className="text-zinc-100 font-medium">Systemic Anchors</span> for your core technical moats. 
                     Use <span className="text-zinc-100 font-medium font-bold">Risk Vectors</span> to track sentiment drift.
                  </p>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <button
                  onClick={handleSuggestAnchors}
                  disabled={isSuggestingAnchors}
                  className="flex items-center gap-2 px-5 py-2.5 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 rounded-xl text-xs font-bold text-pink-400 transition-all active:scale-95 disabled:opacity-50"
               >
                  {isSuggestingAnchors ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Auto-Suggest
               </button>
               <button onClick={onClose} className="p-3 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 hover:text-white hover:border-zinc-700 transition-all">
                  <X className="w-6 h-6" />
               </button>
            </div>
         </div>

         <div className="space-y-6 mb-20">
            {editAnchorsState.map((anchor, idx) => (
               <div key={idx} className="p-8 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl space-y-8 backdrop-blur-sm relative group/anchor">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500 font-black text-xs">
                         {idx + 1}
                       </div>
                       <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Neural Anchor Configuration</span>
                     </div>
                     {editAnchorsState.length > 1 && (
                        <button 
                          onClick={() => setEditAnchorsState(editAnchorsState.filter((_, i) => i !== idx))} 
                          className="text-rose-500 hover:text-white hover:bg-rose-500 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2 px-4 py-2 bg-rose-500/5 rounded-xl border border-rose-500/20"
                        >
                          <X className="w-3.5 h-3.5" /> Remove
                        </button>
                     )}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     <div className="lg:col-span-1">
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-3 tracking-widest">Anchor Label</label>
                        <input 
                           className="w-full bg-black/50 border border-zinc-800 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all placeholder:text-zinc-700 font-bold"
                           placeholder="e.g. Technical Reliability"
                           value={anchor.label}
                           onChange={(e) => {
                              const n = [...editAnchorsState];
                              n[idx].label = e.target.value;
                              setEditAnchorsState(n);
                           }}
                        />
                     </div>
                     <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-3 tracking-widest">Color Coding</label>
                        <div className="flex gap-4 h-14 items-center">
                          {['#ec4899', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b'].map(c => (
                            <button 
                              key={c}
                              onClick={() => {
                                const n = [...editAnchorsState];
                                n[idx].color = c;
                                setEditAnchorsState(n);
                              }}
                              className={`w-10 h-10 rounded-full border-2 transition-all duration-300 ${anchor.color === c ? 'border-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.2)] ring-4 ring-white/10' : 'border-transparent opacity-30 hover:opacity-100 hover:scale-105'}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                     </div>
                     <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-3 tracking-widest">Cluster Architecture</label>
                        <div className="relative">
                          <select 
                             className="w-full bg-black/50 border border-zinc-800 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 appearance-none cursor-pointer transition-all font-bold"
                             value={anchor.baseType}
                             onChange={(e) => {
                                const n = [...editAnchorsState];
                                n[idx].baseType = e.target.value;
                                setEditAnchorsState(n);
                             }}
                          >
                             <option>Systemic Anchor</option>
                             <option>Signal Point</option>
                             <option>Emergent Trend</option>
                             <option>Risk Vector</option>
                          </select>
                        </div>
                     </div>
                  </div>
               </div>
            ))}
            {editAnchorsState.length < 5 && (
               <button onClick={() => setEditAnchorsState([...editAnchorsState, { label: "New Anchor", color: "#ec4899", baseType: "Signal Point" }])} className="group w-full p-10 border-2 border-dashed border-zinc-800 hover:border-pink-500/30 rounded-3xl text-zinc-600 hover:text-pink-400 bg-zinc-950/20 hover:bg-pink-500/5 transition-all duration-500 text-sm font-bold flex flex-col items-center justify-center gap-4">
                  <div className="p-4 bg-zinc-900 rounded-2xl group-hover:bg-pink-500/10 transition-colors border border-zinc-800 group-hover:border-pink-500/20">
                    <Plus className="w-8 h-8" />
                  </div>
                  <span className="uppercase tracking-[0.3em] text-[10px] font-black">Expand Neural Network - Add Anchor</span>
               </button>
            )}
         </div>

         <div className="mt-auto pt-8 border-t border-zinc-900 flex justify-end gap-6 pb-12">
            <button onClick={onClose} className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
              Cancel Changes
            </button>
            <button
               onClick={handleSaveAnchors}
               disabled={isSavingAnchors}
               className="bg-white hover:bg-zinc-200 disabled:opacity-50 text-black px-12 py-4 rounded-2xl text-xs font-black uppercase tracking-tighter flex items-center gap-3 transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transform active:scale-95"
            >
               {isSavingAnchors ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
               Synchronize Semantic Model
            </button>
         </div>
       </div>
    </div>
  );
}
