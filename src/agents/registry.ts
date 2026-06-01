import { nanoid } from 'nanoid';
import type { AgentType, AgentConfig } from '../types.js';

interface AgentDefinition {
  type: AgentType;
  tools: string[];
}

export class AgentRegistry {
  private definitions = new Map<AgentType, AgentDefinition>();
  private instances: AgentConfig[] = [];

  register(type: AgentType, tools: string[]): void {
    this.definitions.set(type, { type, tools });
  }

  list(): AgentDefinition[] {
    return Array.from(this.definitions.values());
  }

  getTools(type: AgentType): string[] {
    const def = this.definitions.get(type);
    if (!def) throw new Error(`Unknown agent type: ${type}`);
    return def.tools;
  }

  spawn(type: AgentType, count = 1): AgentConfig[] {
    const def = this.definitions.get(type);
    if (!def) throw new Error(`Unknown agent type: ${type}`);
    const instances: AgentConfig[] = [];
    for (let i = 0; i < count; i++) {
      instances.push({ id: `${type}-${nanoid(8)}`, type, mode: 'auto', tools: def.tools });
    }
    this.instances.push(...instances);
    return instances;
  }

  getInstances(): AgentConfig[] {
    return this.instances;
  }
}
