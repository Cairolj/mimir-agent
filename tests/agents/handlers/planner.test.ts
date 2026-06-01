import { describe, it, expect } from 'vitest';
import { PlannerHandler } from '../../../src/agents/handlers/planner';

describe('PlannerHandler', () => {
  const planner = new PlannerHandler();

  it('should decompose install express into steps', () => {
    const steps = planner.decompose('install express');
    expect(steps.length).toBeGreaterThanOrEqual(2);
    const cmds = steps.map(s => s.command);
    expect(cmds.some(c => c.includes('npm install'))).toBe(true);
  });

  it('should decompose git clone into steps', () => {
    const steps = planner.decompose('git clone https://github.com/user/repo');
    expect(steps.length).toBeGreaterThanOrEqual(1);
    expect(steps[0].command).toContain('git clone');
  });

  it('should handle empty description', () => {
    const steps = planner.decompose('');
    expect(steps).toEqual([]);
  });
});
