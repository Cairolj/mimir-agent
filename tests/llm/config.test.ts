import { describe, it, expect, beforeEach } from 'vitest';

describe('LLM Config', () => {
  beforeEach(() => {
    delete process.env.MIMIR_LLM_PROVIDER;
    delete process.env.MIMIR_OPENAI_KEY;
    delete process.env.MIMIR_ANTHROPIC_KEY;
    delete process.env.MIMIR_OLLAMA_URL;
    delete process.env.MIMIR_OLLAMA_MODEL;
  });

  it('should throw if no provider configured', async () => {
    const { loadLLMConfig } = await import('../../src/llm/config.js');
    expect(() => loadLLMConfig()).toThrow('No LLM provider configured');
  });

  it('should load provider from env var', async () => {
    process.env.MIMIR_LLM_PROVIDER = 'ollama';
    const { loadLLMConfig } = await import('../../src/llm/config.js');
    const config = loadLLMConfig();
    expect(config.provider).toBe('ollama');
    expect(config.ollamaUrl).toBe('http://localhost:11434');
  });

  it('should load API key from env var', async () => {
    process.env.MIMIR_LLM_PROVIDER = 'openai';
    process.env.MIMIR_OPENAI_KEY = 'sk-test';
    const { loadLLMConfig } = await import('../../src/llm/config.js');
    const config = loadLLMConfig();
    expect(config.openaiKey).toBe('sk-test');
  });
});
