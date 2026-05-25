'use client';

import { useState, useEffect } from 'react';

export interface GeoDataPayload {
  stats: {
    total_rows: number;
    brands: number;
    engines: number;
    citation_rate: number;
    avg_sov: number;
    drift_count: number;
    trojan_count: number;
  };
  brands: string[];
  sovByBrand: { brand: string; sov: number }[];
  sovTimeSeries: Record<string, any>[];
  citationByEngine: { engine: string; rate: number; total: number }[];
  platformScores: { platform: string; score: number }[];
  platformByBrand: { brand: string; ChatGPT: number; Perplexity: number; Claude: number; Gemini: number }[];
  competitors: { name: string; avg_sov: number; avg_decay: number; decay_status: string; trojan_pct: number }[];
  driftAlerts: { brand: string; ai_engine: string; z_score: number; risk_score: number; sentiment: string; category: string }[];
  sentimentDist: { sentiment: string; count: number; pct: number }[];
  contentScores: { brand: string; content_score: number; entity_density: number; statistical_anchors: number; inverted_pyramid: number; entropy: number }[];
}

let _geoDataCache: GeoDataPayload | null = null;

export function useGeoData() {
  const [data, setData] = useState<GeoDataPayload | null>(_geoDataCache);
  const [loading, setLoading] = useState(!_geoDataCache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (_geoDataCache) return;
    fetch('/api/geo-data')
      .then(r => r.json())
      .then(d => {
        _geoDataCache = d;
        setData(d);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  return { data, loading, error };
}
