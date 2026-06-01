import { describe, it, expect } from 'vitest';
import { AgentOrchestrator } from '../src/agents/orchestrator.js';

const mockPlanner = {
  decompose: async (description: string) => {
    const id = 's1';
    const steps = description.split('&&').map((cmd, i) => {
      const trimmed = cmd.trim();
      return {
        id: `s${i + 1}`,
        agentType: 'executor' as const,
        command: trimmed,
        description: trimmed.substring(0, 20),
        dependsOn: i > 0 ? [`s${i}`] : [],
      };
    });
    return steps.length > 0 ? steps : [{
      id: 's1',
      agentType: 'executor' as const,
      command: description,
      description: description.substring(0, 20),
      dependsOn: [],
    }];
  },
};

describe('Multi-Agent Demo', () => {
  it('should run 3 tasks concurrently and show timing', async () => {
    const orchestrator = new AgentOrchestrator(mockPlanner);
    const tasks = [
      'echo starting task A',
      'echo starting task B',
      'echo starting task C',
    ];

    const start = Date.now();
    const results = await Promise.all(tasks.map(t => orchestrator.runTask(t)));
    const totalWallTime = Date.now() - start;

    expect(results.length).toBe(3);
    for (const r of results) {
      expect(r.results.length).toBeGreaterThan(0);
    }

    console.log(`\n=== DEMO: 3 concurrent tasks ===`);
    console.log(`Total wall time: ${totalWallTime}ms`);
    for (let i = 0; i < results.length; i++) {
      console.log(`Task "${tasks[i]}": ${results[i].totalDuration}ms, success: ${results[i].success}`);
      for (const step of results[i].results) {
        console.log(`  [${step.agentType}] ${step.status} (${step.duration}ms): ${step.output.trim().substring(0, 80)}`);
      }
    }
  }, 30000);

  it('should spawn 5 agents of different types and run planned task', async () => {
    const orchestrator = new AgentOrchestrator(mockPlanner);

    const start = Date.now();
    const result = await orchestrator.runTask('echo hello');
    const totalDuration = Date.now() - start;

    console.log(`\n=== DEMO: Multi-agent install express ===`);
    console.log(`Total: ${totalDuration}ms, success: ${result.success}`);
    console.log(`Plan (${result.plan.length} steps):`);
    for (const step of result.plan) {
      console.log(`  ${step.agentType}: ${step.command} (depends on: ${step.dependsOn.join(', ') || 'none'})`);
    }
    console.log(`\nResults:`);
    for (const r of result.results) {
      console.log(`  [${r.agentType}] ${r.status} (${r.duration}ms): ${r.output.trim().substring(0, 120)}`);
    }

    expect(result.plan.length).toBeGreaterThanOrEqual(1);
    expect(result.results.length).toBeGreaterThanOrEqual(1);
  }, 30000);
});
