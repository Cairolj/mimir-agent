import type { TaskStep } from '../types.js';
import { createProvider } from '../../llm/provider.js';
import { loadLLMConfig } from '../../llm/config.js';
import { LLMError } from '../../llm/types.js';

export class PlannerHandler {
  async decompose(description: string): Promise<TaskStep[]> {
    if (!description.trim()) return [];

    const config = loadLLMConfig();
    const provider = await createProvider(config);

    try {
      const steps = await provider.decompose(description);
      return steps.map(s => ({
        id: s.id,
        agentType: s.agentType || 'executor',
        command: s.command || '',
        description: s.description || '',
        dependsOn: s.dependsOn || [],
      }));
    } catch (err) {
      if (err instanceof LLMError) {
        throw new Error(`Planning failed (${err.provider}): ${err.message}`);
      }
      throw err;
    }
  }
}
