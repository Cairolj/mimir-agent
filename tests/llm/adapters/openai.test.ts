import { describe, it, expect } from 'vitest';

describe('OpenAIProvider', () => {
  it('should throw if no API key configured', async () => {
    const { OpenAIProvider } = await import('../../../src/llm/adapters/openai.js');
    expect(() => new OpenAIProvider({ provider: 'openai' } as any)).toThrow('API key not configured');
  });
});
