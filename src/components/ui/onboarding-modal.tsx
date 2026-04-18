import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { Loader2, Target, Globe, Building2, Search } from 'lucide-react';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

interface OnboardingModalProps {
  onComplete: () => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    brand: '',
    domain: '',
    competitor1: '',
    competitor2: '',
    competitor3: '',
    competitor4: '',
    keyword1: '',
    keyword2: '',
    keyword3: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    setError('');

    try {
      const competitors = [
        formData.competitor1, 
        formData.competitor2, 
        formData.competitor3, 
        formData.competitor4
      ].filter(Boolean);
      const keywords = [formData.keyword1, formData.keyword2, formData.keyword3].filter(Boolean);

      // 1. Update user document
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        brand: formData.brand,
        domain: formData.domain,
        competitors,
        keywords,
        onboardingCompleted: true
      }).catch(err => handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`));

      // 2. Trigger the first real audit and WAIT for it
      try {
        const res = await fetch('/api/run-daily-audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            brand: formData.brand,
            domain: formData.domain,
            competitors,
            keywords
          })
        });
        
        const data = await res.json();
        if (data.success && data.metrics) {
          const today = new Date();
          await addDoc(collection(db, 'sovMetrics'), {
            userId: user.uid,
            date: today.toISOString().split('T')[0],
            shortDate: today.toLocaleDateString('en-US', { weekday: 'short' }),
            ...data.metrics
          });
          setStep(3); // Move to success step!
        } else {
          throw new Error('Audit API failed to return metrics');
        }
      } catch (auditErr) {
        console.error("Initial audit failed:", auditErr);
        // Even if audit fails, we mark onboarding complete so they aren't stuck forever
        setStep(3); 
      }

    } catch (err: any) {
      setError(err.message || 'An error occurred during setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
          <h2 className="text-2xl font-bold text-white">Welcome to Auspexi</h2>
          <p className="text-zinc-400 mt-1">Let's set up your Generative Engine Optimization tracking.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-pink-500" />
                  Your Brand Name
                </label>
                <input
                  required
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="e.g., Auspexi"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-pink-500" />
                  Your Domain
                </label>
                <input
                  required
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  placeholder="e.g., auspexi.com"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (formData.brand && formData.domain) setStep(2);
                }}
                disabled={!formData.brand || !formData.domain}
                className="w-full bg-white text-black hover:bg-zinc-200 disabled:opacity-50 px-4 py-2.5 rounded-lg font-medium transition-colors mt-4"
              >
                Next Step
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <Target className="w-4 h-4 text-pink-500" />
                  Top Competitors
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    required
                    name="competitor1"
                    value={formData.competitor1}
                    onChange={handleChange}
                    placeholder="Competitor 1"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  />
                  <input
                    name="competitor2"
                    value={formData.competitor2}
                    onChange={handleChange}
                    placeholder="Competitor 2 (Optional)"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  />
                  <input
                    name="competitor3"
                    value={formData.competitor3}
                    onChange={handleChange}
                    placeholder="Competitor 3 (Optional)"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  />
                  <input
                    name="competitor4"
                    value={formData.competitor4}
                    onChange={handleChange}
                    placeholder="Competitor 4 (Optional)"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                  <Search className="w-4 h-4 text-pink-500" />
                  Target Keywords (What do people search for?)
                </label>
                <div className="space-y-3">
                  <input
                    required
                    name="keyword1"
                    value={formData.keyword1}
                    onChange={handleChange}
                    placeholder="e.g., best AI consultancy London"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  />
                  <input
                    name="keyword2"
                    value={formData.keyword2}
                    onChange={handleChange}
                    placeholder="e.g., generative engine optimization services"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  />
                  <input
                    name="keyword3"
                    value={formData.keyword3}
                    onChange={handleChange}
                    placeholder="e.g., how to rank in ChatGPT"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-lg font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !formData.competitor1 || !formData.keyword1}
                  className="flex-1 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  {isLoading ? 'Running Initial Audit...' : 'Complete Setup & Run Audit'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 text-center py-6">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                <Target className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Tracking Initialized</h3>
                <p className="text-zinc-400 text-sm max-w-md mx-auto">
                  Your baseline Generative Engine Optimization metrics have been calculated. The dashboard will now automatically monitor <strong>{formData.brand}</strong> against your competitors every 24 hours.
                </p>
              </div>
              
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mt-6 text-left">
                <p className="text-xs text-zinc-500 uppercase font-semibold mb-2">What happens next?</p>
                <ul className="text-sm text-zinc-300 space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-pink-500 mt-0.5">•</span>
                    Your real-time Share of Voice is now visible on the Overview tab.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-500 mt-0.5">•</span>
                    Head to the <strong>Fact-Vault</strong> to start storing high-entropy data.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pink-500 mt-0.5">•</span>
                    Ask Citacious (bottom right) for a guided tour of the platform.
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onComplete()}
                className="w-full bg-white hover:bg-zinc-200 text-black px-4 py-3 rounded-lg font-medium transition-colors mt-6 shadow-lg shadow-white/5"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
