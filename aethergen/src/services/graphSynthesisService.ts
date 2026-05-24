// Synthetic financial graph generator with parameterized typologies

export type Prng = () => number

function createPrng(seed: number): Prng {
  // xorshift32
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return ((s >>> 0) % 1000000) / 1000000
  }
}

export interface GraphNode {
  id: string
  type: 'customer' | 'account' | 'card' | 'merchant' | 'device' | 'ip' | 'branch'
  attrs: Record<string, string | number | boolean>
}

export interface GraphEdge {
  id: string
  src: string
  dst: string
  type: 'payment' | 'transfer' | 'authorization'
  ts: number
  amount: number
  attrs: Record<string, string | number | boolean>
}

export interface SyntheticGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
  meta: {
    seed: number
    scenario: string
    generated_at: string
  }
  logs: Array<{ category: string; message: string; data?: any }>
}

export interface TypologyConfig {
  structuring?: { window_hours: number; threshold: number }
  mule_ring?: { size: number; reuse: number }
  card_testing?: { burst: number; cooldown_minutes: number }
  sanctions_evasion?: { path_len_min: number; path_len_max: number }
  first_party_abuse?: { collusion_rate: number }
}

export interface GraphSynthesisConfig {
  seed?: number
  nodes: {
    customers: number
    accounts: number
    merchants: number
  }
  seasonality?: { weekly: boolean; monthly: boolean }
  typologies?: TypologyConfig
}

export class GraphSynthesisService {
  private prng: Prng

  constructor(seed: number) {
    this.prng = createPrng(seed)
  }

  public generate(config: GraphSynthesisConfig): SyntheticGraph {
    const logs: SyntheticGraph['logs'] = []
    const nodes: GraphNode[] = []
    const edges: GraphEdge[] = []
    const now = Date.now()

    // Create basic nodes
    const id = (p: string, i: number) => `${p}_${i}`
    for (let i = 0; i < config.nodes.customers; i++) {
      nodes.push({ id: id('cust', i), type: 'customer', attrs: { tenure_y: this.randRange(0, 10), kyc_tier: this.pick(['low', 'med', 'high']) } })
    }
    for (let i = 0; i < config.nodes.accounts; i++) {
      const cust = this.pickNode(nodes, 'customer')
      nodes.push({ id: id('acct', i), type: 'account', attrs: { customer_id: cust.id, risk_band: this.pick(['low','medium','high']) } })
    }
    for (let i = 0; i < config.nodes.merchants; i++) {
      nodes.push({ id: id('mrc', i), type: 'merchant', attrs: { mcc: this.pick(['5411','5732','5999','5814']), region: this.pick(['NA','EU','APAC']) } })
    }

    // Generate baseline transactions
    const accounts = nodes.filter(n => n.type === 'account')
    const merchants = nodes.filter(n => n.type === 'merchant')
    const totalBase = Math.min(5000, accounts.length * 5)
    for (let i = 0; i < totalBase; i++) {
      const a = this.pick(accounts)
      const m = this.pick(merchants)
      edges.push(this.makeEdge(`tx_${i}`, a.id, m.id, now, this.sampleAmount(), { mcc: m.attrs.mcc as string }))
    }

    // Apply typologies
    const t = config.typologies || {}
    if (t.structuring) this.applyStructuring(edges, accounts, merchants, now, t.structuring, logs)
    if (t.mule_ring) this.applyMuleRing(edges, accounts, merchants, now, t.mule_ring, logs)
    if (t.card_testing) this.applyCardTesting(edges, accounts, merchants, now, t.card_testing, logs)
    if (t.sanctions_evasion) this.applySanctionsEvasion(edges, accounts, merchants, now, t.sanctions_evasion, logs)
    if (t.first_party_abuse) this.applyFirstPartyAbuse(edges, accounts, merchants, now, t.first_party_abuse, logs)

    return {
      nodes,
      edges,
      meta: { seed: (this.prng as any).seed ?? 0, scenario: 'financial_crime_lab', generated_at: new Date().toISOString() },
      logs
    }
  }

  private makeEdge(id: string, src: string, dst: string, now: number, amount: number, attrs: Record<string, any>): GraphEdge {
    return { id, src, dst, type: 'payment', ts: now - Math.floor(this.prng()*30*24*3600*1000), amount, attrs }
  }

  private randRange(min: number, max: number): number {
    return min + (max - min) * this.prng()
  }
  private pick<T>(arr: T[]): T { return arr[Math.floor(this.prng()*arr.length)] }
  private pickNode(nodes: GraphNode[], type: GraphNode['type']): GraphNode { return this.pick(nodes.filter(n => n.type === type)) }
  private sampleAmount(): number { return Math.round(Math.exp(2 + this.prng()*2) * 100) / 100 }

  private applyStructuring(edges: GraphEdge[], accounts: GraphNode[], merchants: GraphNode[], now: number, cfg: NonNullable<TypologyConfig['structuring']>, logs: SyntheticGraph['logs']) {
    const m = this.pick(merchants)
    const windowMs = cfg.window_hours * 3600 * 1000
    const baseTs = now - windowMs
    for (let i = 0; i < 60; i++) {
      const a = this.pick(accounts)
      const ts = baseTs + Math.floor(this.prng()*windowMs)
      const amt = Math.max(cfg.threshold - 1, 1)
      edges.push({ id: `struct_${i}`, src: a.id, dst: m.id, type: 'payment', ts, amount: amt, attrs: { typology: 'structuring' } })
    }
    logs.push({ category: 'typology', message: 'structuring_injected', data: cfg })
  }

  private applyMuleRing(edges: GraphEdge[], accounts: GraphNode[], merchants: GraphNode[], now: number, cfg: NonNullable<TypologyConfig['mule_ring']>, logs: SyntheticGraph['logs']) {
    const ring: GraphNode[] = []
    for (let i = 0; i < cfg.size; i++) ring.push(this.pick(accounts))
    const m = this.pick(merchants)
    for (let i = 0; i < cfg.size; i++) {
      const src = ring[i]
      const dst = m
      const reuseHit = this.prng() < cfg.reuse
      edges.push({ id: `mule_${i}`, src: src.id, dst: dst.id, type: 'payment', ts: now - i*60000, amount: this.sampleAmount(), attrs: { typology: 'mule_ring', device_reuse: reuseHit } })
    }
    logs.push({ category: 'typology', message: 'mule_ring_injected', data: cfg })
  }

  private applyCardTesting(edges: GraphEdge[], accounts: GraphNode[], merchants: GraphNode[], now: number, cfg: NonNullable<TypologyConfig['card_testing']>, logs: SyntheticGraph['logs']) {
    const a = this.pick(accounts)
    const mccs = ['5411','5732','5722','7995','5999']
    for (let i = 0; i < cfg.burst; i++) {
      const m = this.pick(merchants)
      edges.push({ id: `ct_${i}`, src: a.id, dst: m.id, type: 'authorization', ts: now - i*15000, amount: 1 + Math.round(this.prng()*3), attrs: { typology: 'card_testing', mcc: this.pick(mccs) } })
    }
    logs.push({ category: 'typology', message: 'card_testing_injected', data: cfg })
  }

  private applySanctionsEvasion(edges: GraphEdge[], accounts: GraphNode[], merchants: GraphNode[], now: number, cfg: NonNullable<TypologyConfig['sanctions_evasion']>, logs: SyntheticGraph['logs']) {
    const len = Math.floor(this.randRange(cfg.path_len_min, cfg.path_len_max+1))
    const path: GraphNode[] = []
    for (let i = 0; i < len; i++) path.push(this.pick(accounts))
    for (let i = 0; i < len-1; i++) {
      edges.push({ id: `san_${i}`, src: path[i].id, dst: path[i+1].id, type: 'transfer', ts: now - (len-i)*3600*1000, amount: this.sampleAmount(), attrs: { typology: 'sanctions_evasion' } })
    }
    logs.push({ category: 'typology', message: 'sanctions_evasion_injected', data: cfg })
  }

  private applyFirstPartyAbuse(edges: GraphEdge[], accounts: GraphNode[], merchants: GraphNode[], now: number, cfg: NonNullable<TypologyConfig['first_party_abuse']>, logs: SyntheticGraph['logs']) {
    const m = this.pick(merchants)
    for (let i = 0; i < 30; i++) {
      const a = this.pick(accounts)
      const abuse = this.prng() < cfg.collusion_rate
      edges.push({ id: `fpa_${i}`, src: a.id, dst: m.id, type: 'payment', ts: now - i*7200000, amount: this.sampleAmount(), attrs: { typology: 'first_party_abuse', collusion: abuse } })
    }
    logs.push({ category: 'typology', message: 'first_party_abuse_injected', data: cfg })
  }
}

export function exportNodesCsv(graph: SyntheticGraph): string {
  const header = ['id','type','attrs_json']
  const rows = graph.nodes.map(n => [n.id, n.type, JSON.stringify(n.attrs)].join(','))
  return [header.join(','), ...rows].join('\n')
}

export function exportEdgesCsv(graph: SyntheticGraph): string {
  const header = ['id','src','dst','type','ts','amount','attrs_json']
  const rows = graph.edges.map(e => [e.id, e.src, e.dst, e.type, String(e.ts), String(e.amount), JSON.stringify(e.attrs)].join(','))
  return [header.join(','), ...rows].join('\n')
}

export function createGraph(seed: number, config: GraphSynthesisConfig): SyntheticGraph {
  const svc = new GraphSynthesisService(seed)
  return svc.generate(config)
}


