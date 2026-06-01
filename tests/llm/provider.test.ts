import { describe, it, expect } from 'vitest';
import type { LLMConfig } from '../../src/llm/types.js';

describe('LLM Provider Factory', () => {
  it('should create ollama provider', async () => {
    const { createProvider } = await import('../../src/llm/provider.js');
    const config: LLMConfig = { provider: 'ollama', ollamaUrl: 'http://localhost:11434', ollamaModel: 'llama3.2' };
    const provider = await createProvider(config);
    expect(provider.constructor.name).toBe('OllamaProvider');
  });

  it('should throw for unknown provider', async () => {
    const { createProvider } = await import('../../src/llm/provider.js');
    await expect(createProvider({ provider: 'unknown' } as any)).rejects.toThrow('Unknown LLM provider');
  });
});
