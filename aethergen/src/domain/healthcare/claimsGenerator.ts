import { FraudGenerationConfig, HealthcareClaim, FraudType } from './claimsSchema';

const STATES = ['CA','NY','TX','FL','IL','PA','OH','GA','NC','MI','AZ','VA','WA','MA','TN','IN','MO','MD','WI'];
const SPECIALTIES = ['Internal Medicine','Cardiology','Orthopedics','Dermatology','Pediatrics','Radiology','General Surgery','Emergency'];
const POS = ['Office','Outpatient','Inpatient','ER','Telehealth'];
const GENDERS: Array<'M'|'F'|'O'> = ['M','F','O'];

function seededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s & 0xfffffff) / 0x10000000;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function normal(rng: () => number, mean: number, std: number): number {
  // Box–Muller transform
  const u1 = Math.max(rng(), 1e-9);
  const u2 = Math.max(rng(), 1e-9);
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z0 * std;
}

function makeId(prefix: string, rng: () => number): string {
  return `${prefix}_${Math.floor(rng()*1e9).toString(36)}`;
}

function generateCodes(rng: () => number, base: string, n: number): string[] {
  return Array.from({ length: n }, () => `${base}${Math.floor(100+rng()*900)}`);
}

function fraudPattern(
  rng: () => number,
  claim: Omit<HealthcareClaim, 'fraud_flag' | 'fraud_type'>
): { fraud: boolean; type: FraudType; adjusted: Partial<HealthcareClaim> } {
  // Decide if fraudulent based on signals and base rate
  // We will return patterns that nudge features toward typical fraud signatures
  const r = rng();
  if (r < 0.2) {
    // Upcoding: submitted >> allowed, atypical code mix
    return {
      fraud: true,
      type: 'upcoding',
      adjusted: {
        submitted_amount: claim.submitted_amount * (1.6 + rng()*0.6),
        procedure_codes: [...claim.procedure_codes, `CPT${Math.floor(90000 + rng()*9000)}`]
      }
    };
  }
  if (r < 0.4) {
    // Unbundling: mutually exclusive CPT pairs
    return {
      fraud: true,
      type: 'unbundling',
      adjusted: {
        procedure_codes: [...claim.procedure_codes, 'CPT11010','CPT11011']
      }
    };
  }
  if (r < 0.6) {
    // Phantom billing: high volume, low notes
    return {
      fraud: true,
      type: 'phantom_billing',
      adjusted: {
        provider_claim_volume_30d: claim.provider_claim_volume_30d * (1.7 + rng()*0.5),
        narrative: 'Routine visit billed'
      }
    };
  }
  if (r < 0.8) {
    // Duplicate: similar claim within short window (simulate via lag days small)
    return {
      fraud: true,
      type: 'duplicate',
      adjusted: {
        claim_lag_days: Math.max(0, Math.round(normal(rng, 1, 1)))
      }
    };
  }
  return { fraud: true, type: 'other', adjusted: {} };
}

export function generateHealthcareClaims(count: number, cfg: FraudGenerationConfig = {}): HealthcareClaim[] {
  const fraudRate = cfg.fraud_rate ?? 0.03; // default 3%
  const rng = seededRandom(cfg.seed ?? 42);
  const claims: HealthcareClaim[] = [];

  for (let i = 0; i < count; i++) {
    const date = new Date(Date.now() - Math.floor(rng()*365) * 86400000);
    const submitted = Math.max(50, normal(rng, 800, 350));
    const allowed = Math.max(40, submitted * (0.6 + rng()*0.3));
    const paid = Math.max(0, allowed * (0.7 + rng()*0.25));

    const base: Omit<HealthcareClaim, 'fraud_flag' | 'fraud_type'> = {
      claim_id: makeId('clm', rng),
      member_id: makeId('mbr', rng),
      provider_id: makeId('prv', rng),
      claim_date: date.toISOString().substring(0,10),
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      submitted_amount: Math.round(submitted*100)/100,
      allowed_amount: Math.round(allowed*100)/100,
      paid_amount: Math.round(paid*100)/100,
      coinsurance: Math.round((paid*0.1 + rng()*20)*100)/100,
      copay: Math.round((10 + rng()*40)*100)/100,
      deductible_remaining: Math.round((rng()*1000)*100)/100,
      procedure_codes: generateCodes(rng, 'CPT', 1 + Math.floor(rng()*3)),
      diagnosis_codes: generateCodes(rng, 'DX', 1 + Math.floor(rng()*2)),
      place_of_service: pick(rng, POS),
      provider_specialty: pick(rng, SPECIALTIES),
      network_status: rng() < 0.8 ? 'in' : 'out',
      claim_lag_days: Math.max(0, Math.round(normal(rng, 12, 6))),
      prior_authorization_flag: rng() < 0.7,
      referral_flag: rng() < 0.4,
      out_of_state_flag: rng() < 0.1,
      utilization_90d: Math.max(0, Math.round(normal(rng, 3, 2))),
      utilization_365d: Math.max(0, Math.round(normal(rng, 10, 6))),
      provider_claim_volume_30d: Math.max(1, Math.round(normal(rng, 60, 30))),
      geo_state: pick(rng, STATES),
      geo_zip3: `${Math.floor(100 + rng()*900)}`,
      member_age: Math.min(90, Math.max(0, Math.round(normal(rng, 44, 18)))),
      member_gender: pick(rng, GENDERS),
      narrative: 'Routine consultation'
    };

    // Decide fraud
    const isFraud = rng() < fraudRate;
    if (isFraud) {
      const f = fraudPattern(rng, base);
      const claim: HealthcareClaim = { ...base, ...f.adjusted, fraud_flag: true, fraud_type: f.type } as HealthcareClaim;
      claims.push(claim);
    } else {
      claims.push({ ...base, fraud_flag: false, fraud_type: null });
    }
  }

  return claims;
}


