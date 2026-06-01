import { describe, it, expect } from 'vitest';

describe('AnthropicProvider', () => {
  it('should throw if no API key configured', async () => {
    const { AnthropicProvider } = await import('../../../src/llm/adapters/anthropic.js');
    expect(() => new AnthropicProvider({ provider: 'anthropic' } as any)).toThrow('API key not configured');
  });
});
