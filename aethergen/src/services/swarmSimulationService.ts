export type SwarmAgent = {
  id: number
  position: [number, number, number]
  velocity: [number, number, number]
  health: number
  link: number
}

export type SwarmConfig = {
  agentCount: number
  timestep: number
  maxSpeed: number
  neighborhoodK: number
  separationRadius: number
  worldSize: number
  windGust: number
  geofences: Array<{ center: [number, number, number]; radius: number }>
}

export class SwarmSimulationService {
  initialize(config: SwarmConfig): SwarmAgent[] {
    const agents: SwarmAgent[] = []
    for (let i = 0; i < config.agentCount; i++) {
      agents.push({
        id: i,
        position: [
          (Math.random() - 0.5) * config.worldSize,
          (Math.random() - 0.5) * config.worldSize,
          (Math.random() - 0.5) * config.worldSize,
        ],
        velocity: [0, 0, 0],
        health: 1.0,
        link: 1.0,
      })
    }
    return agents
  }

  step(agents: SwarmAgent[], config: SwarmConfig): SwarmAgent[] {
    const k = Math.max(1, config.neighborhoodK | 0)
    const next: SwarmAgent[] = []
    for (const a of agents) {
      const neighbors = this.topologicalNeighbors(a, agents, k)
      const steer = this.computeBoidsSteer(a, neighbors, config)
      let vx = a.velocity[0] + steer[0]
      let vy = a.velocity[1] + steer[1]
      let vz = a.velocity[2] + steer[2]
      ;[vx, vy, vz] = this.applyWind([vx, vy, vz], config.windGust)
      ;[vx, vy, vz] = this.clampSpeed([vx, vy, vz], config.maxSpeed)
      let px = a.position[0] + vx * config.timestep
      let py = a.position[1] + vy * config.timestep
      let pz = a.position[2] + vz * config.timestep
      ;[px, py, pz] = this.reflectWorld([px, py, pz], config.worldSize)
      ;[vx, vy, vz] = this.applyCBFMinSeparation([px, py, pz], [vx, vy, vz], neighbors, config.separationRadius)
      ;[vx, vy, vz] = this.applyGeofenceBarrier([px, py, pz], [vx, vy, vz], config.geofences)
      next.push({ id: a.id, position: [px, py, pz], velocity: [vx, vy, vz], health: a.health, link: a.link })
    }
    return next
  }

  private distance(a: SwarmAgent, b: SwarmAgent): number {
    const dx = a.position[0] - b.position[0]
    const dy = a.position[1] - b.position[1]
    const dz = a.position[2] - b.position[2]
    return Math.hypot(dx, dy, dz)
  }

  private topologicalNeighbors(a: SwarmAgent, agents: SwarmAgent[], k: number): SwarmAgent[] {
    const sorted = agents
      .filter(b => b.id !== a.id)
      .map(b => ({ b, d: this.distance(a, b) }))
      .sort((u, v) => u.d - v.d)
    return sorted.slice(0, k).map(x => x.b)
  }

  private computeBoidsSteer(a: SwarmAgent, neighbors: SwarmAgent[], c: SwarmConfig): [number, number, number] {
    if (neighbors.length === 0) return [0, 0, 0]
    let cx = 0, cy = 0, cz = 0
    let ax = 0, ay = 0, az = 0
    let sx = 0, sy = 0, sz = 0
    for (const n of neighbors) {
      cx += n.position[0]; cy += n.position[1]; cz += n.position[2]
      ax += n.velocity[0]; ay += n.velocity[1]; az += n.velocity[2]
      const dx = a.position[0] - n.position[0]
      const dy = a.position[1] - n.position[1]
      const dz = a.position[2] - n.position[2]
      const d = Math.hypot(dx, dy, dz) || 1
      if (d < c.separationRadius) { sx += dx / d; sy += dy / d; sz += dz / d }
    }
    const inv = 1 / neighbors.length
    cx = cx * inv - a.position[0]
    cy = cy * inv - a.position[1]
    cz = cz * inv - a.position[2]
    ax = ax * inv - a.velocity[0]
    ay = ay * inv - a.velocity[1]
    az = az * inv - a.velocity[2]
    // weights: cohesion 0.01, alignment 0.05, separation 0.1
    return [0.01 * cx + 0.05 * ax + 0.1 * sx, 0.01 * cy + 0.05 * ay + 0.1 * sy, 0.01 * cz + 0.05 * az + 0.1 * sz]
  }

  private clampSpeed(v: [number, number, number], max: number): [number, number, number] {
    const s = Math.hypot(v[0], v[1], v[2])
    if (s <= max || s === 0) return v
    const f = max / s
    return [v[0] * f, v[1] * f, v[2] * f]
  }

  private reflectWorld(p: [number, number, number], size: number): [number, number, number] {
    const half = size * 0.5
    return [
      Math.max(-half, Math.min(half, p[0])),
      Math.max(-half, Math.min(half, p[1])),
      Math.max(-half, Math.min(half, p[2])),
    ]
  }

  private applyWind(v: [number, number, number], gust: number): [number, number, number] {
    if (!gust) return v
    return [v[0] + (Math.random() - 0.5) * gust, v[1] + (Math.random() - 0.5) * gust, v[2] + (Math.random() - 0.5) * gust]
  }

  // CBF-style min-separation clamp (heuristic)
  private applyCBFMinSeparation(p: [number, number, number], v: [number, number, number], neighbors: SwarmAgent[], rMin: number): [number, number, number] {
    let rx = 0, ry = 0, rz = 0
    for (const n of neighbors) {
      const dx = p[0] - n.position[0]
      const dy = p[1] - n.position[1]
      const dz = p[2] - n.position[2]
      const d = Math.hypot(dx, dy, dz) || 1
      if (d < rMin) { const s = (rMin - d) / rMin; rx += dx / d * s; ry += dy / d * s; rz += dz / d * s }
    }
    return [v[0] + rx, v[1] + ry, v[2] + rz]
  }

  private applyGeofenceBarrier(p: [number, number, number], v: [number, number, number], fences: Array<{ center: [number, number, number]; radius: number }>): [number, number, number] {
    if (!fences || fences.length === 0) return v
    let bx = 0, by = 0, bz = 0
    for (const f of fences) {
      const dx = p[0] - f.center[0]
      const dy = p[1] - f.center[1]
      const dz = p[2] - f.center[2]
      const d = Math.hypot(dx, dy, dz) || 1
      if (d < f.radius) { const s = (f.radius - d) / f.radius; bx += dx / d * s; by += dy / d * s; bz += dz / d * s }
    }
    return [v[0] + bx, v[1] + by, v[2] + bz]
  }
}

export const swarmSimulationService = new SwarmSimulationService()


