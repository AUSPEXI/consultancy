import { describe, it, expect, vi } from 'vitest';
import { runGradeReviseLoop, type GradeResult } from '../grade-revise';

/** Build a grader that returns the next score from a fixed sequence. */
function scriptedGrader(scores: number[]) {
  let i = 0;
  return vi.fn(async (): Promise<GradeResult> => {
    const score = scores[Math.min(i, scores.length - 1)];
    i++;
    return { score, feedback: [`fix to reach ${score + 5}`] };
  });
}

describe('runGradeReviseLoop', () => {
  it('stops as soon as the threshold is met (satisfied)', async () => {
    const generate = vi.fn(async () => 'draft');
    const grade = scriptedGrader([85]);

    const res = await runGradeReviseLoop({ generate, grade, passThreshold: 80, maxIterations: 3 });

    expect(res.status).toBe('satisfied');
    expect(res.success).toBe(true);
    expect(res.finalScore).toBe(85);
    expect(res.iterations).toHaveLength(1);
    // No wasted passes once it passes.
    expect(generate).toHaveBeenCalledTimes(1);
    expect(grade).toHaveBeenCalledTimes(1);
  });

  it('revises across iterations and passes on a later attempt', async () => {
    const generate = vi.fn(async () => 'draft');
    const grade = scriptedGrader([50, 70, 90]);

    const res = await runGradeReviseLoop({ generate, grade, passThreshold: 80, maxIterations: 5 });

    expect(res.status).toBe('satisfied');
    expect(res.finalScore).toBe(90);
    expect(res.iterations.map((i) => i.score)).toEqual([50, 70, 90]);
    expect(generate).toHaveBeenCalledTimes(3);
  });

  it('feeds the grader feedback into the next generate call (blind-grader contract)', async () => {
    const seenFeedback: string[] = [];
    const generate = vi.fn(async (feedback: string) => {
      seenFeedback.push(feedback);
      return 'draft';
    });
    const grade = scriptedGrader([40, 95]);

    await runGradeReviseLoop({ generate, grade, passThreshold: 80, maxIterations: 3 });

    // First pass gets no feedback; second pass gets the prior grade's feedback.
    expect(seenFeedback[0]).toBe('');
    expect(seenFeedback[1]).toContain('fix to reach 45');
  });

  it('returns the best attempt when the budget is exhausted', async () => {
    const generate = vi.fn(async () => 'draft');
    const grade = scriptedGrader([60, 75, 65]);

    const res = await runGradeReviseLoop({ generate, grade, passThreshold: 80, maxIterations: 3 });

    expect(res.status).toBe('max_iterations_reached');
    expect(res.success).toBe(true);
    // Best-of, not last-of.
    expect(res.finalScore).toBe(75);
    expect(res.iterations).toHaveLength(3);
  });

  it('clamps maxIterations to a sane ceiling', async () => {
    const generate = vi.fn(async () => 'draft');
    const grade = scriptedGrader([10]); // never passes

    const res = await runGradeReviseLoop({ generate, grade, passThreshold: 80, maxIterations: 999 });

    expect(res.iterations.length).toBeLessThanOrEqual(20);
    expect(generate).toHaveBeenCalledTimes(20);
  });

  it('fails gracefully when generation throws', async () => {
    const generate = vi.fn(async () => { throw new Error('provider down'); });
    const grade = scriptedGrader([90]);

    const res = await runGradeReviseLoop({ generate, grade });

    expect(res.success).toBe(false);
    expect(res.status).toBe('failed');
    expect(res.error).toContain('provider down');
    expect(grade).not.toHaveBeenCalled();
  });

  it('fails gracefully when grading throws but keeps the drafted content', async () => {
    const generate = vi.fn(async () => 'partial draft');
    const grade = vi.fn(async () => { throw new Error('grader 500'); });

    const res = await runGradeReviseLoop({ generate, grade });

    expect(res.success).toBe(false);
    expect(res.status).toBe('failed');
    expect(res.finalContent).toBe('partial draft');
    expect(res.error).toContain('grader 500');
  });
});
