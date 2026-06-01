import { describe, it, expect } from 'vitest';
import { CriticHandler } from '../../../src/agents/handlers/critic';

describe('CriticHandler', () => {
  const critic = new CriticHandler();

  it('should return empty issues for clean output', () => {
    const review = critic.review('success: all tests passed', [], 500);
    expect(review.issues.length).toBe(0);
    expect(review.score).toBeGreaterThanOrEqual(90);
  });

  it('should flag error-containing output', () => {
    const review = critic.review('Error: crash detected', ['failed step'], 500);
    expect(review.issues.length).toBeGreaterThan(0);
    expect(review.score).toBeLessThan(50);
  });

  it('should penalize long duration', () => {
    const fast = critic.review('done', [], 100);
    const slow = critic.review('done', [], 15000);
    expect(slow.score).toBeLessThan(fast.score);
  });
});
