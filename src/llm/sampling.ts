import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { TaskStep } from '../agents/types.js';
import type { LLMConfig, LLMProvider } from './types.js';
import { LLMError } from './types.js';
import { SYSTEM_PROMPT, parseStepResponse } from './provider.js';

export class SamplingProvider implements LLMProvider {
  constructor(
    private server: Server,
    private config?: LLMConfig,
  ) {}

  async decompose(description: string): Promise<TaskStep[]> {
    try {
      const response = await this.server.createMessage({
        messages: [
          {
            role: 'user',
            content: { type: 'text', text: SYSTEM_PROMPT + description },
          },
        ],
        maxTokens: 1024,
      });

      const text = response.content.type === 'text' ? response.content.text : '';
      return parseStepResponse(text);
    } catch (err: any) {
      if (err instanceof LLMError) throw err;
      throw new LLMError(
        `Sampling failed: ${err.message}`,
        'sampling',
        err.message?.toLowerCase().includes('timeout') ?? false,
      );
    }
  }
}
