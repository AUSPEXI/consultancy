import React, { useState } from 'react';
import { db } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, CheckCircle2, Loader2, Sparkles, FileText, ArrowRight } from 'lucide-react';
import Markdown from 'react-markdown';
import { useAuth } from '@/contexts/AuthContext';
import { handleFirestoreError, OperationType } from '@/lib/firestore-errors';

interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: string;
}

export function LeadCaptureModal({ isOpen, onClose, source }: LeadCaptureModalProps) {
  const { user, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [domain, setDomain] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !domain) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Save lead to Firestore
      try {
        await addDoc(collection(db, 'leads'), {
          email,
          domain,
          source: source || 'direct',
          status: 'new',
          createdAt: new Date().toISOString().split('T')[0] + 'T00:00:00Z',
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'leads');
      }

      // Generate the report
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, domain }),
      });

      const data = await response.json();
      if (data.success) {
        setReport(data.report);
      } else {
        throw new Error(data.error || 'Failed to generate report');
      }
    } catch (err: any) {
      console.error('Error generating report:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLifetimeDeal = async () => {
    try {
      setIsCheckingOut(true);
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier: 'LifetimeDeal',
          userId: user?.uid,
          email: email, // Pass the email they entered!
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        console.error('Failed to create checkout session:', data.error);
        alert('Failed to initiate checkout. Please try again.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('An error occurred during checkout.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`relative w-full ${report ? 'max-w-4xl' : 'max-w-md'} bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl my-8 transition-all duration-500`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {report ? (
          <div className="flex flex-col md:flex-row gap-8">
            {/* Report Section */}
            <div className="flex-1 overflow-y-auto max-h-[70vh] pr-4 custom-scrollbar">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold font-heading text-white">Your GEO Visibility Report</h2>
              </div>
              <div className="prose prose-invert prose-zinc max-w-none prose-headings:font-heading prose-a:text-indigo-400">
                <Markdown>{report}</Markdown>
              </div>
            </div>

            {/* Offer Section */}
            <div className="w-full md:w-80 flex-shrink-0">
              <div className="sticky top-0 bg-zinc-950 border border-indigo-500/30 rounded-xl p-6 shadow-[0_0_30px_-10px_rgba(99,102,241,0.2)]">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  Exclusive Offer
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Lifetime Dashboard Access</h3>
                <p className="text-zinc-400 text-sm mb-6">
                  Get full access to the Auspexi GEO Dashboard forever. Track your Share of Voice, analyze competitors, and extract Cite-Magnets.
                </p>
                
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-white">$499</span>
                    <span className="text-zinc-500 line-through text-sm">$4,999/yr</span>
                  </div>
                  <p className="text-emerald-400 text-xs font-medium mt-1">One-time payment. No subscriptions.</p>
                </div>

                <Button 
                  onClick={handleLifetimeDeal}
                  disabled={isCheckingOut}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-base font-medium group"
                >
                  {isCheckingOut ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Claim Lifetime Deal
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
                <p className="text-center text-zinc-500 text-xs mt-4">
                  Offer valid for the next 24 hours only. If you cancel and sign back up, standard pricing will apply.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-bold text-white mb-2">
              Get Your Free GEO Audit
            </h3>
            <p className="text-zinc-400 mb-6">
              Enter your domain and email to receive a comprehensive AI Share of Voice report generated by our Exa.ai + Gemini pipeline.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="yourdomain.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border-zinc-800 text-white h-12 mb-4"
                />
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border-zinc-800 text-white h-12"
                />
              </div>
              
              {error && <p className="text-red-400 text-sm">{error}</p>}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white text-black hover:bg-zinc-200 h-12 text-base font-medium"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing Domain...
                  </span>
                ) : (
                  'Generate Report'
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
