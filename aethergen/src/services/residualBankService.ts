export type ResidualSignal = {
  modelId: string
  segment?: string
  timestamp: number
  margin?: number
  entropy?: number
  retrieval?: number
  correct?: boolean
}

// Storage slot name for local residual signals (no secrets)
const STORAGE_SLOT = 'aeg_residual_bank_v1'

export class ResidualBankService {
  readAll(): ResidualSignal[] {
    try { return JSON.parse(localStorage.getItem(STORAGE_SLOT) || '[]') } catch { return [] }
  }
  append(signals: ResidualSignal | ResidualSignal[]) {
    const arr = Array.isArray(signals) ? signals : [signals]
    const cur = this.readAll()
    const next = cur.concat(arr).slice(-5000) // cap local size
    localStorage.setItem(STORAGE_SLOT, JSON.stringify(next))
  }
  clear() { localStorage.removeItem(STORAGE_SLOT) }

  // simple DP-friendly summaries
  summarizeBySegment(): Record<string, { n: number; margin_p50?: number; entropy_p50?: number; retrieval_p50?: number; error_rate?: number }> {
    const data = this.readAll()
    const groups: Record<string, ResidualSignal[]> = {}
    for (const r of data) {
      const k = r.segment || 'global'
      if (!groups[k]) groups[k] = []
      groups[k].push(r)
    }
    const out: Record<string, any> = {}
    const q = (arr: number[], p: number) => {
      if (arr.length === 0) return undefined
      const a = arr.slice().sort((a,b)=>a-b)
      const idx = Math.max(0, Math.min(a.length-1, Math.floor(p*(a.length-1))))
      return a[idx]
    }
    for (const [seg, arr] of Object.entries(groups)) {
      const margins = arr.map(x=>x.margin!).filter(Number.isFinite)
      const ents = arr.map(x=>x.entropy!).filter(Number.isFinite)
      const rets = arr.map(x=>x.retrieval!).filter(Number.isFinite)
      const acc = arr.filter(x=>x.correct!==undefined)
      out[seg] = {
        n: arr.length,
        margin_p50: q(margins, 0.5),
        entropy_p50: q(ents, 0.5),
        retrieval_p50: q(rets, 0.5),
        error_rate: acc.length ? (acc.filter(x=>!x.correct).length/acc.length) : undefined
      }
    }
    return out
  }
}

export const residualBank = new ResidualBankService()


