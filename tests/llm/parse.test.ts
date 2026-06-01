import { describe, it, expect } from 'vitest';

describe('parseStepResponse', () => {
  it('should parse valid JSON array', async () => {
    const { parseStepResponse } = await import('../../src/llm/provider.js');
    const steps = parseStepResponse('[{"command":"echo hi","description":"say hi","dependsOn":[]}]');
    expect(steps).toHaveLength(1);
    expect(steps[0].command).toBe('echo hi');
  });

  it('should throw for non-JSON response', async () => {
    const { parseStepResponse } = await import('../../src/llm/provider.js');
    expect(() => parseStepResponse('not json')).toThrow('valid JSON');
  });

  it('should extract JSON array from markdown', async () => {
    const { parseStepResponse } = await import('../../src/llm/provider.js');
    const text = 'Here are the steps:\n```json\n[{"command":"ls","description":"list files","dependsOn":[]}]\n```';
    const steps = parseStepResponse(text);
    expect(steps).toHaveLength(1);
    expect(steps[0].command).toBe('ls');
  });
});
