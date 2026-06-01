import { describe, it, expect, vi } from 'vitest';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';

function createMockServer(): Server {
  return {
    createMessage: vi.fn().mockResolvedValue({
      content: { type: 'text', text: '[{"command":"echo hi","description":"say hi","dependsOn":[]}]' },
    }),
  } as unknown as Server;
}

describe('SamplingProvider', () => {
  it('should decompose via server.createMessage', async () => {
    const { SamplingProvider } = await import('../../src/llm/sampling.js');
    const server = createMockServer();
    const provider = new SamplingProvider(server);
    const steps = await provider.decompose('say hi');
    expect(steps).toHaveLength(1);
    expect(steps[0].command).toBe('echo hi');
    expect(server.createMessage).toHaveBeenCalledOnce();
  });

  it('should throw LLMError on non-JSON response', async () => {
    const { SamplingProvider } = await import('../../src/llm/sampling.js');
    const { LLMError } = await import('../../src/llm/types.js');
    const server = { createMessage: vi.fn().mockResolvedValue({ content: { type: 'text', text: 'not json' } }) } as unknown as Server;
    const provider = new SamplingProvider(server);
    await expect(provider.decompose('test')).rejects.toThrow(LLMError);
  });
});
