import { describe, it, expect } from 'vitest';

describe('OllamaProvider', () => {
  it('should construct with config', async () => {
    const { OllamaProvider } = await import('../../../src/llm/adapters/ollama.js');
    const provider = new OllamaProvider({ provider: 'ollama', ollamaUrl: 'http://localhost:11434', ollamaModel: 'llama3.2' });
    expect(provider.constructor.name).toBe('OllamaProvider');
  });
});
