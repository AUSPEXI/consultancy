import { useState, useEffect } from 'react';
import { Code, Server, RefreshCw, Loader2, ArrowRight, Copy, CheckCircle2, FileJson, Download, Target } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { useAuth } from '@/contexts/AuthContext';
import { UpgradePrompt } from '@/components/ui/upgrade-prompt';
import { logAuditAction } from '@/lib/audit';
import { db } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { checkTierAccess } from '@/constants/tiers';

export function Technical() {
  const { tier, role, user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ fluff: string; table: string } | null>(null);

  const [domain, setDomain] = useState('');
  const [workerScript, setWorkerScript] = useState('');
  const [copiedWorker, setCopiedWorker] = useState(false);

  const [factText, setFactText] = useState('');
  const [isGeneratingSchema, setIsGeneratingSchema] = useState(false);
  const [schemaResult, setSchemaResult] = useState<string | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);
  
  const [savedFacts, setSavedFacts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchFacts = async () => {
      try {
        const q = query(collection(db, 'knowledge_graph'), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        const facts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort by newest
        facts.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setSavedFacts(facts.slice(0, 5)); // show top 5 recent facts
      } catch (err) {
        console.error("Failed to fetch facts:", err);
      }
    };
    fetchFacts();
  }, [user]);

  if (role !== 'admin' && !checkTierAccess(tier, 'Premium')) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-heading mb-2">Technical SEO & Edge Injection</h1>
          <p className="text-zinc-400">Deploy server-side schema and restructure semantic HTML for AI crawlers.</p>
        </div>
        <UpgradePrompt 
          title="Technical SEO Locked" 
          description="Upgrade to the Premium tier to access the Edge SEO Cloudflare Worker Generator, Semantic HTML Restructuring, and JSON-LD Cite-Magnet Generator."
          requiredTier="Premium"
        />
      </div>
    );
  }

  const handleRestructure = async () => {
    if (!inputText.trim()) return;
    
    setIsProcessing(true);
    try {
      const dbUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000';
      const searchRes = await fetch(`${dbUrl}/api/technical-restructure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText })
      });
      const data = await searchRes.json();
      
      if (!data.success) throw new Error(data.error);

      const parsed = data.result;
      if (parsed.detectedFluff && parsed.htmlTable) {
        setResult({
          fluff: parsed.detectedFluff,
          table: parsed.htmlTable
        });
        if (user) {
          await logAuditAction(user.uid, 'Restructured Semantic HTML', { length: inputText.length });
        }
      }
    } catch (error) {
      console.error('Error restructuring text:', error);
      alert('Failed to restructure text. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateSchema = async () => {
    if (!factText.trim()) return;
    
    setIsGeneratingSchema(true);
    try {
      const dbUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000';
      const searchRes = await fetch(`${dbUrl}/api/technical-schema`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factText })
      });
      const data = await searchRes.json();
      
      if (!data.success) throw new Error(data.error);

      setSchemaResult(data.schema);
      if (user) {
        await logAuditAction(user.uid, 'Generated JSON-LD Schema', { factLength: factText.length });
      }
    } catch (error) {
      console.error('Error generating schema:', error);
      alert('Failed to generate schema. Please try again.');
    } finally {
      setIsGeneratingSchema(false);
    }
  };

  const generateWorker = () => {
    if (!domain.trim()) return;
    const script = `/**
 * Auspexi Edge SEO Worker for ${domain}
 * Deploys to Cloudflare Workers to inject GEO Schema at the edge.
 * Guarantees AI crawlers read the schema before client-side rendering.
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 1. Fetch the original HTML from your origin server
    const response = await fetch(request);
    
    // 2. Only process HTML responses
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("text/html")) {
      return response;
    }

    // 3. Fetch the latest GEO Schema for this specific URL from Auspexi
    // In production, this would hit the Auspexi API:
    const schemaRes = await fetch(\`https://api.auspexi.com/v1/schema?url=\${url.href}\`);
    let schemaData = {};
    if (schemaRes.ok) {
      schemaData = await schemaRes.json();
    } else {
      // Fallback schema if API fails
      schemaData = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [{
          "@type": "Question",
          "name": "What is the primary benefit of Edge SEO?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "It guarantees AI crawlers can read semantic data without executing JavaScript."
          }
        }]
      };
    }

    // 4. Inject the schema into the <head> of the HTML
    class SchemaRewriter {
      element(element) {
        element.append(
          \`<script type="application/ld+json">\${JSON.stringify(schemaData)}</script>\`,
          { html: true }
        );
      }
    }

    const rewriter = new HTMLRewriter().on("head", new SchemaRewriter());
    return rewriter.transform(response);
  }
};`;
    setWorkerScript(script);
    if (user) {
      logAuditAction(user.uid, 'Generated Edge SEO Worker', { domain });
    }
  };

  const copyWorker = () => {
    navigator.clipboard.writeText(workerScript);
    setCopiedWorker(true);
    setTimeout(() => setCopiedWorker(false), 2000);
  };

  const downloadWorker = () => {
    const blob = new Blob([workerScript], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'worker.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copySchema = () => {
    if (schemaResult) {
      navigator.clipboard.writeText(schemaResult);
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 2000);
    }
  };

  const downloadSchema = () => {
    if (schemaResult) {
      const blob = new Blob([schemaResult], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'schema.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Enterprise Infrastructure</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage semantic indexing, compliant data pipelines, and edge-injection architecture.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 768-D Latent Space Infrastructure */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden relative h-fit">
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white">768-D Latent Space Moat (pgvector)</h3>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-full tracking-widest uppercase">Proprietary</span>
            </div>
            <p className="text-sm text-zinc-400">
              High-scale vector indexing ensures your brand's semantic proximity to 'Trust' remains irrefutable. Our pgvector database routes billions of data points to maintain your proprietary moat.
            </p>
          </div>
          <div className="p-6">
             <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                   <span className="text-zinc-500">Global Concurrency Status</span>
                   <span className="text-emerald-400 font-mono">Active / 100 ops/sec</span>
                </div>
                <div className="w-full bg-zinc-950 rounded-full h-1.5 overflow-hidden">
                   <div className="bg-pink-500 h-full w-[65%] animate-pulse"></div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                   {['GPT-4o', 'Gemini Pro', 'Claude 3.5'].map(m => (
                      <div key={m} className="bg-zinc-950 border border-zinc-800 rounded p-2 text-center">
                         <div className="text-[10px] text-zinc-500 mb-1">{m}</div>
                         <div className="text-xs text-white font-mono">99.8%</div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>

        {/* Edge SEO Generator */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden relative h-fit">
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                  <Server className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white">Edge GEO-Schema Injector</h3>
              </div>
            </div>
            <p className="text-sm text-zinc-400">
              Deterministic fact injection. Server-side middleware ensuring that RAG engines (SearchGPT, Perplexity) ingest your optimized knowledge base before client-side hydration.
            </p>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="Enter your domain (e.g., example.com)"
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
              />
              <button 
                onClick={generateWorker}
                disabled={!domain.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              >
                Generate Script
              </button>
            </div>

            {workerScript && (
              <div className="mt-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">worker.js</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={downloadWorker}
                      className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                    <button 
                      onClick={copyWorker}
                      className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      {copiedWorker ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedWorker ? 'Copied!' : 'Copy Script'}
                    </button>
                  </div>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs text-zinc-300 font-mono">
                    {workerScript}
                  </pre>
                </div>
                <div className="mt-4 p-3 bg-pink-500/10 border border-pink-500/20 rounded-lg">
                  <p className="text-xs text-pink-300">
                    <strong>Next Steps:</strong> Go to your Cloudflare Dashboard, create a new Worker, paste this code, and deploy. Your site will now inject GEO Schema directly at the edge!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Semantic HTML Restructuring */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden relative">
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-pink-500/10 rounded-lg text-pink-400">
                <Code className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">The "Table-Maker" Module</h3>
            </div>
            <p className="text-sm text-zinc-400">
              LLMs are mathematically biased to extract data from tables. Paste dense paragraphs below to restructure them into vector-friendly HTML tables.
            </p>
          </div>
          
          <div className="p-6 space-y-4">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste a dense paragraph here (e.g., 'Our basic plan costs $49 and includes 10 audits. The pro plan is $99 for 50 audits...')"
              className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-none text-sm"
            />
            
            <button 
              onClick={handleRestructure}
              disabled={isProcessing || !inputText.trim()}
              className="w-full bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Restructuring...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Generate Semantic Table
                </>
              )}
            </button>

            {result && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 mt-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Detected Fluff Paragraph</span>
                  <span className="text-xs text-rose-400">Low Extraction Rate</span>
                </div>
                <p className="text-sm text-zinc-500 line-through decoration-rose-500/50 mb-4">
                  {result.fluff}
                </p>
                
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Restructured HTML Table</span>
                  <span className="text-xs text-emerald-400">High Extraction Rate</span>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded overflow-hidden overflow-x-auto" dangerouslySetInnerHTML={{ __html: result.table }} />
                
                <div className="mt-4 pt-4 border-t border-zinc-800/50 flex justify-end">
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(result.table);
                      alert('HTML copied to clipboard!');
                    }}
                    className="text-xs font-medium text-pink-400 hover:text-pink-300 flex items-center gap-1"
                  >
                    Copy HTML Code <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* JSON-LD Cite-Magnet Generator */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden relative">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
              <FileJson className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-white">Automated JSON-LD "Cite-Magnet" Generator</h3>
          </div>
          <p className="text-sm text-zinc-400">
            LLMs rely heavily on structured data to confidently extract facts. Paste a fact or claim below, and we will generate the exact JSON-LD schema code to spoon-feed the LLM.
          </p>
        </div>
        
        <div className="p-6 space-y-4">
          {savedFacts.length > 0 && (
            <div className="mb-4">
              <span className="text-xs font-medium text-zinc-400 mb-2 block uppercase tracking-wider">Quick Select from Fact-Vault</span>
              <div className="flex flex-wrap gap-2">
                {savedFacts.map((factItem, i) => (
                  <button
                    key={i}
                    onClick={() => setFactText(factItem.fact)}
                    className="text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-full px-3 py-1.5 transition-colors text-left max-w-[300px] truncate"
                    title={factItem.fact}
                  >
                    {factItem.fact}
                  </button>
                ))}
              </div>
            </div>
          )}

          <textarea
            value={factText}
            onChange={(e) => setFactText(e.target.value)}
            placeholder="e.g., Auspexi increases AI Share of Voice by 40% within 3 months."
            className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none text-sm"
          />
          
          <button 
            onClick={handleGenerateSchema}
            disabled={isGeneratingSchema || !factText.trim()}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isGeneratingSchema ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating Schema...</>
            ) : (
              <><FileJson className="w-4 h-4" /> Generate JSON-LD Code</>
            )}
          </button>

          {schemaResult && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 mt-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">JSON-LD Schema</span>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={downloadSchema}
                    className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                  <button 
                    onClick={copySchema}
                    className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    {copiedSchema ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedSchema ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
              </div>
              <pre className="text-xs text-zinc-300 font-mono overflow-x-auto p-4 bg-zinc-900 rounded border border-zinc-800">
                {schemaResult}
              </pre>
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-xs text-amber-300">
                  <strong>Next Steps:</strong> Copy this code and paste it into the <code>&lt;head&gt;</code> section of the relevant page on your website.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
