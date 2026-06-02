import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { TaskStep } from '../types.js';
import { createProvider } from '../../llm/provider.js';
import { loadLLMConfig } from '../../llm/config.js';
import { SamplingProvider } from '../../llm/sampling.js';
import { LLMError } from '../../llm/types.js';

export class PlannerHandler {
  constructor(private mcpServer?: Server) {}

  async decompose(description: string): Promise<TaskStep[]> {
    if (!description.trim()) return [];

    const externalConfig = loadLLMConfig();

    let provider;
    if (externalConfig) {
      provider = await createProvider(externalConfig);
    } else if (this.mcpServer) {
      provider = new SamplingProvider(this.mcpServer);
    } else {
      throw new Error(
        'No LLM available. The MCP server must be connected to use the editor\'s LLM, ' +
        'or configure an external provider via MIMIR_LLM_PROVIDER.',
      );
    }

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
