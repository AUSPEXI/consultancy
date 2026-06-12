'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code2, Copy, CheckCircle2, RefreshCw, Globe, Zap, Shield } from 'lucide-react';
import { checkTierAccess } from '@/constants/tiers';
import { db } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function SchemaDeployPage() {
  const { user, userData, tier } = useAuth();
  const [copied, setCopied] = useState<string | null>(null);
  const [schemaPreview, setSchemaPreview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => { setOrigin(window.location.origin); }, []);

  const isAdmin = user?.email === 'hopiumcalculator@gmail.com';
  const isReadOnly = !(isAdmin || checkTierAccess(tier, 'Pro'));

  const publicSchemaUrl = user ? `${origin}/api/schema-public/${user.uid}` : '';

  const snippet = `<!-- L8EntSpace Schema Deploy: dynamic structured data from your Fact-Vault -->
<script>
  fetch('${publicSchemaUrl}')
    .then(r => r.json())
    .then(data => {
      var s = document.createElement('script');
      s.type = 'application/ld+json';
      s.text = JSON.stringify(data);
      document.head.appendChild(s);
    })
    .catch(function(){});
</script>`;

  const wordpressSnippet = `// Add to functions.php or a site plugin
add_action('wp_head', function() {
  $url = '${publicSchemaUrl}';
  $response = wp_remote_get($url, ['timeout' => 3]);
  if (!is_wp_error($response)) {
    $data = wp_remote_retrieve_body($response);
    echo '<script type="application/ld+json">' . $data . '</script>';
  }
});`;

  const copy = (text: string, key: string) => {
    if (isReadOnly) return;
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
    // Copying a deploy snippet (JS or WordPress) is the act of deploying — mark
    // the onboarding quest's final step complete. Copying the URL alone doesn't.
    if ((key === 'js' || key === 'wp') && user) {
      updateDoc(doc(db, 'users', user.uid), { schemaDeployed: true }).catch(() => {});
    }
  };

  const loadPreview = async () => {
    if (isReadOnly) return;
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch(publicSchemaUrl);
      const data = await res.json();
      setSchemaPreview(data);
    } catch { } finally { setIsLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {isReadOnly && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-amber-200">
            You&apos;re viewing <strong>read-only mode</strong>. Upgrade to <strong>Pro</strong> to use this feature.
          </p>
          <a href="/#pricing" className="text-[11px] font-bold px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors shrink-0">
            Upgrade
          </a>
        </div>
      )}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Schema Deploy</h1>
        <p className="text-zinc-400">One snippet on your website. Your structured data stays in sync with your Fact-Vault automatically. No developer required after day one.</p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Zap, title: 'Add a fact to your Fact-Vault', desc: 'Any new Cite-Magnet or brand fact you save.' },
          { icon: RefreshCw, title: 'Schema updates within minutes', desc: 'Your public schema API reflects the change immediately.' },
          { icon: Globe, title: 'AI crawlers read it on next visit', desc: 'GPTBot, ClaudeBot, and Google-Extended ingest the updated JSON-LD.' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
            <Icon className="w-5 h-5 text-pink-400 mb-3" />
            <p className="text-sm font-semibold text-white mb-1">{title}</p>
            <p className="text-xs text-zinc-500">{desc}</p>
          </div>
        ))}
      </div>

      {/* Your schema API */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2"><Globe className="w-4 h-4 text-pink-400" /> Your Live Schema API</CardTitle>
          <CardDescription className="text-zinc-400">This URL returns your current JSON-LD structured data, generated from your Fact-Vault and brand profile. Publicly accessible, cached for 5 minutes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <code className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-pink-300 font-mono overflow-x-auto">{publicSchemaUrl}</code>
            <Button variant="outline" size="sm" onClick={() => copy(publicSchemaUrl, 'url')} disabled={isReadOnly} title={isReadOnly ? 'Upgrade to Pro to use this feature' : undefined}>
              {copied === 'url' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={loadPreview} disabled={isReadOnly || isLoading} title={isReadOnly ? 'Upgrade to Pro to use this feature' : undefined}>
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Code2 className="w-4 h-4 mr-2" />}
            Preview Current Schema
          </Button>
          {schemaPreview && (
            <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-300 overflow-x-auto max-h-64 font-mono">
              {JSON.stringify(schemaPreview, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      {/* JavaScript snippet */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2"><Code2 className="w-4 h-4 text-cyan-400" /> JavaScript Snippet</CardTitle>
          <CardDescription className="text-zinc-400">Paste before {'</head>'} on every page. Works on any HTML site, Squarespace, Webflow, Shopify, or custom stack.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-300 overflow-x-auto font-mono leading-relaxed">{snippet}</pre>
            <button
              onClick={() => copy(snippet, 'js')}
              disabled={isReadOnly}
              title={isReadOnly ? 'Upgrade to Pro to use this feature' : undefined}
              className="absolute top-3 right-3 p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {copied === 'js' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* WordPress snippet */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">WordPress / PHP Integration</CardTitle>
          <CardDescription className="text-zinc-400">Add to your theme's functions.php or a site-specific plugin. Server-side fetch with no client-side latency.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-300 overflow-x-auto font-mono leading-relaxed">{wordpressSnippet}</pre>
            <button
              onClick={() => copy(wordpressSnippet, 'wp')}
              disabled={isReadOnly}
              title={isReadOnly ? 'Upgrade to Pro to use this feature' : undefined}
              className="absolute top-3 right-3 p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {copied === 'wp' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* What's included */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2"><Shield className="w-4 h-4 text-purple-400" /> What's in Your Schema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {[
              { type: 'Organization', desc: 'Brand identity, URL, semantic anchors as description' },
              { type: 'ItemList', desc: 'Your top 15 Fact-Vault statements as structured, citable claims' },
              { type: 'Auto-updates', desc: 'Schema reflects Fact-Vault changes within 5 minutes' },
              { type: 'AI crawler headers', desc: 'Correct Content-Type and Cache-Control for GPTBot, ClaudeBot' },
            ].map(({ type, desc }) => (
              <div key={type} className="flex items-start gap-3 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-white text-xs">{type}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          {userData?.brand && (
            <p className="text-xs text-zinc-600 mt-4">Currently generating schema for: <span className="text-zinc-400 font-medium">{userData.brand}</span> · {userData.domain}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
