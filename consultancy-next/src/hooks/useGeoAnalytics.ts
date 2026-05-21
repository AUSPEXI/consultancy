'use client'

/**
 * src/hooks/useGeoAnalytics.ts
 *
 * Custom hook to fetch the data moat metrics for the React UI.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export const useGeoAnalytics = (brandId: string, customPrompts: string[] = [], platform: string = 'All', timeframe: string = 'current', userId?: string) => {
  const [pulseData, setPulseData] = useState<any[]>([]);
  const [mapPoints, setMapPoints] = useState<any[]>([]);
  const [sentimentTrace, setSentimentTrace] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const promptsRef = useRef(customPrompts);

  useEffect(() => {
    promptsRef.current = customPrompts;
  });

  const fetchAnalytics = useCallback(async () => {
    if (!brandId) { setLoading(false); return; }
    setLoading(true);
    try {
      const authParam = userId ? `&userId=${userId}` : '';
      const prompts = promptsRef.current;
      const promptsQuery = prompts.length > 0
        ? `&prompts=${encodeURIComponent(JSON.stringify(prompts))}`
        : '';

      const [pulseRes, mapRes, traceRes] = await Promise.all([
        fetch(`/api/analytics/pulse?brandId=${brandId}${authParam}`),
        fetch(`/api/analytics/map?brandId=${brandId}&platform=${platform}&timeframe=${timeframe}${authParam}`),
        fetch(`/api/analytics/sentiment-trace?brandId=${brandId}${promptsQuery}${authParam}`)
      ]);

      const pulse = await pulseRes.json();
      const map = await mapRes.json();
      const trace = await traceRes.json();

      if (pulse.success) setPulseData(pulse.pulse);
      if (map.success) setMapPoints(map.points);
      if (trace.success) setSentimentTrace(trace.trace);
    } catch (error) {
      console.error("Failed to fetch GEO analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [brandId, platform, timeframe, userId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { pulseData, mapPoints, sentimentTrace, loading, refetch: fetchAnalytics };
};
