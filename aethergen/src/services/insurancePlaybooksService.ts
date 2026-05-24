export type Claim = {
  id: string
  patientId: string
  providerId: string
  date: string
  cpt: string
  amount: number
  region: string
  plan: string
  flags: string[]
}

export type PlaybookParams = {
  prevalence: number
  severity?: { min: number; max: number }
  coOccurrence?: Record<string, number>
  windowDays?: number
  distanceThresholdMi?: number
  deviceReuse?: number
}

export type PlaybooksConfig = {
  totalClaims: number
  startDate: string
  regions: string[]
  plans: string[]
  upcoding: PlaybookParams
  unbundling: PlaybookParams
  phantomProviders: PlaybookParams
  doctorShopping: PlaybookParams
  duplicateBilling: PlaybookParams
  kickbacks: PlaybookParams
}

function randChoice<T>(arr: T[]): T { return arr[Math.floor(Math.random()*arr.length)] }
function randFloat(min: number, max: number) { return min + Math.random()*(max-min) }
function randInt(min: number, max: number) { return Math.floor(randFloat(min, max+1)) }

export class InsurancePlaybooksService {
  generate(config: PlaybooksConfig): { claims: Claim[]; yaml: string } {
    const claims: Claim[] = []
    const start = new Date(config.startDate)
    const specialties = ['cardiology','orthopedics','general','derm']
    const cpts = ['99213','99214','85025','36415','93000','71046']

    for (let i = 0; i < config.totalClaims; i++) {
      const d = new Date(start.getTime() + randInt(0, 60)*24*3600*1000)
      const baseAmount = randFloat(50, 400)
      const claim: Claim = {
        id: `clm_${i}`,
        patientId: `pt_${randInt(1, 5000)}`,
        providerId: `pr_${randInt(1, 1200)}`,
        date: d.toISOString().slice(0,10),
        cpt: randChoice(cpts),
        amount: baseAmount,
        region: randChoice(config.regions),
        plan: randChoice(config.plans),
        flags: []
      }
      claims.push(claim)
    }

    // Apply typologies with prevalence and parameters
    this.applyUpcoding(claims, config.upcoding)
    this.applyUnbundling(claims, config.unbundling)
    this.applyPhantomProviders(claims, config.phantomProviders)
    this.applyDoctorShopping(claims, config.doctorShopping)
    this.applyDuplicateBilling(claims, config.duplicateBilling)
    this.applyKickbacks(claims, config.kickbacks)

    const yaml = this.toYaml(config)
    return { claims, yaml }
  }

  exportCSV(claims: Claim[]): string {
    const header = ['id','patientId','providerId','date','cpt','amount','region','plan','flags']
    const lines = [header.join(',')]
    for (const c of claims) {
      lines.push([c.id,c.patientId,c.providerId,c.date,c.cpt,c.amount.toFixed(2),c.region,c.plan,`"${c.flags.join('|')}"`].join(','))
    }
    return lines.join('\n')
  }

  private applyUpcoding(claims: Claim[], p: PlaybookParams) {
    for (const c of claims) if (Math.random() < (p.prevalence||0)) {
      const factor = p.severity ? randFloat(p.severity.min, p.severity.max) : randFloat(1.1, 1.5)
      c.amount *= factor
      c.flags.push('upcoding')
    }
  }
  private applyUnbundling(claims: Claim[], p: PlaybookParams) {
    for (const c of claims) if (Math.random() < (p.prevalence||0)) {
      c.flags.push('unbundling')
    }
  }
  private applyPhantomProviders(claims: Claim[], p: PlaybookParams) {
    for (const c of claims) if (Math.random() < (p.prevalence||0)) {
      c.flags.push('phantom_provider')
    }
  }
  private applyDoctorShopping(claims: Claim[], p: PlaybookParams) {
    const windowDays = p.windowDays || 14
    const index: Record<string, Claim[]> = {}
    for (const c of claims) (index[c.patientId] ||= []).push(c)
    for (const arr of Object.values(index)) {
      arr.sort((a,b)=> a.date.localeCompare(b.date))
      for (let i = 1; i < arr.length; i++) {
        const d1 = new Date(arr[i-1].date).getTime()
        const d2 = new Date(arr[i].date).getTime()
        const days = (d2-d1)/86400000
        if (days <= windowDays && Math.random() < (p.prevalence||0)) arr[i].flags.push('doctor_shopping')
      }
    }
  }
  private applyDuplicateBilling(claims: Claim[], p: PlaybookParams) {
    for (let i = 0; i < claims.length; i++) if (Math.random() < (p.prevalence||0)) {
      claims[i].flags.push('duplicate_billing')
    }
  }
  private applyKickbacks(claims: Claim[], p: PlaybookParams) {
    for (const c of claims) if (Math.random() < (p.prevalence||0)) {
      c.flags.push('kickback_ring')
    }
  }

  private toYaml(cfg: PlaybooksConfig): string {
    return [
      'playbooks:',
      `  upcoding: { prevalence: ${cfg.upcoding.prevalence}, factor: { min: ${cfg.upcoding.severity?.min ?? 1.1}, max: ${cfg.upcoding.severity?.max ?? 1.5} } }`,
      `  unbundling: { prevalence: ${cfg.unbundling.prevalence} }`,
      `  phantom_providers: { prevalence: ${cfg.phantomProviders.prevalence}, distance_threshold_mi: ${cfg.phantomProviders.distanceThresholdMi ?? 50} }`,
      `  doctor_shopping: { prevalence: ${cfg.doctorShopping.prevalence}, window_days: ${cfg.doctorShopping.windowDays ?? 14}, device_reuse: ${cfg.doctorShopping.deviceReuse ?? 0.25} }`,
      `  duplicate_billing: { prevalence: ${cfg.duplicateBilling.prevalence} }`,
      `  kickbacks: { prevalence: ${cfg.kickbacks.prevalence} }`,
    ].join('\n')
  }
}

export const insurancePlaybooksService = new InsurancePlaybooksService()
