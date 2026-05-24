import React, { useState, useEffect, useRef } from 'react'
import { Play, Pause, Download, Shield, Activity, Crosshair } from 'lucide-react'
import { swarmSimulationService, SwarmAgent } from '../services/swarmSimulationService'
import { swarmEvaluationService, SwarmMetrics } from '../services/swarmEvaluationService'
import { platformApi } from '../services/platformApi'

export const SwarmSafetyDemo: React.FC = () => {
  const [running, setRunning] = useState(false)
  const [agents, setAgents] = useState<SwarmAgent[]>([])
  const [prevAgents, setPrevAgents] = useState<SwarmAgent[]>([])
  const [metrics, setMetrics] = useState<SwarmMetrics | null>(null)
  const [agentCount, setAgentCount] = useState(300)
  const [kNeighbors, setKNeighbors] = useState(7)
  const [worldSize, setWorldSize] = useState(200)
  const [separation, setSeparation] = useState(2)
  const [gust, setGust] = useState(0.2)
  const raf = useRef<number | null>(null)

  const cfg = {
    agentCount,
    timestep: 0.1,
    maxSpeed: 2.5,
    neighborhoodK: kNeighbors,
    separationRadius: separation,
    worldSize,
    windGust: gust,
    geofences: [{ center: [0,0,0] as [number,number,number], radius: 12 }],
  }

  useEffect(() => {
    setAgents(swarmSimulationService.initialize(cfg))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loop = () => {
    setPrevAgents(agents)
    const next = swarmSimulationService.step(agents, cfg)
    setAgents(next)
    const m = swarmEvaluationService.compute(prevAgents, next, 10)
    setMetrics(m)
    if (platformApi.isLive() && m) {
      // Log lightweight swarm safety metrics
      platformApi.logMlflow({
        summary: {
          swarm_min_sep: m.minSeparation,
          swarm_sep_breaches: m.minSepBreaches,
          swarm_lcc: m.largestConnectedComponent,
          swarm_energy: m.energyProxy,
          swarm_jerk: m.meanJerk
        }
      }).catch(()=>{})
    }
    raf.current = requestAnimationFrame(loop)
  }

  const start = () => {
    if (running) return
    setRunning(true)
    raf.current = requestAnimationFrame(loop)
  }
  const stop = () => {
    setRunning(false)
    if (raf.current) cancelAnimationFrame(raf.current)
  }

  const exportMetrics = () => {
    const blob = new Blob([JSON.stringify({ config: cfg, metrics }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'swarm_metrics.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-4 flex items-center"><Shield className="w-6 h-6 mr-2"/>Swarm Safety (8D Topology) – Demo</h1>
        <p className="text-slate-600 mb-6">Topological neighbors (k≈7) with safety clamps (min-sep, geofence). Stress with wind; track safety and resilience metrics.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Simulation</h3>
            <label className="block text-sm mb-1">Agents: {agentCount}</label>
            <input type="range" min={50} max={1000} value={agentCount} onChange={e=>setAgentCount(parseInt(e.target.value))} className="w-full"/>
            <label className="block text-sm mt-3 mb-1">k neighbors: {kNeighbors}</label>
            <input type="range" min={3} max={15} value={kNeighbors} onChange={e=>setKNeighbors(parseInt(e.target.value))} className="w-full"/>
            <label className="block text-sm mt-3 mb-1">Separation radius: {separation}</label>
            <input type="range" min={0.5} max={8} step={0.5} value={separation} onChange={e=>setSeparation(parseFloat(e.target.value))} className="w-full"/>
            <label className="block text-sm mt-3 mb-1">Wind gust: {gust.toFixed(2)}</label>
            <input type="range" min={0} max={0.8} step={0.05} value={gust} onChange={e=>setGust(parseFloat(e.target.value))} className="w-full"/>
            <div className="flex gap-3 mt-4">
              {!running ? <button onClick={start} className="px-3 py-2 bg-indigo-600 text-white rounded flex items-center"><Play className="w-4 h-4 mr-2"/>Run</button>
              : <button onClick={stop} className="px-3 py-2 bg-slate-700 text-white rounded flex items-center"><Pause className="w-4 h-4 mr-2"/>Pause</button>}
              <button onClick={exportMetrics} className="px-3 py-2 bg-blue-600 text-white rounded flex items-center"><Download className="w-4 h-4 mr-2"/>Export</button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center"><Activity className="w-4 h-4 mr-2"/>Metrics</h3>
            {metrics ? (
              <ul className="text-sm text-slate-700 space-y-1">
                <li>Min separation: {metrics.minSeparation.toFixed(2)} m</li>
                <li>Separation breaches: {metrics.minSepBreaches}</li>
                <li>LCC fraction: {(metrics.largestConnectedComponent*100).toFixed(1)}%</li>
                <li>Energy proxy: {metrics.energyProxy.toFixed(2)}</li>
                <li>Mean jerk: {metrics.meanJerk.toFixed(3)}</li>
              </ul>
            ) : <p className="text-slate-500">No data yet</p>}
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center"><Crosshair className="w-4 h-4 mr-2"/>Policy</h3>
            <p className="text-sm text-slate-600">Geofence barrier at radius 12 around origin. Increase wind to stress RTA-like overrides.</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Preview (textual)</h3>
          <p className="text-xs text-slate-500">For now we show aggregate state only.</p>
          <pre className="text-xs bg-slate-50 p-3 rounded border border-slate-200 overflow-auto">{JSON.stringify(agents.slice(0, 5), null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}

export default SwarmSafetyDemo


