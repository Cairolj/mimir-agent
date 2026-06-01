import { describe, it, expect, beforeEach } from 'vitest';
import { createStore, type MemoryStore } from '../../src/memory/store';
import { LearningEngine } from '../../src/memory/learning';

describe('LearningEngine', () => {
  let store: MemoryStore;
  let engine: LearningEngine;

  beforeEach(() => {
    store = createStore(':memory:');
    engine = new LearningEngine(store);
  });

  it('should record a successful task and reinforce its strategy', () => {
    engine.recordTask({
      id: 'task-1',
      description: 'deploy with docker',
      context: { env: 'production' },
      strategy: ['build image', 'tag', 'push', 'deploy'],
      result: 'success',
      attempts: 1,
      duration: 30000,
    });

    const best = engine.getAdvice('deploy with docker production');
    expect(best).toBeDefined();
    expect(best!.strategy).toEqual(['build image', 'tag', 'push', 'deploy']);
  });

  it('should record a failed task and extract lesson', () => {
    engine.recordTask({
      id: 'task-2',
      description: 'run npm install',
      context: { os: 'windows' },
      strategy: ['npm install -g'],
      result: 'failure',
      attempts: 3,
      duration: 15000,
      error: 'EACCES permission denied',
    });

    const lessons = engine.getLessons('npm install');
    expect(lessons.length).toBeGreaterThan(0);
    expect(lessons[0]).toContain('EACCES');
  });

  it('should improve advice as more data accumulates', () => {
    for (let i = 0; i < 5; i++) {
      engine.recordTask({
        id: `task-cache-${i}`,
        description: 'setup cache',
        context: { provider: 'redis' },
        strategy: ['install redis', 'configure', 'test connection'],
        result: 'success',
        attempts: 1,
        duration: 10000,
      });
    }
    engine.recordTask({
      id: 'task-cache-bad',
      description: 'setup cache',
      context: { provider: 'redis' },
      strategy: ['install memcached', 'configure', 'test connection'],
      result: 'failure',
      attempts: 2,
      duration: 20000,
      error: 'wrong cache provider',
    });

    const advice = engine.getAdvice('setup cache with redis');
    expect(advice).toBeDefined();
    expect(advice!.strategy[0]).toContain('redis');
  });

  it('should return null for unknown tasks', () => {
    const advice = engine.getAdvice('completely unknown task xyz123');
    expect(advice).toBeNull();
  });
});
