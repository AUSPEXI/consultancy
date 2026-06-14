/**
 * L8ENTSPACE Grade-and-Revise Loop
 *
 * A provider-agnostic implementation of the "Outcomes" pattern: a generator
 * produces an artifact, a *blind* grader scores it against an explicit rubric
 * (which the generator never sees), and the grader's feedback drives revisions
 * until the artifact passes the threshold or the iteration budget runs out.
 *
 * The separation matters: the generator is told only the distilled feedback,
 * never the rubric itself, so it cannot "teach to the test" and inflate its own
 * score. This mirrors the stateless-grader design in Anthropic's Managed Agents
 * Outcomes feature, but runs entirely on our existing LLM orchestrator so it
 * stays multi-provider and incurs no new platform dependency.
 *
 * The core loop (`runGradeReviseLoop`) takes injected `generate`/`grade`
 * functions and performs no I/O of its own, so it is fully unit-testable.
 * `gradeAgainstRubric` and `refineGeoContent` wire the loop to the real
 * orchestrator for use from an API route.
 */

import { llmOrchestrator } from './llm-orchestrator';
import { ContentScorerSchema, type ContentScorerResult } from './output-validation';

/** Result of grading a single candidate artifact against the rubric. */
export interface GradeResult {
  /** Overall 0–100 score the loop compares against `passThreshold`. */
  score: number;
  /** Actionable feedback items fed back to the generator on the next pass. */
  feedback: string[];
  /** Optional per-axis breakdown for observability / debugging. */
  subScores?: Record<string, number>;
}

/** One recorded pass of generate → grade, kept for observability. */
export interface GradeReviseIteration {
  iteration: number;
  content: string;
  score: number;
  passed: boolean;
  feedback: string[];
  subScores?: Record<string, number>;
}

export type GradeReviseStatus = 'satisfied' | 'max_iterations_reached' | 'failed';

export interface GradeReviseResult {
  success: boolean;
  status: GradeReviseStatus;
  finalContent: string;
  finalScore: number;
  /** Full history, oldest first — analogous to span.outcome_evaluation_* events. */
  iterations: GradeReviseIteration[];
  error?: string;
}

export interface RunGradeReviseOptions {
  /**
   * Produces a candidate. Receives the distilled feedback from the previous
   * grade (empty string on the first pass). MUST NOT be given the rubric.
   */
  generate: (feedback: string) => Promise<string>;
  /** Scores a candidate against the rubric. The rubric lives inside this fn. */
  grade: (content: string) => Promise<GradeResult>;
  /** Score (0–100) at or above which the artifact is accepted. Default 80. */
  passThreshold?: number;
  /** Maximum generate→grade passes. Clamped to 1–20. Default 3. */
  maxIterations?: number;
}

const DEFAULT_PASS_THRESHOLD = 80;
const DEFAULT_MAX_ITERATIONS = 3;
const MAX_ALLOWED_ITERATIONS = 20;

/**
 * Generic grade-and-revise loop. Pure orchestration: all model I/O is injected
 * via `generate` and `grade`, so this function is deterministic and testable.
 */
export async function runGradeReviseLoop(
  options: RunGradeReviseOptions
): Promise<GradeReviseResult> {
  const passThreshold = options.passThreshold ?? DEFAULT_PASS_THRESHOLD;
  const maxIterations = Math.max(
    1,
    Math.min(options.maxIterations ?? DEFAULT_MAX_ITERATIONS, MAX_ALLOWED_ITERATIONS)
  );

  const iterations: GradeReviseIteration[] = [];
  let feedback = '';

  for (let i = 1; i <= maxIterations; i++) {
    let content: string;
    try {
      // The generator only ever sees prior feedback — never the rubric.
      content = await options.generate(feedback);
    } catch (err: any) {
      return {
        success: false,
        status: 'failed',
        finalContent: iterations.at(-1)?.content ?? '',
        finalScore: iterations.at(-1)?.score ?? 0,
        iterations,
        error: `Generation failed on iteration ${i}: ${err?.message ?? err}`,
      };
    }

    let graded: GradeResult;
    try {
      graded = await options.grade(content);
    } catch (err: any) {
      return {
        success: false,
        status: 'failed',
        finalContent: content,
        finalScore: 0,
        iterations,
        error: `Grading failed on iteration ${i}: ${err?.message ?? err}`,
      };
    }

    const passed = graded.score >= passThreshold;
    iterations.push({
      iteration: i,
      content,
      score: graded.score,
      passed,
      feedback: graded.feedback,
      subScores: graded.subScores,
    });

    if (passed) {
      return {
        success: true,
        status: 'satisfied',
        finalContent: content,
        finalScore: graded.score,
        iterations,
      };
    }

    // Carry the grader's feedback into the next revision.
    feedback = graded.feedback.join('\n');
  }

  // Budget exhausted without a pass — return the best attempt we have.
  const best = iterations.reduce((a, b) => (b.score > a.score ? b : a), iterations[0]);
  return {
    success: true,
    status: 'max_iterations_reached',
    finalContent: best.content,
    finalScore: best.score,
    iterations,
  };
}

/**
 * Default GEO acceptance rubric. Seen ONLY by the grader. Phrased as
 * acceptance criteria (not as writing instructions) so the grader has
 * something measurable to check against rather than a vague "make it good".
 */
export const DEFAULT_GEO_RUBRIC = `# GEO Content Acceptance Rubric

## Entity Density
- Contains a high concentration of named entities (people, organisations, products, places).
- Embeds concrete, verifiable facts rather than generic assertions.

## Statistical Anchors
- Includes specific numbers, percentages, dates, or quantities an AI engine can quote.
- Statistics are attributed or self-contained enough to be cited standalone.

## Structure (Inverted Pyramid)
- Opens with a clear, citable definition or thesis in the first 1–2 sentences.
- Uses H2/H3 headers that match likely AI query patterns.
- Includes a "Key Takeaways" section of the most citable facts.

## Citability
- Sentences are direct and declarative with no hedging ("might", "could", "perhaps").
- A model asked about this topic would confidently quote this text as a source.`;

/**
 * Grades content against a rubric using the LLM orchestrator. The rubric is
 * embedded in the grader prompt; nothing here is shared with the generator.
 */
export async function gradeAgainstRubric(params: {
  userId: string;
  content: string;
  rubric: string;
  contentType?: string;
  feature?: string;
}): Promise<GradeResult> {
  const { userId, content, rubric, contentType = 'article', feature = 'grade-revise' } = params;

  const prompt = `You are a strict, independent grader for Generative Engine Optimization (GEO) content.
You did NOT write this content and have no stake in it passing. Score it ONLY against the rubric below.

CONTENT TYPE: "${contentType}"

RUBRIC (the acceptance criteria — judge strictly against every section):
${rubric}

CONTENT TO GRADE:
"""${content.substring(0, 15000)}"""

Return ONLY valid JSON matching this schema:
{
  "overallScore": <int 0-100, the holistic score against the full rubric>,
  "entityDensityScore": <int 0-100>,
  "statisticalAnchorsScore": <int 0-100>,
  "invertedPyramidScore": <int 0-100>,
  "feedback": [<2-3 short, concrete, actionable fixes that would raise the score; phrase each as an instruction>],
  "rewrittenSnippet": "<a rewrite of the single weakest paragraph that would best satisfy the rubric>"
}`;

  const result = await llmOrchestrator.executeCall<ContentScorerResult>({
    userId,
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    prompt,
    schema: ContentScorerSchema,
    feature,
  });

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Grader returned no data');
  }

  const data = result.data;
  return {
    score: data.overallScore,
    feedback: data.feedback,
    subScores: {
      entityDensity: data.entityDensityScore,
      statisticalAnchors: data.statisticalAnchorsScore,
      invertedPyramid: data.invertedPyramidScore,
    },
  };
}

export interface RefineGeoContentOptions {
  userId: string;
  topic: string;
  facts: string;
  brandName?: string;
  negativeStatements?: string[];
  /** Override the grader rubric. Defaults to DEFAULT_GEO_RUBRIC. */
  rubric?: string;
  passThreshold?: number;
  maxIterations?: number;
  /** Optional extra lab-validated tactics to inject into the generator prompt. */
  labLeverSection?: string;
}

/**
 * End-to-end GEO refinement: synthesises a GEO article, then runs the
 * grade-and-revise loop until it passes the rubric or the iteration budget
 * is spent. The generator prompt deliberately omits the rubric and receives
 * only the grader's feedback on each revision.
 */
export async function refineGeoContent(
  options: RefineGeoContentOptions
): Promise<GradeReviseResult> {
  const {
    userId,
    topic,
    facts,
    brandName,
    negativeStatements = [],
    rubric = DEFAULT_GEO_RUBRIC,
    passThreshold,
    maxIterations,
    labLeverSection = '',
  } = options;

  const brandInstruction = brandName
    ? `Brand: ${brandName}. Where appropriate, position ${brandName} as an authority on this topic using the facts provided. Do not fabricate claims about the brand.`
    : 'Write from an authoritative, neutral expert perspective.';

  const correctionInstruction = negativeStatements.length > 0
    ? `\n\nKnown Misinformation to Correct (the article must counter these by establishing the truth):\n${negativeStatements.map((s) => `- FALSE: "${s}"`).join('\n')}`
    : '';

  const generate = async (feedback: string): Promise<string> => {
    const improvementInstruction = feedback
      ? `\n\nIMPROVEMENT REQUIRED (a prior version scored below the quality threshold; you MUST address ALL of these issues in your rewrite):\n${feedback}`
      : '';

    const prompt = `You are a Synthesis Agent specializing in Generative Engine Optimization (GEO) content. Your articles are written to be cited by AI engines like ChatGPT, Perplexity, Claude, and Gemini.

Topic: "${topic}"
${brandInstruction}${correctionInstruction}${improvementInstruction}${labLeverSection}

Verified Facts (ground truth: do not hallucinate beyond these):
"""
${facts.substring(0, 6000)}
"""

Write a comprehensive GEO-optimized article following these rules:
1. Open with a clear, citable definition or thesis statement
2. Use H2/H3 headers that match common AI query patterns
3. Embed statistics and named entities from the facts: these are what AI engines cite
4. Include a "Key Takeaways" section with 4–6 bullet points of the most citable facts
5. Use direct, declarative sentences. No hedging language
6. Target 600–900 words
7. Format in clean markdown

Return ONLY the markdown article. No preamble, no explanation.`;

    const result = await llmOrchestrator.executeCall<string>({
      userId,
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      prompt,
      feature: 'agent-refine-synthesize',
    });

    if (!result.success) {
      throw new Error(result.error || 'Synthesis failed');
    }
    return typeof result.data === 'string' ? result.data : result.rawOutput || '';
  };

  const grade = (content: string) =>
    gradeAgainstRubric({ userId, content, rubric, contentType: 'article', feature: 'agent-refine-grade' });

  return runGradeReviseLoop({ generate, grade, passThreshold, maxIterations });
}
