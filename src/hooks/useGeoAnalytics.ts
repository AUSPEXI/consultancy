/**
 * src/hooks/useGeoAnalytics.ts
 * 
 * Custom hook to fetch the data moat metrics for the React UI.
 */

import { useState, useEffect, useCallback } from 'react';

export const useGeoAnalytics = (brandId: string) => {
  const [pulseData, setPulseData] = useState<any[]>([]);
  const [mapPoints, setMapPoints] = useState<any[]>([]);
  const [sentimentTrace, setSentimentTrace] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    if (!brandId) return;
    setLoading(true);
    try {
      const [pulseRes, mapRes, traceRes] = await Promise.all([
        fetch(`/api/analytics/pulse?brandId=${brandId}`),
        fetch(`/api/analytics/map?brandId=${brandId}`),
        fetch(`/api/analytics/sentiment-trace?brandId=${brandId}`)
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
  }, [brandId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { pulseData, mapPoints, sentimentTrace, loading, refetch: fetchAnalytics };
};
