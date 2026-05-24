// Data types for Finance Suite App
export interface FinanceData {
  id: string;
  timestamp: string;
  location: string;
  event: string;
  credit_score: number;
  transaction_volume: number;
  risk_weight: number;
  source: string;
  suite: string; // Finance suite categorization
  addons: {
    riskAnalysis: boolean;
    fraudDetection: boolean;
    complianceMonitoring: boolean;
    marketAnalysis: boolean;
    portfolioOptimization: boolean;
  };
  raw: any;
}

export interface SimulationData {
  infected: number;
  recovered: number;
  susceptible: number;
  spreadRate: number;
}

export interface NarrativeData {
  text: string;
  confidence: number;
}

// Updated Addons interface for Finance Suite
export interface Addons {
  riskAnalysis?: boolean;
  fraudDetection?: boolean;
  complianceMonitoring?: boolean;
  marketAnalysis?: boolean;
  portfolioOptimization?: boolean;

  // Core Addons (from EnhancedNarrativeCard)
  prediction?: { value?: number };
  profile?: { complexityScore?: number };
  sentiment?: { model?: string };

  // Premium Addons (from EnhancedNarrativeCard)
  network?: { nodes?: number };
  optimization?: { efficiency?: number };
  clustering?: { clusters?: number };
  forecasting?: { trend?: string };
}

export interface ProcessedData {
  id: string;
  timestamp: string;
  location: string;
  narrative: NarrativeData;
  simulation: SimulationData;
  credit_score: number;
  transaction_volume: number;
  risk_weight: number;
  source: string;
  suite: string; // Finance suite categorization
  addons: Addons; // Changed from Addons | null to just Addons
}

// Service response types
export interface FetchResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Status types
export type CollectionStatus = 'idle' | 'collecting' | 'processing' | 'error' | 'success';

// Configuration types
export interface DataSourceConfig {
  name: string;
  url: string;
  type: 'rss' | 'api' | 'static';
  enabled: boolean;
}

// Finance Suite types - 8 finance suites
export type FinanceSuite = 'INSUREAI' | 'SHIELD' | 'CREDRISE' | 'TRADEMARKET' | 'CASHFLOW' | 'CONSUME' | 'TAXGUARD' | 'RISKSHIELD';

export interface SuiteConfig {
  name: FinanceSuite;
  displayName: string;
  description: string;
  primaryEvent: string;
  color: string;
  icon: string;
}