let trialKey: string | null = null

export function initSDKTrial(key: string) {
  trialKey = String(key || '').trim()
}

export function isTrialActive(): boolean {
  const envKey = (import.meta as any).env?.VITE_SDK_TRIAL_KEY || ''
  const key = trialKey || envKey
  if (!key) return false
  // Simple format check; adjust later when issuing keys
  return /^trial_[a-zA-Z0-9]{6,}$/.test(String(key))
}

export function withTrialGuard<T extends (...args: any[]) => any>(fn: T, featureName: string): T {
  const guarded = ((...args: any[]) => {
    if (!isTrialActive()) {
      const msg = `[Aethergen SDK] Trial key missing or invalid. Feature: ${featureName}`
      if ((import.meta as any).env?.MODE !== 'production') {
        console.warn(msg)
      } else {
        throw new Error(msg)
      }
    }
    return fn(...args)
  }) as T
  return guarded
}


