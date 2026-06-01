import type { LLMConfig, LLMProvider } from '../types.js';
import { LLMError } from '../types.js';
import { SYSTEM_PROMPT, parseStepResponse } from '../provider.js';

export class OllamaProvider implements LLMProvider {
  constructor(private config: LLMConfig) {}

  async decompose(description: string): Promise<any[]> {
    const url = `${this.config.ollamaUrl}/api/generate`;
    const body = {
      model: this.config.ollamaModel,
      prompt: SYSTEM_PROMPT + description,
      stream: false,
      format: 'json' as const,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new LLMError(`Ollama returned ${res.status}: ${res.statusText}`, 'ollama', res.status >= 500);
      }

      const data = await res.json() as any;
      const text = data.response || '';
      return parseStepResponse(text);
    } catch (err: any) {
      if (err instanceof LLMError) throw err;
      if (err.name === 'AbortError') throw new LLMError('Ollama request timed out after 30s', 'ollama', true);
      throw new LLMError(`Ollama request failed: ${err.message}`, 'ollama', false);
    } finally {
      clearTimeout(timeout);
    }
  }
}
