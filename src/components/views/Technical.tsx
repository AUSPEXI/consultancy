import { useState } from 'react';
import { Code, Server, RefreshCw, Loader2, ArrowRight, Copy, CheckCircle2, FileJson } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { useAuth } from '@/contexts/AuthContext';
import { UpgradePrompt } from '@/components/ui/upgrade-prompt';

export function Technical() {
  const { tier } = useAuth();
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

  if (tier !== 'Premium') {
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
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
      if (!apiKey) throw new Error("API key is missing");
      
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
        You are an expert Generative Engine Optimization (GEO) agent.
        Analyze the following text. Identify the most "dense" or "fluffy" paragraph that contains data, pricing, or comparisons trapped in a narrative format.
        Convert that data into a clean, semantic HTML <table>.
        
        Text to analyze:
        ${inputText}
        
        Return ONLY a JSON object with:
        - 'detectedFluff' (string): The original dense paragraph you identified.
        - 'htmlTable' (string): The raw HTML code for the table (just the <table> element and its contents, use Tailwind classes like 'w-full text-left text-xs text-zinc-300' for the table, 'bg-zinc-800/50' for thead, and 'p-2' for th/td).
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      if (parsed.detectedFluff && parsed.htmlTable) {
        setResult({
          fluff: parsed.detectedFluff,
          table: parsed.htmlTable
        });
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
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined);
      if (!apiKey) throw new Error("API key is missing");
      
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
        You are an expert Technical SEO and GEO agent.
        Convert the following fact or statement into a highly structured JSON-LD Schema (FAQPage, Organization, or Product, whichever fits best).
        
        Fact/Statement:
        ${factText}
        
        Return ONLY a valid JSON object representing the JSON-LD schema. Do not wrap in markdown blocks.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      setSchemaResult(response.text);
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
  };

  const copyWorker = () => {
    navigator.clipboard.writeText(workerScript);
    setCopiedWorker(true);
    setTimeout(() => setCopiedWorker(false), 2000);
  };

  const copySchema = () => {
    if (schemaResult) {
      navigator.clipboard.writeText(schemaResult);
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 2000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Technical Architecture</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage Edge SEO injection and Semantic HTML restructuring.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edge SEO Generator */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden relative h-fit">
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                  <Server className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white">Edge SEO Worker Generator</h3>
              </div>
            </div>
            <p className="text-sm text-zinc-400">
              Server-side injection ensures that raw HTML scrapers (OAI-SearchBot, PerplexityBot) see your JSON-LD Schema without needing to execute JavaScript. Generate your Cloudflare Worker script below.
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
                  <button 
                    onClick={copyWorker}
                    className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    {copiedWorker ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedWorker ? 'Copied!' : 'Copy Script'}
                  </button>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-xs text-zinc-300 font-mono">
                    {workerScript}
                  </pre>
                </div>
                <div className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                  <p className="text-xs text-indigo-300">
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
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
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
              className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none text-sm"
            />
            
            <button 
              onClick={handleRestructure}
              disabled={isProcessing || !inputText.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
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
                    className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
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
                <button 
                  onClick={copySchema}
                  className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  {copiedSchema ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedSchema ? 'Copied!' : 'Copy Code'}
                </button>
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
