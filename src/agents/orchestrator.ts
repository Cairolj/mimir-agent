import { nanoid } from 'nanoid';
import type { TaskStep, StepResult, RunResult } from './types';
import { PlannerHandler } from './handlers/planner';
import { ExecutorHandler } from './handlers/executor';
import { InvestigatorHandler } from './handlers/investigator';
import { ValidatorHandler } from './handlers/validator';
import { CriticHandler } from './handlers/critic';

export class AgentOrchestrator {
  private actors: Record<string, { execute(step: TaskStep): Promise<StepResult> }>;

  constructor() {
    this.actors = {
      executor: new ExecutorHandler(),
      investigator: new InvestigatorHandler(),
    };
  }

  async runTask(description: string): Promise<RunResult> {
    const start = Date.now();
    const planner = new PlannerHandler();
    const validator = new ValidatorHandler();
    const critic = new CriticHandler();

    const plan = planner.decompose(description);
    if (plan.length === 0) {
      return { taskDescription: description, plan: [], results: [], totalDuration: 0, success: false };
    }

    const completed = new Map<string, StepResult>();
    const results: StepResult[] = [];

    const remaining = new Set(plan.map(s => s.id));
    let pass = 0;
    while (remaining.size > 0 && pass < 100) {
      pass++;
      const ready = plan.filter(s => remaining.has(s.id) && s.dependsOn.every(d => completed.has(d)));
      if (ready.length === 0) break;

      const waveResults = await Promise.all(ready.map(async (step) => {
        const actor = this.actors[step.agentType];
        if (!actor) {
          return {
            stepId: step.id,
            agentId: `unknown-${nanoid(8)}`,
            agentType: step.agentType,
            status: 'failure' as const,
            output: '',
            error: `No actor for agent type: ${step.agentType}`,
            duration: 0,
          };
        }
        return actor.execute(step);
      }));

      for (const r of waveResults) {
        completed.set(r.stepId, r);
        results.push(r);
        remaining.delete(r.stepId);
      }
    }

    for (const step of plan) {
      if (remaining.has(step.id)) {
        results.push({
          stepId: step.id,
          agentId: `skipped-${nanoid(8)}`,
          agentType: step.agentType,
          status: 'failure',
          output: '',
          error: 'Skipped: dependency not met',
          duration: 0,
        });
      }
    }

    const totalDuration = Date.now() - start;
    const allOutput = results.map(r => r.output).join('\n');
    const failedSteps = results.filter(r => r.status === 'failure').map(r => r.stepId);

    validator.validate(allOutput, '');
    critic.review(allOutput, failedSteps, totalDuration);

    const success = results.length > 0 && results.some(r => r.status === 'success');

    return {
      taskDescription: description,
      plan,
      results,
      totalDuration,
      success,
    };
  }
}
