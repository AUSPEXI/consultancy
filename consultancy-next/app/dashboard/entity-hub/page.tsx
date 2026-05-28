'use client'

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, Sparkles, Loader2, Copy, CheckCircle2, ExternalLink, AlertCircle, Building2, BookOpen, Link2 } from 'lucide-react';
import { checkTierAccess } from '@/constants/tiers';
import { logAuditAction } from '@/lib/audit';

const ENTITY_PLATFORMS = [
  { name: 'Wikidata', url: 'https://www.wikidata.org/wiki/Special:NewItem', desc: 'The master knowledge graph that feeds Wikipedia, Google, and most LLMs.', impact: 'Very High', color: 'text-emerald-400', badge: 'bg-emerald-500/10 border-emerald-500/20' },
  { name: 'Google Knowledge Panel', url: 'https://support.google.com/business/answer/9798848', desc: 'Claim and verify your brand\'s Knowledge Panel to anchor your entity across Google products.', impact: 'Very High', color: 'text-blue-400', badge: 'bg-blue-500/10 border-blue-500/20' },
  { name: 'Crunchbase', url: 'https://www.crunchbase.com/add-company', desc: 'Tech company entity authority — indexed by most LLMs and business intelligence platforms.', impact: 'High', color: 'text-orange-400', badge: 'bg-orange-500/10 border-orange-500/20' },
  { name: 'LinkedIn Company Page', url: 'https://www.linkedin.com/company/setup/new/', desc: 'Professional authority signal, consistently indexed by Claude, Gemini, and Perplexity.', impact: 'High', color: 'text-blue-300', badge: 'bg-blue-500/10 border-blue-500/20' },
  { name: 'Companies House (UK)', url: 'https://www.gov.uk/file-your-confirmation-statement-with-companies-house', desc: 'Official UK company registration — one of the highest-trust entity signals for UK brands.', impact: 'High', color: 'text-pink-400', badge: 'bg-pink-500/10 border-pink-500/20' },
  { name: 'schema.org sameAs', url: 'https://schema.org/sameAs', desc: 'Cross-link all your entity profiles using the sameAs property in your Organisation schema. Use Schema Deploy to automate this.', impact: 'Medium', color: 'text-purple-400', badge: 'bg-purple-500/10 border-purple-500/20' },
  { name: 'Open Corporates', url: 'https://opencorporates.com/', desc: 'Global company registry used by financial and legal AI systems as entity anchor.', impact: 'Medium', color: 'text-cyan-400', badge: 'bg-cyan-500/10 border-cyan-500/20' },
  { name: 'Google Business Profile', url: 'https://business.google.com/', desc: 'Local entity anchor — even for non-local brands, this triggers Knowledge Panel eligibility.', impact: 'Medium', color: 'text-yellow-400', badge: 'bg-yellow-500/10 border-yellow-500/20' },
];

interface EntityProfile {
  wikidataDescription: string;
  shortDescription: string;
  instanceOf: string;
  industry: string;
  country: string;
  keyStatements: string[];
  knowledgePanelTriggers: string[];
  sameAsUrls: string[];
}

export default function EntityHubPage() {
  const { user, userData, tier } = useAuth();
  const [profile, setProfile] = useState<EntityProfile | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  const isAdmin = user?.email === 'hopiumcalculator@gmail.com';
  const hasAccess = isAdmin || checkTierAccess(tier, 'Premium');

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const generateProfile = async () => {
    if (!user || !userData?.brand) return;
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/entity-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          brand: userData.brand,
          domain: userData.domain,
          keywords: userData.keywords,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setProfile(data.profile);
      await logAuditAction(user.uid, 'Generated Entity Profile', { brand: userData.brand });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium">Entity Hub requires Premium tier</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Entity Intelligence Hub</h1>
          <p className="text-zinc-400 max-w-2xl">AI models can only cite what they know exists as a discrete entity. Most brands are invisible at the entity layer — not missing citations, missing <em>existence</em>. Fix that here.</p>
        </div>
        {!userData?.brand && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs">
            <AlertCircle className="w-4 h-4" />
            Set your brand in Settings first
          </div>
        )}
      </div>

      {/* Why entity establishment matters */}
      <div className="bg-gradient-to-br from-purple-900/10 to-pink-900/10 border border-purple-500/20 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <BookOpen className="w-5 h-5 text-purple-400 mb-2" />
            <p className="font-semibold text-white mb-1">Ontological Foundation</p>
            <p className="text-zinc-400">Your brand's Ontological anchor — what it fundamentally IS in AI minds — must exist as a structured entity before any other GEO work can compound.</p>
          </div>
          <div>
            <Link2 className="w-5 h-5 text-cyan-400 mb-2" />
            <p className="font-semibold text-white mb-1">Entity Disambiguation</p>
            <p className="text-zinc-400">When your brand appears in multiple authoritative sources with consistent sameAs links, AI models resolve citations to you with high confidence — not to a competitor with a similar name.</p>
          </div>
          <div>
            <Globe className="w-5 h-5 text-emerald-400 mb-2" />
            <p className="font-semibold text-white mb-1">Permanent Compounding</p>
            <p className="text-zinc-400">Entity establishment is a one-time action with permanent benefit. Every model trained on a knowledge graph that includes your entity gets it for free — forever.</p>
          </div>
        </div>
      </div>

      {/* Entity profile generator */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" /> Entity Profile Generator
              </CardTitle>
              <CardDescription className="text-zinc-400 mt-1">
                Generates your complete entity profile — Wikidata description, Knowledge Panel triggers, key statements, and sameAs links — ready to copy and submit.
              </CardDescription>
            </div>
            <Button
              onClick={generateProfile}
              disabled={isGenerating || !userData?.brand}
              className="bg-purple-600 hover:bg-purple-700 text-white shrink-0 ml-4"
            >
              {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate Profile</>}
            </Button>
          </div>
        </CardHeader>
        {error && (
          <CardContent>
            <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">{error}</p>
          </CardContent>
        )}
        {profile && (
          <CardContent className="space-y-5">
            {/* Core identity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { label: 'Instance Of', value: profile.instanceOf },
                { label: 'Industry', value: profile.industry },
                { label: 'Country', value: profile.country },
              ].map(({ label, value }) => (
                <div key={label} className="bg-zinc-950 border border-zinc-800 rounded-xl p-3">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-sm text-white font-medium">{value}</p>
                </div>
              ))}
            </div>

            {/* Wikidata description */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Wikidata Description</p>
                <button onClick={() => copy(profile.wikidataDescription, 'wikidata')} className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors">
                  {copied === 'wikidata' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-500" />}
                </button>
              </div>
              <p className="text-sm text-zinc-300">{profile.wikidataDescription}</p>
              <p className="text-[10px] text-zinc-600 mt-2">Short tagline: <span className="text-zinc-400">{profile.shortDescription}</span></p>
            </div>

            {/* Key statements */}
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Key Statements for Knowledge Graph</p>
              <div className="space-y-2">
                {profile.keyStatements.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 bg-zinc-950 border border-zinc-800 rounded-xl p-3">
                    <span className="text-xs font-black text-pink-500/40 font-mono mt-0.5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                    <p className="text-sm text-zinc-300 leading-relaxed">{s}</p>
                    <button onClick={() => copy(s, `stmt-${i}`)} className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors shrink-0">
                      {copied === `stmt-${i}` ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-600" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Knowledge Panel triggers */}
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Knowledge Panel Triggers</p>
              <div className="flex flex-wrap gap-2">
                {profile.knowledgePanelTriggers.map((t, i) => (
                  <span key={i} className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300 font-medium">{t}</span>
                ))}
              </div>
            </div>

            {/* sameAs URLs */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">sameAs Links for Schema</p>
                <button
                  onClick={() => copy(JSON.stringify(profile.sameAsUrls, null, 2), 'sameas')}
                  className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
                >
                  {copied === 'sameas' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  Copy all
                </button>
              </div>
              <div className="space-y-1.5">
                {profile.sameAsUrls.map((url, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-zinc-400 font-mono bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2">
                    <Link2 className="w-3 h-3 text-zinc-600 shrink-0" />
                    {url}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Submission checklist */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Entity Establishment Checklist</CardTitle>
          <CardDescription className="text-zinc-400">Submit your entity to each platform. Tick as you complete. Higher-impact platforms first.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {ENTITY_PLATFORMS.map(({ name, url, desc, impact, color, badge }) => (
            <div
              key={name}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${checklist[name] ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-950'}`}
            >
              <button
                onClick={() => setChecklist(prev => ({ ...prev, [name]: !prev[name] }))}
                className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all ${checklist[name] ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600 hover:border-zinc-400'}`}
              >
                {checklist[name] && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-semibold text-sm ${checklist[name] ? 'text-zinc-500 line-through' : 'text-white'}`}>{name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge} ${color}`}>{impact}</span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
              </div>
              <a href={url} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-zinc-800 rounded-lg transition-colors shrink-0">
                <ExternalLink className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300" />
              </a>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
