import type { TaskStep } from '../agents/types.js';

export type LLMProviderName = 'ollama' | 'openai' | 'anthropic';

export interface LLMConfig {
  provider: LLMProviderName;
  openaiKey?: string;
  anthropicKey?: string;
  ollamaUrl: string;
  ollamaModel: string;
  model?: string;
}

export interface LLMProvider {
  decompose(description: string): Promise<TaskStep[]>;
}

export class LLMError extends Error {
  constructor(
    message: string,
    public readonly provider: LLMProviderName,
    public readonly recoverable: boolean
  ) {
    super(message);
    this.name = 'LLMError';
  }
}
