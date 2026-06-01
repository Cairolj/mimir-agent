import { describe, it, expect, beforeAll } from 'vitest';
import { createMimirServer } from '../src/server';

describe('Mimir Integration', () => {
  let server: ReturnType<typeof createMimirServer>;

  beforeAll(() => {
    server = createMimirServer(':memory:');
  });

  it('full cycle: submit task -> get advice -> check stats', async () => {
    const tasks = [
      { desc: 'install express server', ctx: { os: 'linux', pkg: 'npm' } },
      { desc: 'install express server', ctx: { os: 'windows', pkg: 'npm' } },
      { desc: 'install express server', ctx: { os: 'macos', pkg: 'npm' } },
      { desc: 'deploy react app', ctx: { target: 'vercel' } },
      { desc: 'deploy react app', ctx: { target: 'netlify' } },
    ];

    for (const task of tasks) {
      await server.executeTool('mimir_submit_task', {
        description: task.desc,
        context: JSON.stringify(task.ctx),
      });
    }

    const adviceResult = await server.executeTool('mimir_get_advice', {
      description: 'install express server linux',
    });
    const advice = JSON.parse(adviceResult.content[0].text);
    expect(advice.found).toBe(true);

    const statsResult = await server.executeTool('mimir_get_stats', {});
    const stats = JSON.parse(statsResult.content[0].text);
    expect(stats.totalExperiences).toBe(5);
  });

  it('should spawn multiple agents', async () => {
    const result = await server.executeTool('mimir_spawn_agents', {
      type: 'investigator',
      count: 3,
    });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.spawned).toBe(3);
  });

  it('should handle unknown tasks gracefully', async () => {
    const result = await server.executeTool('mimir_get_advice', {
      description: 'something never seen before qwerty',
    });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.found).toBe(false);
  });

  it('should list all agent types', async () => {
    const result = await server.executeTool('mimir_list_agents', {});
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.agents.length).toBe(5);
    const types = parsed.agents.map((a: any) => a.type);
    expect(types).toContain('investigator');
    expect(types).toContain('executor');
    expect(types).toContain('validator');
    expect(types).toContain('planner');
    expect(types).toContain('critic');
  });
});
