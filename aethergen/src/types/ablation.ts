export type AblationPrivacy = {
  epsilon?: number;
  synthetic_ratio?: number;
};

export type AblationTraining = {
  moe?: { experts?: number; top_k?: number };
  precision?: 'FP32' | 'FP16' | 'BF16' | 'INT8' | 'FP8';
  modelFilter?: string[]; // run only these model names
};

export type AblationModules = {
  enable?: string[];
  disable?: string[];
};

export type AblationEntry = {
  name: string;
  description?: string;
  modules?: AblationModules;
  training?: AblationTraining;
  privacy?: AblationPrivacy;
  repeats?: number;
  adaptation?: AdaptationConfig;
};

export type AblationRecipe = {
  version?: string; // e.g., '1.0'
  dataset?: string; // optional logical name/path
  schema_hash?: string; // optional for auditability
  repeats?: number; // default repeats per ablation
  cleaning?: CleaningSection; // optional cleaning config applied pre/post
  adaptation?: AdaptationConfig; // default adaptation settings for this recipe
  ablations: AblationEntry[];
  metrics?: string[]; // names of metrics to highlight
};

export type AblationRunResult = {
  ablationName: string;
  repeatIndex: number;
  modelName: string;
  metrics: Record<string, number>;
  experimentalFlags?: string[];
};

// Cleaning types (co-located to avoid a new import for now)
export type CleaningSection = {
  seed?: CleaningConfig;
  synthetic?: CleaningConfig;
  triadGuided?: boolean;
};

// Adaptation types
export type AdaptationMode = 'black-box' | 'grey-box' | 'white-box';

export type AdaptationTools = {
  name: string;
  endpoint: string;
  description?: string;
};

export type AdaptationRAG = {
  sources?: Array<{ kind: 'url' | 'file' | 'table'; ref: string }>;
  embedModel?: string;
  top_k?: number;
};

export type AdaptationPrompts = {
  system?: string;
  task?: string;
  few_shots?: Array<{ input: string; output?: string }>;
  variables?: Record<string, string>;
  recursion?: RecursionPolicy;
};

export type AdaptationPEFT = {
  method: 'LoRA' | 'IA3' | 'BitFit';
  r?: number;
  alpha?: number;
  target_modules?: string[];
  epochs?: number;
  lr?: number;
  batch?: number;
};

export type AdaptationConfig = {
  mode: AdaptationMode;
  tools?: AdaptationTools[];
  rag?: AdaptationRAG;
  prompts?: AdaptationPrompts;
  peft?: AdaptationPEFT;
};

// Recursive prompt policy and evaluation checks
export type RecursionPolicy = {
  maxDepth?: number; // default 3
  maxAttempts?: number; // default 3
  baseCase?: EvaluationCheck[]; // if all pass → stop
  trigger?: EvaluationCheck[]; // if any pass → apply rewrite
  revertOn?: EvaluationCheck[]; // if any pass → revert/backtrack
  unravel?: { simplifyToCore?: boolean };
  renest?: { lines?: number };
};

export type EvaluationCheck = {
  metric: 'wordCount' | 'accuracy' | 'privacyScore' | 'utilityScore' | 'custom';
  op: '>' | '>=' | '<' | '<=' | '==' | '!=';
  value: number;
  onPass?: 'continue' | 'stop' | 'rewrite' | 'unravel' | 'revert';
};

export type CleaningConfig = {
  enforceSchema?: boolean;
  dedupe?: boolean;
  missing?: {
    strategy: 'leave' | 'drop-row' | 'impute-mean' | 'impute-median' | 'impute-mode';
  };
  outliers?: {
    method: 'iqr' | 'zscore' | 'none';
    k?: number; // IQR multiplier or z threshold
  };
  pii?: {
    redact?: boolean;
    hash?: boolean;
  };
  text?: {
    trim?: boolean;
    normalizeWhitespace?: boolean;
    lowercase?: boolean;
  };
  dates?: {
    iso8601?: boolean;
  };
};


