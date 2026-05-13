import { useState } from 'react';
import { ShieldAlert, Trash2, Database, Zap, Loader2, CheckCircle2, History } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

export function Superuser() {
  const { user } = useAuth();
  const [isResetting, setIsResetting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const collectionsToClear = [
    'sovMetrics',
    'auditLogs',
    'facts',
    'competitorScans',
    'contentScans',
    'latent_space'
  ];

  const hardReset = async () => {
    if (!user || !window.confirm("CRITICAL: This will delete ALL your brand data, audits, and history. Continue?")) return;
    
    setIsResetting(true);
    setStatus(null);
    
    try {
      for (const collName of collectionsToClear) {
        const q = query(collection(db, collName), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        
        const batchSize = 100;
        let processed = 0;
        
        while (processed < snapshot.size) {
          const batch = writeBatch(db);
          snapshot.docs.slice(processed, processed + batchSize).forEach(d => {
            batch.delete(d.ref);
          });
          await batch.commit();
          processed += batchSize;
        }
      }

      // Reset user profile onboarding - more explicit update
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        onboardingCompleted: false,
        brand: '',
        domain: '',
        keywords: [],
        competitors: [],
        connectedSocials: [],
        cmsWebhookUrl: '',
        sentimentPrompts: []
      });

      // Clear local storage
      localStorage.clear();
      sessionStorage.clear();
      
      setStatus({ type: 'success', message: 'Hard reset complete. All data purged. Reinitializing platform...' });
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'multi-collection-reset');
      setStatus({ type: 'error', message: 'Reset failed. Check logs.' });
    } finally {
      setIsResetting(false);
    }
  };

  const seedHistoricalData = async () => {
    if (!user) return;
    setIsSeeding(true);
    setStatus(null);
    
    try {
      const batch = writeBatch(db);
      const now = new Date();
      
      // Seed 15 days of SOV metrics
      for (let i = 0; i < 15; i++) {
        const date = new Date();
        date.setDate(now.getDate() - (15 - i));
        const dateStr = date.toISOString().split('T')[0];
        
        const baseSov = 15 + (i * 2);
        const ref = doc(db, 'sovMetrics', `${user.uid}_${dateStr}`);
        
        batch.set(ref, {
          userId: user.uid,
          date: dateStr,
          shortDate: date.toLocaleDateString('en-US', { weekday: 'short' }),
          aSov: baseSov + Math.sin(i) * 5,
          err: 40 + (i * 3),
          compA: 40 - (i * 1.5),
          aiTraffic: 100 + (i * 50) + Math.random() * 20,
          platforms: {
            chatgpt: baseSov + 10,
            perplexity: baseSov - 5,
            claude: baseSov + 2,
            gemini: baseSov + 15
          },
          sentiment: [
            { prompt: "Is the brand reliable?", score: 20 + (i * 4) },
            { prompt: "Pricing complaints?", score: -40 + (i * 2) }
          ]
        });
      }

      // Seed some map points for UMAP
      const mapRef = doc(db, 'latent_space', `${user.uid}_seed`);
      batch.set(mapRef, {
        userId: user.uid,
        points: Array.from({ length: 20 }).map((_, i) => ({
          x: Math.random() * 10 - 5,
          y: Math.random() * 10 - 5,
          z: Math.random() * 10 - 5,
          type: i % 2 === 0 ? 'Trust' : i % 3 === 0 ? 'Quality' : 'Price',
          distance: Math.random() * 0.5
        }))
      });

      await batch.commit();
      setStatus({ type: 'success', message: 'Historical baseline seeded successfully. Refreshing dashboard...' });
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'sovMetrics');
      setStatus({ type: 'error', message: 'Seeding failed.' });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldAlert className="w-32 h-32 text-pink-500" />
        </div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-xs font-bold border border-pink-500/20 mb-6 uppercase tracking-widest">
            Superuser Control Center
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Account Debug & Reset</h1>
          <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
            Use these tools to manually manipulate your account state for testing purposes. These actions are irreversible.
          </p>

          {status && (
            <div className={`p-4 rounded-xl mb-8 flex items-center gap-3 animate-in fade-in zoom-in duration-300 ${
              status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <ShieldAlert className="w-5 h-5 shrink-0" />}
              <span className="text-sm font-medium">{status.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={seedHistoricalData}
              disabled={isSeeding || isResetting}
              className="group p-6 bg-zinc-900 border border-zinc-800 rounded-2xl text-left hover:border-pink-500/50 transition-all disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-500 mb-4 group-hover:scale-110 transition-transform">
                {isSeeding ? <Loader2 className="w-5 h-5 animate-spin" /> : <History className="w-5 h-5" />}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Seed Baselines</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Injects 15 days of historical audit data to populate the Z-Score Drift charts and UMAP clusters.
              </p>
            </button>

            <button
              onClick={hardReset}
              disabled={isResetting || isSeeding}
              className="group p-6 bg-zinc-900 border border-zinc-800 rounded-2xl text-left hover:border-rose-500/50 transition-all disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4 group-hover:scale-110 transition-transform">
                {isResetting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Hard Reset</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Deletes all audits, scans, and facts. Resets onboarding status and clears local chat memory.
              </p>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-zinc-500" />
          <h4 className="font-bold text-white uppercase text-xs tracking-widest">Database Node</h4>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Authenticated UID</p>
            <p className="text-xs font-mono text-zinc-300 break-all">{user?.uid}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Project Root</p>
            <p className="text-xs font-mono text-zinc-300">auspexi-enterprise-01</p>
          </div>
        </div>
      </div>
    </div>
  );
}
