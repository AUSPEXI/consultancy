/**
 * L8ENTSPACE Output Validation Engine
 * 
 * Validates all LLM responses against strict schemas
 * Auto-retries with reduced temperature if validation fails
 * Prevents hallucinations and guarantees data integrity
 */

import { z } from 'zod';

/**
 * SOV Metrics Schema
 * Ensures audit responses are valid and within acceptable ranges
 */
export const SOVMetricsSchema = z.object({
  aSov: z
    .number()
    .min(0, 'A-SOV cannot be negative')
    .max(100, 'A-SOV cannot exceed 100%'),
  err: z
    .number()
    .min(0, 'Entity Recall Rate cannot be negative')
    .max(100, 'Entity Recall Rate cannot exceed 100%'),
  compA: z
    .number()
    .min(0, 'Competitor A share cannot be negative')
    .max(100, 'Competitor A share cannot exceed 100%'),
  compB: z
    .number()
    .min(0, 'Competitor B share cannot be negative')
    .max(100, 'Competitor B share cannot exceed 100%')
    .optional(),
  compC: z.number().min(0).max(100).optional(),
  compD: z.number().min(0).max(100).optional(),
  compGap: z
    .number()
    .min(-100, 'Gap cannot be less than -100')
    .max(100, 'Gap cannot exceed 100'),
  aiTraffic: z
    .number()
    .min(0, 'AI traffic cannot be negative')
    .int('AI traffic must be an integer'),
  aiCitations: z.number().min(0).int().optional(),
  entityRecall: z.number().min(0).max(100).optional(),
  platforms: z.object({
    chatgpt: z.number().min(0).max(100),
    perplexity: z.number().min(0).max(100),
    claude: z.number().min(0).max(100),
    gemini: z.number().min(0).max(100),
  }),
  radar: z
    .array(
      z.object({
        subject: z.string().min(1),
        brandScore: z.number().min(0).max(100),
        compScore: z.number().min(0).max(100),
      })
    )
    .optional(),
  sentiment: z
    .array(
      z.object({
        prompt: z.string().min(1),
        score: z.number().min(-100).max(100),
      })
    )
    .optional(),
  topUrls: z
    .array(
      z.object({
        path: z.string().min(1),
        citations: z.number().min(0).int(),
      })
    )
    .optional(),
});

export type SOVMetrics = z.infer<typeof SOVMetricsSchema>;

/**
 * Content Scorer Response Schema
 */
export const ContentScorerSchema = z.object({
  overallScore: z
    .number()
    .min(0, 'Score cannot be negative')
    .max(100, 'Score cannot exceed 100'),
  entityDensityScore: z.number().min(0).max(100),
  statisticalAnchorsScore: z.number().min(0).max(100),
  invertedPyramidScore: z.number().min(0).max(100),
  feedback: z
    .array(z.string().min(1))
    .min(1, 'Must provide at least one feedback item')
    .max(5, 'Maximum 5 feedback items'),
  rewrittenSnippet: z.string().min(10, 'Rewritten snippet must be at least 10 characters'),
});

export type ContentScorerResult = z.infer<typeof ContentScorerSchema>;

/**
 * Fact Extraction Schema
 */
export const FactExtractionSchema = z
  .array(
    z.object({
      statement: z
        .string()
        .min(5, 'Fact statement must be at least 5 characters')
        .max(500, 'Fact statement must not exceed 500 characters'),
      entropyScore: z
        .number()
        .min(0, 'Entropy score cannot be negative')
        .max(100, 'Entropy score cannot exceed 100'),
    })
  )
  .min(1, 'Must extract at least one fact')
  .max(10, 'Cannot extract more than 10 facts at a time');

export type FactExtraction = z.infer<typeof FactExtractionSchema>;

/**
 * Brand Monitor Schema
 */
export const BrandMonitorSchema = z.object({
  overallSentiment: z.enum(['Positive', 'Neutral', 'Negative']),
  riskScore: z
    .number()
    .min(0, 'Risk score cannot be negative')
    .max(100, 'Risk score cannot exceed 100'),
  threads: z
    .array(
      z.object({
        title: z.string().min(1),
        url: z.string().url('Invalid URL'),
        sentiment: z.enum(['Positive', 'Neutral', 'Negative']),
        summary: z.string().min(1),
      })
    )
    .optional(),
  actionPlan: z.string().min(10, 'Action plan must be at least 10 characters'),
});

export type BrandMonitorResult = z.infer<typeof BrandMonitorSchema>;

/**
 * Simulator Schema
 */
export const SimulatorSchema = z.object({
  chatgpt: z.object({
    response: z.string().min(1),
    mentionedBrand: z.boolean(),
  }),
  claude: z.object({
    response: z.string().min(1),
    mentionedBrand: z.boolean(),
  }),
  gemini: z.object({
    response: z.string().min(1),
    mentionedBrand: z.boolean(),
  }),
  perplexity: z.object({
    response: z.string().min(1),
    mentionedBrand: z.boolean(),
  }),
  sovScore: z
    .number()
    .min(0, 'SOV score cannot be negative')
    .max(100, 'SOV score cannot exceed 100'),
});

export type SimulatorResult = z.infer<typeof SimulatorSchema>;

/**
 * Amplify Schema
 */
export const AmplifySchema = z.object({
  linkedin: z.string().min(10),
  reddit: z.string().min(10),
  twitter: z.string().min(10),
  youtube: z.string().min(10),
  tiktok: z.string().min(10),
  instagram: z.string().min(10),
});

export type AmplifyResult = z.infer<typeof AmplifySchema>;

/**
 * Anchors Schema
 * AnchorObjectSchema is lenient for backwards-compat with saved anchors (axisAlignment optional).
 * AnchorsTEOSchema is strict for new generation: enforces the 2-2-2-1 TEO contract.
 */
const AnchorObjectSchema = z.object({
  label: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{3}$|^#[0-9a-fA-F]{6}$|rgba?\(.*\)/, 'Invalid color format'),
  baseType: z.string().min(1),
  axisAlignment: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  description: z.string().max(200).optional(),
});

export const AnchorsSchema = z.union([
  z.array(AnchorObjectSchema),
  z.object({
    anchors: z.array(AnchorObjectSchema)
  })
]).transform((val) => {
  if (Array.isArray(val)) return val;
  return val.anchors;
});

export type AnchorsResult = z.infer<typeof AnchorsSchema>;

const AnchorTEOObjectSchema = z.object({
  label: z.string().min(1).max(40),
  color: z.enum(['#ff1493', '#06b6d4', '#8b5cf6', '#f59e0b']),
  baseType: z.enum(['Systemic Anchor', 'Signal Point', 'Emergent Trend', 'Risk Vector']),
  axisAlignment: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  description: z.string().max(200),
});

export const AnchorsTEOSchema = z.array(AnchorTEOObjectSchema)
  .length(7)
  .refine(a => a.filter(x => x.baseType === 'Systemic Anchor').length === 2, 'Must have exactly 2 Systemic Anchors (Ontological)')
  .refine(a => a.filter(x => x.baseType === 'Signal Point').length === 2, 'Must have exactly 2 Signal Points (Epistemological)')
  .refine(a => a.filter(x => x.baseType === 'Emergent Trend').length === 2, 'Must have exactly 2 Emergent Trends (Teleological)')
  .refine(a => a.filter(x => x.baseType === 'Risk Vector').length === 1, 'Must have exactly 1 Risk Vector');

export type AnchorsTEOResult = z.infer<typeof AnchorsTEOSchema>;

export const CompetitorSuggestSchema = z.object({
  competitors: z.array(z.string().min(1)).min(1).max(6),
});

export type CompetitorSuggestResult = z.infer<typeof CompetitorSuggestSchema>;

/**
 * Schema Validation Result
 */
export interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  errors?: z.ZodError['errors'];
  shouldRetry: boolean;
}

/**
 * Validate and parse LLM output
 * Returns validation result with retry recommendation
 */
export function validateOutput<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): ValidationResult<T> {
  try {
    const parsed = schema.parse(input);
    return {
      valid: true,
      data: parsed,
      shouldRetry: false,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors,
        shouldRetry: true, // Always retry on validation failure
      };
    }

    // Unknown error
    return {
      valid: false,
      errors: [{ code: 'unknown_error', path: [], message: String(error) }] as any,
      shouldRetry: false,
    };
  }
}

/**
 * Format validation errors for logging
 */
export function formatValidationErrors(errors: z.ZodError['errors']): string {
  return errors
    .map((err) => {
      const path = err.path.join('.');
      return `${path || 'root'}: ${err.message}`;
    })
    .join('\n');
}

/**
 * Sanity checks for specific metrics
 */
export function performSanityChecks(data: SOVMetrics): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // A-SOV should not be significantly higher than individual platform scores
  const platformScores = [
    data.platforms.chatgpt,
    data.platforms.claude,
    data.platforms.gemini,
    data.platforms.perplexity,
  ];
  const avgPlatformScore = platformScores.reduce((a, b) => a + b, 0) / platformScores.length;

  if (data.aSov > avgPlatformScore + 30) {
    issues.push(
      `A-SOV (${data.aSov}%) is significantly higher than average platform score (${Math.round(avgPlatformScore)}%). Possible hallucination.`
    );
  }

  // Competitor gap should be reasonable
  if (data.compGap < -80 || data.compGap > 80) {
    issues.push(
      `Competitor gap (${data.compGap}%) seems extreme. Verify LLM accuracy.`
    );
  }

  // Sum of radar scores should be balanced
  if (data.radar && data.radar.length > 0) {
    const avgBrandScore = data.radar.reduce((sum, r) => sum + r.brandScore, 0) / data.radar.length;
    const avgCompScore = data.radar.reduce((sum, r) => sum + r.compScore, 0) / data.radar.length;

    if (Math.abs(avgBrandScore - data.aSov) > 25) {
      issues.push(
        `Average radar brand score (${Math.round(avgBrandScore)}%) differs significantly from A-SOV (${data.aSov}%). Inconsistency detected.`
      );
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Estimate if hallucination is likely based on output patterns
 */
export function detectLikelyHallucination(data: SOVMetrics): boolean {
  // If all metrics are suspiciously round numbers, likely hallucinated
  const metrics = [data.aSov, data.err, data.compA, data.compGap];
  const roundCount = metrics.filter((m) => m % 10 === 0).length;

  if (roundCount === metrics.length) {
    return true;
  }

  // If platform scores are identical, likely hallucinated
  const platformScores = [
    data.platforms.chatgpt,
    data.platforms.claude,
    data.platforms.gemini,
    data.platforms.perplexity,
  ];
  const uniqueScores = new Set(platformScores);

  if (uniqueScores.size === 1) {
    return true;
  }

  return false;
}

/**
 * Create a retry-friendly prompt modification
 * Used when LLM output fails validation
 */
export function createRetryPrompt(originalPrompt: string, errors: string | string[]): string {
  const errorSummary = Array.isArray(errors) ? errors.join('\n').substring(0, 300) : errors.substring(0, 300);
  return `${originalPrompt}\n\nIMPORTANT: Your previous response had these issues:\n${errorSummary}\n\nPlease generate a corrected response that strictly adheres to the requested JSON format and specified schema requirements.`;
}
