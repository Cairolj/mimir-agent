import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('PlannerHandler', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.MIMIR_LLM_PROVIDER;
  });

  it('should handle empty description', async () => {
    const { PlannerHandler } = await import('../../../src/agents/handlers/planner.js');
    const planner = new PlannerHandler();
    const steps = await planner.decompose('');
    expect(steps).toEqual([]);
  });

  it('should throw when no LLM provider configured', async () => {
    const { PlannerHandler } = await import('../../../src/agents/handlers/planner.js');
    const planner = new PlannerHandler();
    await expect(planner.decompose('do something')).rejects.toThrow('No LLM available');
  });

  it('should throw error for unknown provider', async () => {
    process.env.MIMIR_LLM_PROVIDER = 'unknown';
    const { PlannerHandler } = await import('../../../src/agents/handlers/planner.js');
    const planner = new PlannerHandler();
    await expect(planner.decompose('do something')).rejects.toThrow('Unknown LLM provider');
  });
});
