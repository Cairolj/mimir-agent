import type { MemoryStore } from './store.js';
import { ExperienceGraph, type StrategyResult } from './graph.js';

export interface TaskRecord {
  id: string;
  description: string;
  context: Record<string, string>;
  strategy: string[];
  result: 'success' | 'failure';
  attempts: number;
  duration: number;
  error?: string;
}

export class LearningEngine {
  private graph: ExperienceGraph;

  constructor(private store: MemoryStore) {
    this.graph = new ExperienceGraph(store);
  }

  recordTask(task: TaskRecord): void {
    const { id, description, context, strategy, result, attempts, error } = task;

    const experience = this.store.saveExperience({
      taskDescription: description,
      context,
      strategy,
      result,
      attempts,
      error,
      lesson: this.generateLesson(task),
      weight: result === 'success' ? 0.9 : 0.3,
    });

    this.store.saveSignal({
      taskId: id,
      success: result === 'success',
      attempts,
      error,
      duration: task.duration,
    });

    if (result === 'success') {
      this.store.reinforceExperience(experience.id, 0.95);
    }
  }

  getAdvice(description: string): StrategyResult | null {
    return this.graph.getBestStrategy(description) ?? null;
  }

  getLessons(description: string): string[] {
    return this.graph.getLessons(description);
  }

  getStats(): { totalExperiences: number; totalSignals: number; successRate: number; uniqueStrategies: number } {
    return this.graph.getGraphStats();
  }

  private generateLesson(task: TaskRecord): string | undefined {
    if (task.result === 'success') return undefined;
    if (!task.error) return undefined;

    const patterns: Array<{ match: string; lesson: string }> = [
      { match: 'eacces', lesson: 'EACCES: permission denied — try with --no-optional, sudo, or nvm prefix' },
      { match: 'etimeout', lesson: 'ETIMEOUT: connection timeout — check network or use a mirror/registry' },
      { match: 'not found', lesson: 'NOT_FOUND: resource not found — verify the path, URL, or package name' },
      { match: 'econnrefused', lesson: 'ECONNREFUSED: connection refused — ensure the service is running on that port' },
      { match: 'eaddrinuse', lesson: 'EADDRINUSE: port already in use — use a different port or kill the existing process' },
    ];

    const lowerError = task.error.toLowerCase();
    for (const p of patterns) {
      if (lowerError.includes(p.match)) {
        return p.lesson;
      }
    }

    return `error: ${task.error}. strategy used: ${task.strategy.join(' -> ')}. try ${task.attempts} attempt(s).`;
  }
}
