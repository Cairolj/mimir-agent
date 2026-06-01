import { describe, it, expect, beforeEach } from 'vitest';
import { createStore, type MemoryStore } from '../../src/memory/store';
import { ExperienceGraph } from '../../src/memory/graph';

describe('ExperienceGraph', () => {
  let store: MemoryStore;
  let graph: ExperienceGraph;

  beforeEach(() => {
    store = createStore(':memory:');
    graph = new ExperienceGraph(store);
  });

  it('should return best strategy for matching task', () => {
    store.saveExperience({
      taskDescription: 'deploy express server',
      context: { platform: 'linux' },
      strategy: ['install deps', 'configure port', 'start with pm2'],
      result: 'success',
      attempts: 1,
      weight: 0.95,
    });
    store.saveExperience({
      taskDescription: 'deploy express server',
      context: { platform: 'windows' },
      strategy: ['install deps --no-optional', 'configure port', 'start with nodemon'],
      result: 'failure',
      attempts: 3,
      weight: 0.3,
    });

    const result = graph.getBestStrategy('deploy express server linux');
    expect(result).toBeDefined();
    expect(result!.strategy).toEqual(['install deps', 'configure port', 'start with pm2']);
    expect(result!.confidence).toBeCloseTo(0.95);
  });

  it('should return undefined for unknown tasks', () => {
    const result = graph.getBestStrategy('completely unknown thing');
    expect(result).toBeUndefined();
  });

  it('should extract lessons from failed experiences', () => {
    store.saveExperience({
      taskDescription: 'run npm install',
      context: { os: 'windows' },
      strategy: ['npm install -g'],
      result: 'failure',
      attempts: 3,
      error: 'EACCES',
      lesson: 'on windows, use --no-optional to avoid permission errors',
      weight: 0.8,
    });

    const lessons = graph.getLessons('npm install windows');
    expect(lessons.length).toBeGreaterThan(0);
    expect(lessons[0]).toContain('--no-optional');
  });

  it('should find related experiences by context similarity', () => {
    store.saveExperience({
      taskDescription: 'setup database',
      context: { db: 'postgres', orm: 'prisma' },
      strategy: ['install prisma', 'run prisma init', 'configure schema'],
      result: 'success',
      attempts: 1,
      weight: 0.9,
    });

    const related = graph.findByContext({ db: 'postgres' });
    expect(related.length).toBeGreaterThan(0);
    expect(related[0].taskDescription).toContain('database');
  });

  it('should get aggregate stats', () => {
    store.saveExperience({
      taskDescription: 'test stats',
      context: {},
      strategy: ['do thing'],
      result: 'success',
      attempts: 1,
      weight: 1.0,
    });

    const stats = graph.getGraphStats();
    expect(stats.totalExperiences).toBeGreaterThan(0);
    expect(stats.successRate).toBeGreaterThan(0);
  });
});
