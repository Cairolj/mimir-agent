import { describe, it, expect } from 'vitest';
import { createMimirServer } from '../../src/server';

describe('MimirServer', () => {
  it('should create server with tools', () => {
    const server = createMimirServer(':memory:');
    const tools = server.getToolDefinitions();
    expect(tools.length).toBeGreaterThan(0);
    const toolNames = tools.map(t => t.name);
    expect(toolNames).toContain('mimir_submit_task');
    expect(toolNames).toContain('mimir_get_advice');
  });

  it('should submit and process a task', async () => {
    const server = createMimirServer(':memory:');
    const result = await server.executeTool('mimir_submit_task', {
      description: 'test task',
      context: JSON.stringify({ test: true }),
    });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.id).toBeDefined();
    expect(parsed.status).toBe('pending');
  });

  it('should return advice for known patterns', async () => {
    const server = createMimirServer(':memory:');
    await server.executeTool('mimir_submit_task', {
      description: 'install dependencies',
      context: JSON.stringify({ os: 'linux' }),
    });
    const result = await server.executeTool('mimir_get_advice', {
      description: 'install dependencies linux',
    });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.found).toBeDefined();
  });

  it('should list available agents', async () => {
    const server = createMimirServer(':memory:');
    const result = await server.executeTool('mimir_list_agents', {});
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.agents.length).toBeGreaterThan(0);
  });

  it('should run a task and return execution results', async () => {
    const mockPlanner = {
      decompose: async (description: string) => [{
        id: 's1',
        agentType: 'executor' as const,
        command: description,
        description: description.substring(0, 20),
        dependsOn: [] as string[],
      }],
    };
    const server = createMimirServer(':memory:', mockPlanner);
    const result = await server.executeTool('mimir_run_task', { description: 'echo hello from mimir' });
    const data = JSON.parse(result.content[0].text);
    expect(data.taskDescription).toBe('echo hello from mimir');
    expect(data.results.length).toBeGreaterThan(0);
    expect(data.totalDuration).toBeGreaterThan(0);
  }, 15000);
});
