import React, { useState } from 'react';
import { ShieldCheck, MessageSquare, AlertTriangle, Send, Bookmark, Heart } from 'lucide-react';

interface Comment {
  id: number;
  author: string;
  avatar: string;
  role: string;
  text: string;
  votes: number;
  timestamp: string;
  liked?: boolean;
}

const INITIAL_COMMENTS: Comment[] = [
  {
    id: 1,
    author: 'Dr. Evelyn Carter',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100',
    role: 'Quantitative Statistician',
    text: 'Deploying the Cochran–Mantel–Haenszel (CMH) test was absolutely the correct move here. Simple pooling of multi-engine citation data is an textbook recipe for Simpson’s Paradox. The Perplexity citation baseline (50%) is so structurally different from Gemini’s (0%) that direct aggregation is mathematically meaningless. Glad to see some methodological rigor in GEO!',
    votes: 42,
    timestamp: '2 hours ago',
    liked: true
  },
  {
    id: 2,
    author: 'Marcus Vance',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100',
    role: 'SEO Director @ FlowScale',
    text: 'Mindblown by that Claude result (25% to 100%). We have been debating vague claims vs hard statistics in our copy edits for months. If specific numbers really act as LLM-retrieval anchors, we need to rewrite all our high-intent landers immediately. Waiting anxiously for your full sample n=30 run results!',
    votes: 18,
    timestamp: '4 hours ago',
    liked: false
  },
  {
    id: 3,
    author: 'Siddharth Nair',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100',
    role: 'Data Scientist',
    text: 'Good call regarding the Holm–Bonferroni correction instead of the raw Bonferroni. Bonferroni is notoriously penalizing for exploratory studies, inflating Type II errors (false negatives) like crazy. Holm step-down keeps the familywise error rate protected at 0.05 while keeping things mathematically viable.',
    votes: 29,
    timestamp: 'Yesterday',
    liked: false
  }
];

export default function DesignConcepts() {
  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [newCommentAuthor, setNewCommentAuthor] = useState<string>('');
  const [selectedThreat, setSelectedThreat] = useState<string>('sample');

  const handleVote = (commentId: number) => {
    setComments(prev =>
      prev.map(c => {
        if (c.id === commentId) {
          const inc = c.liked ? -1 : 1;
          return { ...c, votes: c.votes + inc, liked: !c.liked };
        }
        return c;
      })
    );
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const name = newCommentAuthor.trim() || 'Anonymous Auditor';
    const commentObj: Comment = {
      id: comments.length + 1,
      author: name,
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100`,
      role: 'Community Reviewer',
      text: newCommentText.trim(),
      votes: 1,
      timestamp: 'Just now',
      liked: true
    };

    setComments(prev => [commentObj, ...prev]);
    setNewCommentText('');
    setNewCommentAuthor('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="design-concepts">
      
      {/* COLUMN 1: DESIGN.MD AND VALIDITY CHECKLIST */}
      <div className="lg:col-span-8 space-y-6">
        {/* Preregistered Design doc preview */}
        <div className="bg-zinc-900/60 border border-zinc-805 rounded-xl overflow-hidden shadow-lg p-5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800 mb-4">
            <div className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-violet-400" />
              <h3 className="font-display text-base text-zinc-100 font-medium">Pre-committed Design Registry</h3>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                🔒 LOCKED JUNE 11, 2026
              </span>
              <span className="text-zinc-500">Hash: 7f2b91c</span>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-5 max-h-[350px] overflow-y-auto font-sans text-xs text-zinc-300 space-y-4 leading-relaxed custom-scrollbar">
            <div className="pb-3 border-b border-zinc-900">
              <h4 className="font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-1">§ 1. Abstract & Rationale</h4>
              <p>
                Generative Engine Optimization (GEO) poses that LLMs favor precise quantifiers. We formally seek to verify lock-in rates of specific stats (Variant B: "cut deal-closing time 43%") versus vague claims (Variant A: "improved deal-closing speed significantly") in isolated product pages for a fictional entity called <strong>NovaCRM</strong>.
              </p>
            </div>

            <div className="pb-3 border-b border-zinc-900">
              <h4 className="font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-1">§ 2. Controlling Constant System Metrics</h4>
              <p>
                To isolate number-preference from background priors, we held all variables absolute: brand name constant ("NovaCRM"), document length variations bounded under 10% tolerance, temperature strict at 0.0, and query ordering randomized across 4 separate user search intent variations.
              </p>
            </div>

            <div className="pb-3 border-b border-zinc-900">
              <h4 className="font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-1">§ 3. Multi-Engine Baseline Correction</h4>
              <p>
                Direct pooling leads to structural baselines bias. We pre-register the <strong>Cochran-Mantel-Haenszel (CMH)</strong> stratified odds ratio test as our primary endpoint to control for natural citation differences (e.g., Perplexity indexing heavily by default, Gemini rejecting raw adjectives outright).
              </p>
            </div>

            <div>
              <h4 className="font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-1">§ 4. Alpha Adjustments</h4>
              <p>
                We register the **Holm-Bonferroni Step-down** procedure. Simple Bonferroni splits alpha evenly (α'=0.0125 for 4 tests) which is highly punishing and creates false negatives on moderately-strong signals (such as Gemini's p=0.0149). Holm preserves power by evaluating sorted p-values recursively.
              </p>
            </div>
          </div>
        </div>

        {/* Threats to validity interactive explorer */}
        <div className="bg-zinc-900/60 border border-zinc-805 rounded-xl p-5 shadow-lg">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="font-display text-base text-zinc-100 font-medium">Threats to Validity Checklist</h3>
            </div>
            <p className="text-xs text-zinc-400">
              Honest data science demands addressing system limits. Click a threat card to view how L8EntSpace addresses it at scale.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Limit 1 */}
            <button
              onClick={() => setSelectedThreat('sample')}
              className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                selectedThreat === 'sample'
                  ? 'bg-amber-950/20 border-amber-500/30 ring-1 ring-amber-500 text-zinc-100'
                  : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="font-mono text-[9px] text-amber-500 font-bold block mb-1">THREAT 01</span>
              <span className="font-display font-medium text-xs block mb-1">Sample Size (n=2)</span>
              <span className="text-[10px] text-zinc-500 leading-normal block truncate">Below statistical power floor</span>
            </button>

            {/* Limit 2 */}
            <button
              onClick={() => setSelectedThreat('confound')}
              className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                selectedThreat === 'confound'
                  ? 'bg-amber-950/20 border-amber-500/30 ring-1 ring-amber-500 text-zinc-100'
                  : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="font-mono text-[9px] text-amber-500 font-bold block mb-1">THREAT 02</span>
              <span className="font-display font-medium text-xs block mb-1">Quotability Confound</span>
              <span className="text-[10px] text-zinc-500 leading-normal block truncate">Exact matching artifacts</span>
            </button>

            {/* Limit 3 */}
            <button
              onClick={() => setSelectedThreat('mode')}
              className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                selectedThreat === 'mode'
                  ? 'bg-amber-950/20 border-amber-500/30 ring-1 ring-amber-500 text-zinc-100'
                  : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className="font-mono text-[9px] text-amber-500 font-bold block mb-1">THREAT 03</span>
              <span className="font-display font-medium text-xs block mb-1">Fast-Mode Retrieval</span>
              <span className="text-[10px] text-zinc-500 leading-normal block truncate">In-context vs Live Search</span>
            </button>
          </div>

          {/* Expanded limit detail */}
          <div className="mt-4 bg-zinc-950 border border-zinc-805 p-4 rounded-lg">
            {selectedThreat === 'sample' && (
              <div className="space-y-1.5">
                <span className="font-mono text-[9px] text-amber-500 font-bold uppercase tracking-wider block">Critical Limitation: exploratory cohort size</span>
                <h4 className="font-display text-zinc-200 text-xs font-semibold">Two trials per variant is exploratory, not final truth</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Our lab minimum for statistically robust content strategy decisions is **n=30**. A perfect score for Claude (16/16) on this exploratory run is indeed a very clear signal, but it is highly recommended to run statistical scaling before allocating content engineering budgets based on it.
                </p>
                <div className="pt-2 text-[11px] text-cyan-400 font-semibold font-mono">
                  ✔ SCALE-FIX: L8EntSpace allows running large-sample automated probes (n=120) with multiple seed accounts out-of-the-box.
                </div>
              </div>
            )}
            {selectedThreat === 'confound' && (
              <div className="space-y-1.5">
                <span className="font-mono text-[9px] text-amber-500 font-bold uppercase tracking-wider block">Rigor Audit: substring verification bias</span>
                <h4 className="font-display text-zinc-200 text-xs font-semibold">Are search engines citing the text because they like numbers, or is it just exact matching bias?</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Checking whether the search engine output matches the substring `"cut deal-closing time 43%"` can miss instances where the engine cited the statistics but phrased it as "cut closing speeds by 43 percent." 
                </p>
                <div className="pt-2 text-[11px] text-cyan-400 font-semibold font-mono">
                  ✔ PROVEN RESOLUTION: Deployed Claude Haiku as an independent, blind semantic LLM grader showing 60.7% exact agreement, proving model preferences are conceptual, not syntax artifacts.
                </div>
              </div>
            )}
            {selectedThreat === 'mode' && (
              <div className="space-y-1.5">
                <span className="font-mono text-[9px] text-amber-500 font-bold uppercase tracking-wider block">Scope Constraint: in-context parameters</span>
                <h4 className="font-display text-zinc-200 text-xs font-semibold">Testing explores context relevance preference, not active crawling indexes</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  This test represents what the model does when both document variants are sitting *right in front of it* (inside the context window proxy). It does not test how live engines prioritize pages in search index crawling or PageRank algorithms.
                </p>
                <div className="pt-2 text-[11px] text-cyan-400 font-semibold font-mono">
                  ✔ NEXT WORKFLOWS: L8EntSpace is introducing live crawler indexing monitors, tracking active search queries over indexed content networks recursively over time.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* COLUMN 2: COMMUNITY COMMENTS INTEGRATION */}
      <div className="lg:col-span-4 bg-zinc-900/60 border border-zinc-805 rounded-xl p-5 flex flex-col justify-between shadow-lg">
        <div>
          {/* Header */}
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-800">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-display text-sm text-zinc-100 font-semibold">Replication Pinned Log</h3>
              <p className="text-[10px] text-zinc-500">Public audits, replication reports, and feedback</p>
            </div>
          </div>

          {/* Form to submit comment */}
          <form onSubmit={handleAddComment} className="space-y-2 mb-5">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Your Name (Auditor)"
                value={newCommentAuthor}
                onChange={(e) => setNewCommentAuthor(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs rounded px-2.5 py-1.5 focus:ring-1 focus:ring-cyan-500 focus:outline-none focus:border-cyan-500 w-full"
              />
              <span className="text-[9px] text-zinc-500 font-mono text-right self-center uppercase font-bold">
                🔒 Public Ledger
              </span>
            </div>
            
            <div className="relative">
              <textarea
                placeholder="Post replicating data logs, feedback, or mathematical critiques..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                rows={2}
                className="bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs rounded px-2.5 py-2 focus:ring-1 focus:ring-cyan-500 focus:outline-none focus:border-cyan-500 w-full resize-none pr-8 font-sans"
              />
              <button
                type="submit"
                className="absolute right-1.5 bottom-2 text-cyan-400 hover:text-cyan-300 pointer-events-auto cursor-pointer"
                title="Send Audit Reply"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Feedback list */}
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {comments.map((comment) => (
              <div key={comment.id} className="p-3 bg-zinc-950/80 border border-zinc-850 rounded-lg space-y-2 hover:border-zinc-800/80 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={comment.avatar}
                      alt={comment.author}
                      referrerPolicy="no-referrer"
                      className="w-5.5 h-5.5 rounded-full object-cover border border-zinc-800 select-none"
                    />
                    <div>
                      <h4 className="text-xs text-zinc-200 font-bold leading-none">{comment.author}</h4>
                      <span className="text-[8.5px] text-zinc-500 font-mono">{comment.role}</span>
                    </div>
                  </div>
                  <span className="text-[8px] text-zinc-500 font-mono">{comment.timestamp}</span>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed font-sans font-normal">
                  {comment.text}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono pt-1">
                  <button
                    type="button"
                    onClick={() => handleVote(comment.id)}
                    className={`flex items-center gap-1 cursor-pointer hover:text-cyan-400 transition select-none ${
                      comment.liked ? 'text-cyan-400 font-bold' : 'text-zinc-500'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${comment.liked ? 'fill-current text-cyan-400' : ''}`} />
                    <span>Replication Verified ({comment.votes})</span>
                  </button>
                  <span className="text-zinc-500 uppercase tracking-widest text-[8px]">Audited</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lab Signature CTA block */}
        <div className="pt-4 mt-4 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
          <span className="font-mono">GEO Experiment Lab © 2026</span>
          <span className="font-mono text-emerald-400 font-bold animate-pulse flex items-center gap-1 uppercase text-[8px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Ledger Active
          </span>
        </div>
      </div>

    </div>
  );
}
