import React, { useEffect, useState } from 'react'
import { heartbeat, checkFeatures, type GuardCheckResult } from '../../services/policyGuardService'
import { useNavigate } from 'react-router-dom'

type Props = { tenantId?: string; requiredFeatures?: string[]; children: React.ReactNode }

export function KillSwitchGate({ tenantId, requiredFeatures = [], children }: Props) {
  const [ok, setOk] = useState<boolean | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    async function run() {
      const hb: GuardCheckResult = await heartbeat(tenantId)
      if (!hb?.ok) {
        if (!cancelled) setOk(false)
        navigate('/safety')
        return
      }
      if (requiredFeatures.length > 0) {
        const res = await checkFeatures(requiredFeatures, tenantId)
        if (!res?.ok) {
          if (!cancelled) setOk(false)
          navigate('/safety')
          return
        }
      }
      if (!cancelled) setOk(true)
    }
    run()
    const id = setInterval(run, 60_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [tenantId, requiredFeatures.join('|')])

  if (ok === null) return <div className="p-8 text-center">Checking policy…</div>
  if (ok === false) return null
  return <>{children}</>
}


