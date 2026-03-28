import { useState } from 'react';
import { PenTool, Loader2, CheckCircle2, AlertTriangle, ArrowRight, LayoutTemplate, FileText, BookOpen } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { useAuth } from '@/contexts/AuthContext';
import { UpgradePrompt } from '@/components/ui/upgrade-prompt';

type ContentType = 'sales' | 'blog' | 'technical';

export function ContentScorer() {
  const { tier } = useAuth();
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState<ContentType>('sales');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isPreviewingUpdate, setIsPreviewingUpdate] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const handlePublish = async () => {
    setIsPublishing(true);
    // Simulate API call to update website
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsPublishing(false);
    setPublishSuccess(true);
    setTimeout(() => {
      setPublishSuccess(false);
      setIsPreviewingUpdate(false);
    }, 3000);
  };

  if (tier === 'Free') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-heading mb-2">Pre-Publish Content Scorer</h1>
          <p className="text-zinc-400">Analyze your content for "Machine Readability" before you publish.</p>
        </div>
        <UpgradePrompt 
          title="Content Scorer Locked" 
          description="Upgrade to the Basic tier to access the Pre-Publish Content Scorer and ensure your content is optimized for LLM extraction."
          requiredTier="Basic"
        />
      </div>
    );
  }

  const handleAnalyze = async () => {
    if (!content.trim()) return;
    setIsAnalyzing(true);
    setResult(null);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
      if (!apiKey) throw new Error("API key is missing");
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
        You are an expert Generative Engine Optimization (GEO) agent.
        Analyze the following content for "Machine Readability" and its likelihood to be cited by LLMs (ChatGPT, Claude, Gemini).
        
        CRITICAL CONTEXT: The user has specified this content is intended for: "${contentType}".
        ${contentType === 'sales' ? 'Do NOT penalize the content for having marketing hooks, persuasive copy, or human-centric storytelling. Instead, evaluate how well they have WEAVED machine-readable facts, entities, and statistical anchors INTO the sales copy without destroying the human conversion rate. Suggest ways to add "Cite-Magnets" without ruining the sales pitch.' : ''}
        ${contentType === 'technical' ? 'This is technical documentation. It should be ruthlessly optimized for machine readability, high entity density, and direct answers. Penalize fluff heavily.' : ''}
        ${contentType === 'blog' ? 'This is a blog post. It should balance engaging human narrative with clear, extractable facts and inverted pyramid structures for key takeaways. Suggest adding summary bullet points or bolded data points.' : ''}
        
        Content:
        ${content}
        
        Score the content out of 100 based on:
        1. Entity Density (Are key entities clearly defined?)
        2. Statistical Anchors (Are there hard numbers/facts instead of qualitative fluff?)
        3. Inverted Pyramid of Synthesis (Is the direct answer accessible, even if wrapped in a narrative?)
        
        Return a JSON object with:
        - overallScore (number 0-100)
        - entityDensityScore (number 0-100)
        - statisticalAnchorsScore (number 0-100)
        - invertedPyramidScore (number 0-100)
        - feedback (array of strings, specific actionable advice on what to change, respecting the content type)
        - rewrittenSnippet (string, a suggested rewrite of a weak paragraph to make it more machine-readable while maintaining the appropriate tone for a ${contentType})
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallScore: { type: Type.NUMBER },
              entityDensityScore: { type: Type.NUMBER },
              statisticalAnchorsScore: { type: Type.NUMBER },
              invertedPyramidScore: { type: Type.NUMBER },
              feedback: { type: Type.ARRAY, items: { type: Type.STRING } },
              rewrittenSnippet: { type: Type.STRING }
            },
            required: ["overallScore", "entityDensityScore", "statisticalAnchorsScore", "invertedPyramidScore", "feedback", "rewrittenSnippet"]
          }
        }
      });

      setResult(JSON.parse(response.text || "{}"));
    } catch (error) {
      console.error("Error scoring content:", error);
      alert("Failed to analyze content. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <PenTool className="w-6 h-6 text-indigo-500" />
            Pre-Publish Content Scorer
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Analyze your content for "Machine Readability" before you publish.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          
          {/* Content Type Selector */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <label className="block text-sm font-medium text-zinc-300 mb-3">What type of content is this?</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setContentType('sales')}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border text-xs font-medium transition-all ${
                  contentType === 'sales' 
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' 
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <LayoutTemplate className="w-5 h-5" />
                Sales / Landing Page
              </button>
              <button
                onClick={() => setContentType('blog')}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border text-xs font-medium transition-all ${
                  contentType === 'blog' 
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <FileText className="w-5 h-5" />
                Blog / Article
              </button>
              <button
                onClick={() => setContentType('technical')}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border text-xs font-medium transition-all ${
                  contentType === 'technical' 
                    ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' 
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                Technical Docs
              </button>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your draft here..."
              className="w-full h-80 bg-zinc-950 border border-zinc-800/50 rounded-lg p-4 text-zinc-300 placeholder-zinc-600 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !content.trim()}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing Intent & Readability...</>
            ) : (
              <><PenTool className="w-4 h-4" /> Analyze Content</>
            )}
          </button>
        </div>

        {result && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-semibold text-white">Overall GEO Score</h3>
                  <p className="text-xs text-zinc-500 mt-1">Optimized for {contentType} intent</p>
                </div>
                <div className={`text-4xl font-bold tracking-tighter ${getScoreColor(result.overallScore)}`}>
                  {result.overallScore}/100
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-2">
                    <span className="text-zinc-400 uppercase tracking-wider">Entity Density</span>
                    <span className={getScoreColor(result.entityDensityScore)}>{result.entityDensityScore}/100</span>
                  </div>
                  <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${result.entityDensityScore}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-medium mb-2">
                    <span className="text-zinc-400 uppercase tracking-wider">Statistical Anchors</span>
                    <span className={getScoreColor(result.statisticalAnchorsScore)}>{result.statisticalAnchorsScore}/100</span>
                  </div>
                  <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${result.statisticalAnchorsScore}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-medium mb-2">
                    <span className="text-zinc-400 uppercase tracking-wider">Inverted Pyramid</span>
                    <span className={getScoreColor(result.invertedPyramidScore)}>{result.invertedPyramidScore}/100</span>
                  </div>
                  <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${result.invertedPyramidScore}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Actionable Feedback
              </h3>
              <ul className="space-y-3">
                {result.feedback.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-zinc-300 bg-zinc-950/50 p-3 rounded-lg border border-zinc-800/50">
                    <ArrowRight className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
              <h3 className="text-sm font-semibold text-indigo-300 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Suggested Rewrite (GEO-Optimized)
              </h3>
              <p className="text-sm text-indigo-100/80 leading-relaxed bg-zinc-950/50 p-4 rounded-lg border border-indigo-500/10 mb-4">
                {result.rewrittenSnippet}
              </p>

              {!isPreviewingUpdate ? (
                <button
                  onClick={() => setIsPreviewingUpdate(true)}
                  className="w-full py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <LayoutTemplate className="w-4 h-4" /> Preview Auto-Update on Website
                </button>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Website Integration Required</h4>
                    <p className="text-sm text-zinc-400 mb-4">
                      To automatically apply these changes, Auspexi needs access to your website's CMS or codebase via our secure API integration.
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handlePublish}
                        disabled={isPublishing || publishSuccess}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isPublishing ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Publishing...</>
                        ) : publishSuccess ? (
                          <><CheckCircle2 className="w-4 h-4" /> Published Successfully</>
                        ) : (
                          <><CheckCircle2 className="w-4 h-4" /> Approve & Publish</>
                        )}
                      </button>
                      <button
                        onClick={() => setIsPreviewingUpdate(false)}
                        disabled={isPublishing}
                        className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
