import OpenAI from 'openai';
import type { LLMConfig, LLMProvider } from '../types.js';
import { LLMError } from '../types.js';
import { SYSTEM_PROMPT, parseStepResponse } from '../provider.js';

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;

  constructor(private config: LLMConfig) {
    if (!config.openaiKey) throw new LLMError('OpenAI API key not configured. Set MIMIR_OPENAI_KEY', 'openai', false);
    this.client = new OpenAI({ apiKey: config.openaiKey, timeout: 30_000 });
  }

  async decompose(description: string): Promise<any[]> {
    try {
      const res = await this.client.chat.completions.create({
        model: this.config.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: description },
        ],
        response_format: { type: 'json_object' },
      });

      const text = res.choices[0]?.message?.content || '[]';
      const parsed = JSON.parse(text);
      const steps = parsed.steps || parsed || [];
      return Array.isArray(steps) ? parseStepResponse(JSON.stringify(steps)) : [];
    } catch (err: any) {
      if (err instanceof LLMError) throw err;
      if (err.status === 401) throw new LLMError('OpenAI authentication failed. Check MIMIR_OPENAI_KEY', 'openai', false);
      throw new LLMError(`OpenAI request failed: ${err.message}`, 'openai', true);
    }
  }
}
