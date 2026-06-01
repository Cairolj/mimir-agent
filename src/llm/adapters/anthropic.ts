import Anthropic from '@anthropic-ai/sdk';
import type { LLMConfig, LLMProvider } from '../types.js';
import { LLMError } from '../types.js';
import { SYSTEM_PROMPT, parseStepResponse } from '../provider.js';

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;

  constructor(private config: LLMConfig) {
    if (!config.anthropicKey) throw new LLMError('Anthropic API key not configured. Set MIMIR_ANTHROPIC_KEY', 'anthropic', false);
    this.client = new Anthropic({ apiKey: config.anthropicKey });
  }

  async decompose(description: string): Promise<any[]> {
    try {
      const res = await this.client.messages.create({
        model: this.config.model || 'claude-3-haiku-20240307',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: description }],
      });

      const text = res.content[0]?.type === 'text' ? res.content[0].text : '[]';
      return parseStepResponse(text);
    } catch (err: any) {
      if (err instanceof LLMError) throw err;
      if (err.status === 401) throw new LLMError('Anthropic authentication failed. Check MIMIR_ANTHROPIC_KEY', 'anthropic', false);
      throw new LLMError(`Anthropic request failed: ${err.message}`, 'anthropic', true);
    }
  }
}
