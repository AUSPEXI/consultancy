// Lightweight CPU runner client with graceful fallback to Netlify proxy

export type CpuFeature = { margin?: number; entropy?: number; retrieval?: number };

function getCpuRunnerBase(): string | null {
  // Prefer direct browser-callable URL if provided (e.g., http://localhost:8088)
  const direct = (import.meta as any)?.env?.VITE_CPU_RUNNER_URL as string | undefined;
  if (direct && typeof direct === 'string' && direct.trim()) return direct.trim().replace(/\/$/, '');
  return null;
}

async function postJson<T>(url: string, payload: any): Promise<T> {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`CPU runner request failed: ${res.status} ${res.statusText} ${text}`);
  }
  return res.json() as Promise<T>;
}

export class CpuRunnerService {
  private proxyPath = '/.netlify/functions/cpu-runner-proxy';

  async score(features: CpuFeature[], weights?: { margin?: number; entropy?: number; retrieval?: number }): Promise<number[]> {
    const base = getCpuRunnerBase();
    const url = base ? `${base}/score` : this.proxyPath;
    const body = { op: 'score', features, weights };
    const resp = await postJson<{ scores: number[] }>(url, body);
    return Array.isArray(resp?.scores) ? resp.scores : [];
  }

  async rerank(query: string, docs: string[]): Promise<number[]> {
    const base = getCpuRunnerBase();
    const url = base ? `${base}/rerank` : this.proxyPath;
    const body = { op: 'rerank', query, docs };
    const resp = await postJson<{ order: number[] }>(url, body);
    return Array.isArray(resp?.order) ? resp.order : docs.map((_, i) => i);
  }
}

export const cpuRunner = new CpuRunnerService();


