import { nanoid } from 'nanoid';
import type { StepResult } from '../types.js';

interface ValidationCheck {
  name: string;
  pass: boolean;
  detail?: string;
}

interface ValidationResult {
  status: 'success' | 'failure';
  checks: ValidationCheck[];
}

export class ValidatorHandler {
  validate(output: string, error: string): ValidationResult {
    const checks: ValidationCheck[] = [];

    checks.push({ name: 'has-output', pass: output.length > 0, detail: output.length > 0 ? `${output.length} chars` : 'no output' });

    const errorPatterns = ['error', 'fail', 'traceback', 'exception', 'cannot', 'not found', 'enoent'];
    const errorMatches = errorPatterns.filter(p => output.toLowerCase().includes(p) || error.toLowerCase().includes(p));
    checks.push({ name: 'no-errors', pass: errorMatches.length === 0, detail: errorMatches.length > 0 ? `found: ${errorMatches.join(', ')}` : 'clean' });

    const warningPatterns = ['warning', 'deprecated', 'deprecation'];
    const warningMatches = warningPatterns.filter(p => output.toLowerCase().includes(p));
    checks.push({ name: 'no-warnings', pass: warningMatches.length === 0, detail: warningMatches.length > 0 ? `found: ${warningMatches.join(', ')}` : 'clean' });

    const status = checks.every(c => c.pass) ? 'success' : 'failure';
    return { status, checks };
  }
}

export class ValidatorActor {
  get type() { return 'validator' as const; }

  async execute(step: { command: string }): Promise<StepResult> {
    const handler = new ValidatorHandler();
    const start = Date.now();
    const result = handler.validate(step.command, '');
    const duration = Date.now() - start;
    return {
      stepId: 'validate',
      agentId: `validator-${nanoid(8)}`,
      agentType: 'validator',
      status: result.status,
      output: JSON.stringify(result.checks),
      duration,
    };
  }
}
