import type { LLMConfig, LLMProvider } from '../types.js';
import type { TaskStep } from '../../agents/types.js';

export class OllamaProvider implements LLMProvider {
  constructor(private config: LLMConfig) {}
  async decompose(_description: string): Promise<TaskStep[]> {
    return [];
  }
}
