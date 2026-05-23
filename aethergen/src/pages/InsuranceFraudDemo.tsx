import React, { useState } from 'react'
import { Play, Download, Shield, BarChart3 } from 'lucide-react'
import { insurancePlaybooksService, PlaybooksConfig } from '../services/insurancePlaybooksService'
import { insuranceEvaluationService } from '../services/insuranceEvaluationService'
import { KillSwitchGate } from '../components/Guards/KillSwitchGate'
import { platformApi } from '../services/platformApi'

export const InsuranceFraudDemo: React.FC = () => {
  const [totalClaims, setTotalClaims] = useState(5000)
  const [prevalence, setPrevalence] = useState(0.04)
  const [result, setResult] = useState<any>(null)

  const cfg: PlaybooksConfig = {
    totalClaims,
    startDate: '2025-01-01',
    regions: ['NA','EU','APAC'],
    plans: ['A','B','C'],
    upcoding: { prevalence, severity: { min: 1.1, max: 1.5 } },
    unbundling: { prevalence: 0.03 },
    phantomProviders: { prevalence: 0.01, distanceThresholdMi: 50 },
    doctorShopping: { prevalence: 0.02, windowDays: 14, deviceReuse: 0.25 },
    duplicateBilling: { prevalence: 0.015 },
    kickbacks: { prevalence: 0.01 },
  }

  const run = () => {
    const gen = insurancePlaybooksService.generate(cfg)
    const op = insuranceEvaluationService.evaluateAtOP(gen.claims, 0.01)
    const stab = insuranceEvaluationService.segmentStability(gen.claims, 'region')
    const cost = insuranceEvaluationService.costCurve(gen.claims)
    setResult({ claims: gen.claims.slice(0, 5), yaml: gen.yaml, op, stab, cost })

    if (platformApi.isLive()) {
      platformApi.logMlflow({
        summary: {
          ins_op_utility: op.utility,
          ins_op_ci_lo: op.ci[0],
          ins_op_ci_hi: op.ci[1],
          ins_stability_max_delta: stab.maxDelta,
          ins_cost_auc: cost.auc ?? 0
        }
      }).catch(()=>{})
    }
  }

  const exportCSV = () => {
    if (!result) return
    const csv = insurancePlaybooksService.exportCSV(result.claims)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'claims_sample.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <KillSwitchGate tenantId={undefined} requiredFeatures={["synthetic_healthcare_fraud"]}>
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-4 flex items-center"><Shield className="w-6 h-6 mr-2"/>Insurance Fraud Playbooks</h1>
          <p className="text-slate-600 mb-6">Generate parameterized synthetic claims, evaluate at OP, view stability and cost curves, and export data.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Configuration</h3>
              <label className="block text-sm mb-1">Total claims: {totalClaims}</label>
              <input type="range" min={1000} max={50000} step={1000} value={totalClaims} onChange={e=>setTotalClaims(parseInt(e.target.value))} className="w-full"/>
              <label className="block text-sm mt-3 mb-1">Upcoding prevalence: {(prevalence*100).toFixed(1)}%</label>
              <input type="range" min={0} max={0.1} step={0.005} value={prevalence} onChange={e=>setPrevalence(parseFloat(e.target.value))} className="w-full"/>
              <button onClick={run} className="mt-4 px-3 py-2 bg-indigo-600 text-white rounded flex items-center"><Play className="w-4 h-4 mr-2"/>Run</button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center"><BarChart3 className="w-4 h-4 mr-2"/>OP & Stability</h3>
              {result ? (
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>Utility@OP: {result.op.utility.toFixed(3)} [{result.op.ci[0].toFixed(3)}, {result.op.ci[1].toFixed(3)}]</li>
                  <li>Stability max delta (region): {(result.stab.maxDelta*100).toFixed(2)}%</li>
                </ul>
              ) : <p className="text-slate-500">No results</p>}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Export</h3>
              <button onClick={exportCSV} className="px-3 py-2 bg-blue-600 text-white rounded flex items-center"><Download className="w-4 h-4 mr-2"/>CSV (sample)</button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Preview</h3>
            <pre className="text-xs bg-slate-50 p-3 rounded border border-slate-200 overflow-auto">{JSON.stringify(result, null, 2)}</pre>
          </div>
        </div>
      </div>
    </KillSwitchGate>
  )
}

export default InsuranceFraudDemo


