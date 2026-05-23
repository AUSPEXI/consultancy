export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'categorical';

export interface SchemaField {
  name: string;
  type: FieldType;
  required?: boolean;
  categories?: string[]; // for categorical fields
  min?: number;
  max?: number;
}

export interface SeedSchema {
  domain: string;
  fields: SchemaField[];
}

export interface PreflightIssue {
  field?: string;
  message: string;
}

export interface PreflightReport {
  pass: boolean;
  errors: PreflightIssue[];
  warnings: PreflightIssue[];
  metrics: Record<string, number | string>;
  suggestions: string[];
  suggestedSchema?: SeedSchema;
}

export const getAutomotiveSeedSchema = (): SeedSchema => ({
  domain: 'automotive',
  fields: [
    { name: 'vin', type: 'string', required: true },
    { name: 'plant', type: 'categorical', categories: ['OXF', 'SND', 'MTY', 'STU'], required: true },
    { name: 'model', type: 'categorical', categories: ['Sedan', 'SUV', 'Hatch', 'Truck'] },
    { name: 'trim', type: 'categorical', categories: ['Base', 'Sport', 'Premium'] },
    { name: 'engine_type', type: 'categorical', categories: ['ICE', 'Hybrid', 'BEV'] },
    { name: 'production_date', type: 'date', required: true },
    { name: 'shift', type: 'categorical', categories: ['A', 'B', 'C'] },
    { name: 'operator_id', type: 'string' },
    { name: 'torque_nm', type: 'number', min: 80, max: 450 },
    { name: 'qc_score', type: 'number', min: 0, max: 100 },
    { name: 'test_pass', type: 'boolean' },
    { name: 'defects_count', type: 'number', min: 0, max: 7 },
    { name: 'defect_type', type: 'categorical', categories: ['none', 'paint', 'sensor', 'wiring', 'seal', 'panel'] },
    { name: 'warranty_claim', type: 'boolean' },
    { name: 'supplier_code', type: 'categorical', categories: ['SUP001', 'SUP002', 'SUP003', 'SUP004'] },
    { name: 'batch_id', type: 'string' }
  ]
});

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number, dp = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(dp));

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const randomDateWithinDays = (daysBack: number) => {
  const now = Date.now();
  const past = now - randomInt(0, daysBack) * 24 * 60 * 60 * 1000;
  return new Date(past).toISOString().slice(0, 10);
};

const randomVin = () => `AUS-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${randomInt(100000, 999999)}`;
const randomOperator = () => `OP${randomInt(1000, 9999)}`;
const randomBatch = () => `BATCH-${randomInt(10000, 99999)}`;

export function generateSeedRecords(schema: SeedSchema, count: number): any[] {
  const rows: any[] = [];
  for (let i = 0; i < count; i++) {
    const r: any = {};
    for (const f of schema.fields) {
      switch (f.type) {
        case 'string':
          if (f.name === 'vin') r[f.name] = randomVin();
          else if (f.name === 'operator_id') r[f.name] = randomOperator();
          else if (f.name === 'batch_id') r[f.name] = randomBatch();
          else r[f.name] = `${f.name}_${i}_${Math.random().toString(36).slice(2, 6)}`;
          break;
        case 'number':
          r[f.name] = f.min !== undefined && f.max !== undefined ? randomFloat(f.min, f.max, f.name === 'qc_score' ? 1 : 2) : randomFloat(0, 100);
          break;
        case 'boolean':
          r[f.name] = Math.random() > 0.5;
          break;
        case 'date':
          r[f.name] = randomDateWithinDays(365);
          break;
        case 'categorical':
          r[f.name] = f.categories && f.categories.length ? pick(f.categories) : null;
          break;
      }
    }
    // derive consistency: if defects_count > 0 then test_pass may be false more often
    if (typeof r['defects_count'] === 'number') {
      const failBias = r['defects_count'] > 0 ? 0.3 + Math.min(0.4, r['defects_count'] * 0.05) : 0.05;
      r['test_pass'] = Math.random() > failBias;
      r['defect_type'] = r['defects_count'] > 0 ? r['defect_type'] : 'none';
    }
    // warranty claims correlate with failures and low qc
    if (typeof r['qc_score'] === 'number') {
      const risk = (100 - r['qc_score']) / 100 + (r['test_pass'] ? 0 : 0.2);
      r['warranty_claim'] = Math.random() < Math.min(0.6, risk);
    }
    rows.push(r);
  }
  return rows;
}

export function* generateInChunks(schema: SeedSchema, total: number, chunkSize = 50000): Generator<any[], void, unknown> {
  let generated = 0;
  while (generated < total) {
    const size = Math.min(chunkSize, total - generated);
    yield generateSeedRecords(schema, size);
    generated += size;
  }
}

function hasField(schema: SeedSchema, name: string): boolean {
  return schema.fields.some(f => f.name === name);
}

export function preflightSchema(schema: SeedSchema): PreflightReport {
  const errors: PreflightIssue[] = [];
  const warnings: PreflightIssue[] = [];
  const suggestions: string[] = [];

  // Basic field sanity
  const seen = new Set<string>();
  for (const f of schema.fields) {
    if (!f.name || !f.type) {
      errors.push({ field: f.name, message: 'Field must have a name and type' });
    }
    if (seen.has(f.name)) {
      errors.push({ field: f.name, message: 'Duplicate field name' });
    }
    seen.add(f.name);
    if (f.type === 'categorical') {
      if (!f.categories || f.categories.length === 0) {
        errors.push({ field: f.name, message: 'Categorical field requires non-empty categories' });
      }
    }
    if (f.type === 'number') {
      if (f.min !== undefined && f.max !== undefined) {
        if (f.min >= f.max) errors.push({ field: f.name, message: 'Numeric min must be less than max' });
        if (f.max - f.min > 1_000_000_000) warnings.push({ field: f.name, message: 'Numeric range is extremely wide' });
      } else {
        warnings.push({ field: f.name, message: 'Numeric field has no min/max; using default [0,100]' });
      }
    }
  }

  // Domain recommendations
  if (schema.domain === 'automotive') {
    const recommended = ['vin','plant','production_date','qc_score','test_pass','defects_count'];
    for (const r of recommended) {
      if (!hasField(schema, r)) {
        warnings.push({ field: r, message: 'Recommended field missing for automotive' });
        suggestions.push(`Add recommended field '${r}' to improve downstream quality checks.`);
      }
    }
  }

  // Probe generation for quick metrics
  const probe = generateSeedRecords(schema, 200);
  const metrics: Record<string, number | string> = {};
  if (probe.length > 0) {
    // VIN uniqueness metric
    if (hasField(schema, 'vin')) {
      const vins = probe.map(r => r['vin']).filter(Boolean);
      const unique = new Set(vins).size;
      const uniqRatio = vins.length ? unique / vins.length : 0;
      metrics['vin_unique_ratio'] = parseFloat(uniqRatio.toFixed(2));
      if (uniqRatio < 0.9) warnings.push({ field: 'vin', message: 'VIN uniqueness ratio below 0.9' });
    }
    // Missingness per field
    for (const f of schema.fields) {
      const miss = probe.reduce((acc, r) => (r[f.name] === null || r[f.name] === undefined) ? acc + 1 : acc, 0);
      const rate = miss / probe.length;
      if (f.required && rate > 0) errors.push({ field: f.name, message: 'Required field has missing values in probe' });
      if (!f.required && rate > 0.3) warnings.push({ field: f.name, message: 'High missingness (>30%) in probe' });
    }
    // Coherence checks
    if (hasField(schema,'defects_count') && hasField(schema,'test_pass')) {
      const failWhenDefects = probe.filter(r => r['defects_count'] > 0 && r['test_pass'] === false).length;
      const totalDefects = probe.filter(r => r['defects_count'] > 0).length;
      const failRate = totalDefects ? failWhenDefects / totalDefects : 0;
      metrics['fail_rate_when_defects'] = parseFloat(failRate.toFixed(2));
      if (failRate < 0.2) warnings.push({ field: 'test_pass', message: 'Low failure rate when defects > 0 (may be unrealistic)' });
    }
  }

  // Suggested schema clone with minimal adds
  let suggestedSchema: SeedSchema | undefined = undefined;
  if (suggestions.length) {
    const next: SeedSchema = { domain: schema.domain, fields: [...schema.fields] };
    if (schema.domain === 'automotive') {
      if (!hasField(next, 'vin')) next.fields.push({ name: 'vin', type: 'string', required: true });
      if (!hasField(next, 'production_date')) next.fields.push({ name: 'production_date', type: 'date', required: true });
      if (!hasField(next, 'qc_score')) next.fields.push({ name: 'qc_score', type: 'number', min: 0, max: 100 });
      if (!hasField(next, 'test_pass')) next.fields.push({ name: 'test_pass', type: 'boolean' });
      if (!hasField(next, 'defects_count')) next.fields.push({ name: 'defects_count', type: 'number', min: 0, max: 7 });
      if (!hasField(next, 'defect_type')) next.fields.push({ name: 'defect_type', type: 'categorical', categories: ['none','paint','sensor','wiring','seal','panel'] });
    }
    suggestedSchema = next;
  }

  return {
    pass: errors.length === 0,
    errors,
    warnings,
    metrics,
    suggestions,
    suggestedSchema
  };
}

export function remixSchema(schema: SeedSchema): SeedSchema {
  const report = preflightSchema(schema);
  return report.suggestedSchema || schema;
}


