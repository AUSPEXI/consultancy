export type FraudType = 'upcoding' | 'unbundling' | 'phantom_billing' | 'duplicate' | 'kickback' | 'other' | null;

export interface HealthcareClaim {
  claim_id: string;
  member_id: string;
  provider_id: string;
  claim_date: string; // ISO date
  year: number;
  month: number;
  submitted_amount: number;
  allowed_amount: number;
  paid_amount: number;
  coinsurance: number;
  copay: number;
  deductible_remaining: number;
  procedure_codes: string[];
  diagnosis_codes: string[];
  place_of_service: string;
  provider_specialty: string;
  network_status: 'in' | 'out';
  claim_lag_days: number;
  prior_authorization_flag: boolean;
  referral_flag: boolean;
  out_of_state_flag: boolean;
  utilization_90d: number;
  utilization_365d: number;
  provider_claim_volume_30d: number;
  geo_state: string;
  geo_zip3: string;
  member_age: number;
  member_gender: 'M' | 'F' | 'O';
  narrative: string;
  fraud_flag: boolean;
  fraud_type: FraudType;
}

export interface FraudGenerationConfig {
  fraud_rate?: number; // target base prevalence, default 0.03
  seed?: number;
}


