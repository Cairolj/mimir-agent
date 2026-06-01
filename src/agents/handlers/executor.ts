import { exec } from 'child_process';
import { nanoid } from 'nanoid';
import type { TaskStep, StepResult } from '../types.js';

export class ExecutorHandler {
  private timeoutMs: number;

  constructor(timeoutMs = 30_000) {
    this.timeoutMs = timeoutMs;
  }

  get type() { return 'executor' as const; }

  execute(step: TaskStep): Promise<StepResult> {
    return new Promise((resolve) => {
      const start = Date.now();
      const child = exec(step.command, { timeout: this.timeoutMs, windowsHide: true }, (error, stdout, stderr) => {
        const duration = Date.now() - start;
        if (error) {
          const isTimeout = !!error.killed || error.message.includes('timeout');
          resolve({
            stepId: step.id,
            agentId: `executor-${nanoid(8)}`,
            agentType: 'executor',
            status: 'failure',
            output: stderr || stdout,
            error: isTimeout ? `timeout after ${this.timeoutMs}ms` : error.message,
            duration,
          });
        } else {
          resolve({
            stepId: step.id,
            agentId: `executor-${nanoid(8)}`,
            agentType: 'executor',
            status: 'success',
            output: stdout,
            duration,
          });
        }
      });
    });
  }
}
