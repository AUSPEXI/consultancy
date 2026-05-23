import React, { useEffect, useState } from 'react';

type Listing = {
  id: string;
  name: string;
  provider: string;
  category: string;
  badges?: string[];
  pricing?: { unit: string; minMonthly?: number };
  evidence?: { accuracy?: number; privacy?: number; latencyMs?: number };
};

const MarketplaceHome: React.FC = () => {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/.netlify/functions/marketplace-listings');
        if (!res.ok) throw new Error(String(res.status));
        const j = await res.json();
        if (mounted) setItems(j.items || []);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Marketplace (Preview)</h3>
          <a href="/.netlify/functions/marketplace-onboard" className="text-sm text-blue-700 underline">Provider Onboarding</a>
        </div>
        <p className="text-sm text-gray-700 mt-1">Feature-flagged. Disable by unsetting VITE_FEATURE_MARKETPLACE.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        {loading ? (
          <div>Loading…</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((it) => (
              <div key={it.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold text-gray-900">{it.name}</div>
                  <span className="text-xs text-gray-600">{it.category}</span>
                </div>
                <div className="text-sm text-gray-700">by {it.provider}</div>
                {it.badges && it.badges.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {it.badges.map((b) => (
                      <span key={b} className="text-xs px-2 py-0.5 bg-gray-100 rounded border">{b}</span>
                    ))}
                  </div>
                )}
                {it.evidence && (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-700">
                    <div>Acc {Math.round((it.evidence.accuracy || 0) * 100)}%</div>
                    <div>Priv {Math.round((it.evidence.privacy || 0) * 100)}%</div>
                    <div>p95 {it.evidence.latencyMs || 0}ms</div>
                  </div>
                )}
                {it.pricing && (
                  <div className="mt-3 text-sm text-gray-900">
                    {it.pricing.unit}{it.pricing.minMonthly ? ` • min £${it.pricing.minMonthly}/mo` : ''}
                  </div>
                )}
                <div className="mt-3">
                  <a href={`/.netlify/functions/marketplace-listings?id=${encodeURIComponent(it.id)}`} className="text-sm text-blue-700 underline">View details</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplaceHome;


