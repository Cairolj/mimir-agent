import { describe, it, expect, beforeEach } from 'vitest';
import { createStore, type MemoryStore } from '../../src/memory/store';

describe('MemoryStore', () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = createStore(':memory:');
  });

  it('should save and retrieve an experience', () => {
    const exp = store.saveExperience({
      taskDescription: 'install npm package',
      context: { os: 'windows', runtime: 'node20' },
      strategy: ['npm install --no-optional'],
      result: 'success',
      attempts: 1,
      weight: 1.0,
    });
    expect(exp.id).toBeDefined();
    const found = store.getExperience(exp.id);
    expect(found).toBeDefined();
    expect(found!.taskDescription).toBe('install npm package');
  });

  it('should find similar experiences by description', () => {
    store.saveExperience({
      taskDescription: 'install npm package',
      context: {},
      strategy: [],
      result: 'success',
      attempts: 1,
      weight: 1.0,
    });
    const results = store.findSimilar('install npm');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].taskDescription).toContain('install npm');
  });

  it('should record a learning signal', () => {
    store.saveExperience({
      taskDescription: 'test task',
      context: {},
      strategy: [],
      result: 'success',
      attempts: 1,
      weight: 1.0,
    });
    store.saveSignal({
      taskId: 'test-1',
      success: true,
      attempts: 2,
      duration: 5000,
    });
    const stats = store.getStats();
    expect(stats.totalTasks).toBeGreaterThan(0);
    expect(stats.totalSignals).toBeGreaterThan(0);
  });

  it('should update experience weight on reuse', () => {
    const exp = store.saveExperience({
      taskDescription: 'test weight update',
      context: {},
      strategy: ['step 1'],
      result: 'success',
      attempts: 1,
      weight: 0.5,
    });
    store.reinforceExperience(exp.id, 0.9);
    const updated = store.getExperience(exp.id);
    expect(updated!.weight).toBeCloseTo(0.7);
  });
});
