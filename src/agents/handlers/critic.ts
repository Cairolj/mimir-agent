import { nanoid } from 'nanoid';
import type { StepResult } from '../types.js';

interface ReviewIssue {
  severity: 'low' | 'medium' | 'high';
  message: string;
}

interface ReviewResult {
  issues: ReviewIssue[];
  score: number;
  summary: string;
}

export class CriticHandler {
  review(output: string, failedSteps: string[], totalDuration: number): ReviewResult {
    const issues: ReviewIssue[] = [];

    const errorPatterns = ['error', 'fail', 'traceback', 'exception', 'crash', 'segmentation fault', 'abort'];
    for (const p of errorPatterns) {
      if (output.toLowerCase().includes(p)) {
        issues.push({ severity: 'high', message: `Output contains '${p}'` });
      }
    }

    for (const step of failedSteps) {
      issues.push({ severity: 'high', message: `Step failed: ${step}` });
    }

    if (totalDuration > 10000) {
      issues.push({ severity: 'medium', message: `Long execution time: ${totalDuration}ms` });
    }
    if (totalDuration > 30000) {
      issues.push({ severity: 'high', message: `Very long execution time: ${totalDuration}ms` });
    }

    let score = 100;
    for (const issue of issues) {
      score -= issue.severity === 'high' ? 25 : issue.severity === 'medium' ? 10 : 3;
    }
    score = Math.max(0, score);
    score -= Math.min(30, Math.floor(totalDuration / 1000));

    const count = issues.length;
    const summary = count === 0 ? 'Clean execution' : `${count} issue(s) found, score: ${score}`;

    return { issues, score: Math.max(0, score), summary };
  }
}

export class CriticActor {
  get type() { return 'critic' as const; }

  async execute(step: { command: string }): Promise<StepResult> {
    const handler = new CriticHandler();
    const start = Date.now();
    const review = handler.review(step.command, [], 0);
    const duration = Date.now() - start;
    return {
      stepId: 'critique',
      agentId: `critic-${nanoid(8)}`,
      agentType: 'critic',
      status: 'success',
      output: JSON.stringify(review),
      duration,
    };
  }
}
