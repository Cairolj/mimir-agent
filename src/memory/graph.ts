import type { MemoryStore } from './store.js';
import type { Experience } from '../types.js';

export interface StrategyResult {
  strategy: string[];
  confidence: number;
  lesson?: string;
}

export class ExperienceGraph {
  constructor(private store: MemoryStore) {}

  getBestStrategy(description: string): StrategyResult | undefined {
    const experiences = this.store.findSimilar(description);
    if (experiences.length === 0) return undefined;

    const successful = experiences.filter(e => e.result === 'success');
    if (successful.length === 0) return undefined;

    const best = successful.reduce((a, b) => a.weight > b.weight ? a : b);
    return {
      strategy: best.strategy,
      confidence: best.weight,
      lesson: best.lesson,
    };
  }

  getLessons(description: string): string[] {
    const experiences = this.store.findSimilar(description);
    const lessons = new Set<string>();
    for (const e of experiences) {
      if (e.lesson) lessons.add(e.lesson);
    }
    return Array.from(lessons);
  }

  findByContext(context: Record<string, string>): Experience[] {
    // TODO: optimize — findSimilar('') returns all records via LIKE '%%'
    const all = this.store.findSimilar('');
    return all.filter(e => {
      return Object.entries(context).some(([k, v]) =>
        e.context[k]?.toLowerCase().includes(v.toLowerCase())
      );
    });
  }

  getGraphStats(): { totalExperiences: number; totalSignals: number; successRate: number; uniqueStrategies: number } {
    const stats = this.store.getStats();
    // TODO: optimize — findSimilar('') returns all records via LIKE '%%'
    const all = this.store.findSimilar('');
    const successes = all.filter(e => e.result === 'success').length;
    return {
      totalExperiences: stats.totalTasks,
      totalSignals: stats.totalSignals,
      successRate: all.length > 0 ? successes / all.length : 0,
      uniqueStrategies: new Set(all.map(e => JSON.stringify(e.strategy))).size,
    };
  }
}
