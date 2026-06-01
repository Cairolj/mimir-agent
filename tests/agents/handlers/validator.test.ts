import { describe, it, expect } from 'vitest';
import { ValidatorHandler } from '../../../src/agents/handlers/validator';

describe('ValidatorHandler', () => {
  const validator = new ValidatorHandler();

  it('should validate output without errors', () => {
    const result = validator.validate('all good', '');
    expect(result.status).toBe('success');
    expect(result.checks.length).toBeGreaterThanOrEqual(0);
  });

  it('should flag error keywords', () => {
    const result = validator.validate('Error: something broke', '');
    expect(result.checks.some(c => !c.pass)).toBe(true);
  });

  it('should flag warning keywords', () => {
    const result = validator.validate('Warning: deprecated', '');
    expect(result.checks.some(c => !c.pass)).toBe(true);
  });
});
