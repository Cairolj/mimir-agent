import { describe, it, expect } from 'vitest';
import { AgentRegistry } from '../../src/agents/registry';
import type { AgentType } from '../../src/types';

describe('AgentRegistry', () => {
  it('should register and list agent types', () => {
    const registry = new AgentRegistry();
    registry.register('investigator' as AgentType, ['web_search', 'fetch_url', 'scrape']);
    expect(registry.list()).toHaveLength(1);
    expect(registry.list()[0].type).toBe('investigator');
  });

  it('should return tools for a registered agent', () => {
    const registry = new AgentRegistry();
    registry.register('executor' as AgentType, ['git_clone', 'write_file', 'exec_cmd']);
    const tools = registry.getTools('executor' as AgentType);
    expect(tools).toEqual(['git_clone', 'write_file', 'exec_cmd']);
  });

  it('should throw for unregistered agent type', () => {
    const registry = new AgentRegistry();
    expect(() => registry.getTools('nonexistent' as AgentType)).toThrow();
  });

  it('should spawn multiple instances of same type', () => {
    const registry = new AgentRegistry();
    registry.register('investigator' as AgentType, ['web_search']);
    const instances = registry.spawn('investigator' as AgentType, 3);
    expect(instances).toHaveLength(3);
    expect(instances[0].id).not.toBe(instances[1].id);
  });
});
