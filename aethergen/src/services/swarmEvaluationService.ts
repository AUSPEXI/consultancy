import type { SwarmAgent } from './swarmSimulationService'

export type SwarmMetrics = {
  minSeparation: number
  minSepBreaches: number
  largestConnectedComponent: number
  energyProxy: number
  meanJerk: number
}

export class SwarmEvaluationService {
  compute(prev: SwarmAgent[], curr: SwarmAgent[], commRadius: number): SwarmMetrics {
    const n = curr.length || 1
    // Min separation and breaches
    let minSep = Infinity
    let breaches = 0
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const d = this.dist(curr[i], curr[j])
        if (d < minSep) minSep = d
        if (d < 1.0) breaches++
      }
    }
    // LCC via BFS
    const adj: number[][] = Array.from({ length: n }, () => [])
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (this.dist(curr[i], curr[j]) <= commRadius) {
          adj[i].push(j); adj[j].push(i)
        }
      }
    }
    const lcc = this.largestComponent(adj) / n
    // Energy proxy (sum of speed^2) and jerk
    let energy = 0
    let jerkSum = 0
    for (let i = 0; i < n; i++) {
      const v = curr[i].velocity
      energy += v[0]*v[0] + v[1]*v[1] + v[2]*v[2]
      const dv = prev.length === n ? [
        curr[i].velocity[0] - prev[i].velocity[0],
        curr[i].velocity[1] - prev[i].velocity[1],
        curr[i].velocity[2] - prev[i].velocity[2],
      ] : [0,0,0]
      jerkSum += Math.hypot(dv[0], dv[1], dv[2])
    }
    return {
      minSeparation: isFinite(minSep) ? minSep : 0,
      minSepBreaches: breaches,
      largestConnectedComponent: lcc,
      energyProxy: energy / n,
      meanJerk: jerkSum / n,
    }
  }

  private dist(a: SwarmAgent, b: SwarmAgent): number {
    const dx = a.position[0] - b.position[0]
    const dy = a.position[1] - b.position[1]
    const dz = a.position[2] - b.position[2]
    return Math.hypot(dx, dy, dz)
  }

  private largestComponent(adj: number[][]): number {
    const n = adj.length
    const vis = new Array(n).fill(false)
    let best = 0
    for (let i = 0; i < n; i++) {
      if (vis[i]) continue
      let size = 0
      const q = [i]
      vis[i] = true
      while (q.length) {
        const u = q.shift()!
        size++
        for (const v of adj[u]) if (!vis[v]) { vis[v] = true; q.push(v) }
      }
      if (size > best) best = size
    }
    return best
  }
}

export const swarmEvaluationService = new SwarmEvaluationService()


