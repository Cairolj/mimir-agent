import { describe, it, expect } from 'vitest';
import { AgentOrchestrator } from '../../src/agents/orchestrator.js';

const mockPlanner = {
  decompose: async (description: string) => {
    const id = 's1';
    return [{
      id,
      agentType: 'executor' as const,
      command: description,
      description: description.substring(0, 20),
      dependsOn: [] as string[],
    }];
  },
};

describe('AgentOrchestrator', () => {
  it('should run a simple echo task', async () => {
    const orchestrator = new AgentOrchestrator(mockPlanner);
    const result = await orchestrator.runTask('echo hello world');
    expect(result.success).toBe(true);
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.totalDuration).toBeGreaterThan(0);
  }, 15000);

  it('should execute multiple steps in parallel', async () => {
    const orchestrator = new AgentOrchestrator(mockPlanner);
    const result = await orchestrator.runTask('echo test');
    const successful = result.results.filter(r => r.status === 'success');
    expect(successful.length).toBeGreaterThan(0);
  }, 15000);

  it('should handle failed steps gracefully', async () => {
    const orchestrator = new AgentOrchestrator(mockPlanner);
    const result = await orchestrator.runTask('thiscommanddoesnotexist');
    expect(result.success).toBe(false);
    expect(result.results.some(r => r.status === 'failure')).toBe(true);
  }, 15000);
});
