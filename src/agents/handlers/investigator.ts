import { nanoid } from 'nanoid';
import type { TaskStep, StepResult } from '../types.js';

export class InvestigatorHandler {
  private timeoutMs: number;

  constructor(timeoutMs = 10_000) {
    this.timeoutMs = timeoutMs;
  }

  get type() { return 'investigator' as const; }

  async execute(step: TaskStep): Promise<StepResult> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      const response = await fetch(step.command, { signal: controller.signal });
      clearTimeout(timer);
      const text = await response.text();
      const duration = Date.now() - start;
      return {
        stepId: step.id,
        agentId: `investigator-${nanoid(8)}`,
        agentType: 'investigator',
        status: 'success',
        output: text.substring(0, 2000),
        duration,
      };
    } catch (err) {
      const duration = Date.now() - start;
      return {
        stepId: step.id,
        agentId: `investigator-${nanoid(8)}`,
        agentType: 'investigator',
        status: 'failure',
        output: '',
        error: (err as Error).message,
        duration,
      };
    }
  }
}
