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
      return this.fallbackDecompose(description);
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
        const msg = err.message.toLowerCase();
        if (msg.includes('no sampling handler') || msg.includes('sampling not supported')) {
          return this.fallbackDecompose(description);
        }
        throw new Error(`Planning failed (${err.provider}): ${err.message}`);
      }
      return this.fallbackDecompose(description);
    }
  }

  private fallbackDecompose(description: string): TaskStep[] {
    const trimmed = description.trim();
    if (!trimmed) return [];

    if (/^https?:\/\//i.test(trimmed)) {
      return [{
        id: this.shortId(),
        agentType: 'investigator',
        command: trimmed,
        description: trimmed.substring(0, 50),
        dependsOn: [],
      }];
    }

    if (/^search:/i.test(trimmed)) {
      return [{
        id: this.shortId(),
        agentType: 'investigator',
        command: trimmed,
        description: `Search: ${trimmed.replace(/^search:\s*/i, '').substring(0, 40)}`,
        dependsOn: [],
      }];
    }

    const commands = trimmed.split(/\s*&&\s*/).filter(Boolean);
    if (commands.length > 1) {
      const steps: TaskStep[] = [];
      for (let i = 0; i < commands.length; i++) {
        steps.push({
          id: this.shortId(),
          agentType: 'executor',
          command: commands[i].trim(),
          description: commands[i].trim().substring(0, 50),
          dependsOn: i > 0 ? [steps[i - 1].id] : [],
        });
      }
      return steps;
    }

    return [{
      id: this.shortId(),
      agentType: 'executor',
      command: trimmed,
      description: trimmed.substring(0, 50),
      dependsOn: [],
    }];
  }

  private shortId(): string {
    return Math.random().toString(36).substring(2, 8);
  }
}
