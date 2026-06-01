import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';
import type { Experience, TaskResult, LearningSignal } from '../types.js';

interface ExperienceRow {
  id: string;
  task_description: string;
  context: string;
  strategy: string;
  result: string;
  error: string | null;
  attempts: number;
  lesson: string | null;
  weight: number;
  created_at: string;
}

export interface MemoryStore {
  saveExperience(data: Omit<Experience, 'id' | 'createdAt'>): Experience;
  getExperience(id: string): Experience | undefined;
  findSimilar(description: string, limit?: number): Experience[];
  saveSignal(signal: LearningSignal): void;
  getStats(): { totalTasks: number; totalSignals: number };
  reinforceExperience(id: string, newWeight: number): void;
  close(): void;
}

export function createStore(dbPath: string): MemoryStore {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS experiences (
      id TEXT PRIMARY KEY,
      task_description TEXT NOT NULL,
      context TEXT NOT NULL DEFAULT '{}',
      strategy TEXT NOT NULL DEFAULT '[]',
      result TEXT NOT NULL,
      error TEXT,
      attempts INTEGER NOT NULL DEFAULT 1,
      lesson TEXT,
      weight REAL NOT NULL DEFAULT 1.0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS learning_signals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT NOT NULL,
      success INTEGER NOT NULL,
      attempts INTEGER NOT NULL,
      error TEXT,
      duration INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_experiences_task
      ON experiences(task_description);
    CREATE INDEX IF NOT EXISTS idx_experiences_weight
      ON experiences(weight DESC);
  `);

  const insertExp = db.prepare(`
    INSERT INTO experiences (id, task_description, context, strategy, result, error, attempts, lesson, weight, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const getExp = db.prepare('SELECT * FROM experiences WHERE id = ?');

  const searchExp = db.prepare(`
    SELECT *, 0 as rank FROM experiences
    WHERE task_description LIKE ?
    ORDER BY weight DESC, attempts ASC
    LIMIT ?
  `);

  const insertSignal = db.prepare(`
    INSERT INTO learning_signals (task_id, success, attempts, error, duration, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const getStatsStmt = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM experiences) as totalTasks,
      (SELECT COUNT(*) FROM learning_signals) as totalSignals
  `);

  const updateWeight = db.prepare('UPDATE experiences SET weight = ? WHERE id = ?');

  function rowToExperience(row: ExperienceRow): Experience {
    return {
      id: row.id,
      taskDescription: row.task_description,
      context: JSON.parse(row.context),
      strategy: JSON.parse(row.strategy),
      result: row.result as TaskResult,
      error: row.error || undefined,
      attempts: row.attempts,
      lesson: row.lesson || undefined,
      weight: row.weight,
      createdAt: row.created_at,
    };
  }

  return {
    saveExperience(data) {
      const id = nanoid();
      const now = new Date().toISOString();
      insertExp.run(
        id, data.taskDescription, JSON.stringify(data.context),
        JSON.stringify(data.strategy), data.result, data.error || null,
        data.attempts, data.lesson || null, data.weight, now
      );
      return { ...data, id, createdAt: now };
    },

    getExperience(id) {
      const row = getExp.get(id) as ExperienceRow | undefined;
      return row ? rowToExperience(row) : undefined;
    },

    findSimilar(description, limit = 10) {
      const words = description.split(/\s+/).filter(Boolean);
      if (words.length === 0) {
        const rows = searchExp.all('%%', limit) as ExperienceRow[];
        return rows.map(rowToExperience);
      }
      const seen = new Set<string>();
      const results: Experience[] = [];
      for (const word of words) {
        const pattern = `%${word}%`;
        const rows = searchExp.all(pattern, limit) as ExperienceRow[];
        for (const exp of rows.map(rowToExperience)) {
          if (!seen.has(exp.id) && results.length < limit) {
            seen.add(exp.id);
            results.push(exp);
          }
        }
        if (results.length >= limit) break;
      }
      return results;
    },

    saveSignal(signal) {
      insertSignal.run(
        signal.taskId, signal.success ? 1 : 0,
        signal.attempts, signal.error || null,
        signal.duration, new Date().toISOString()
      );
    },

    getStats() {
      return getStatsStmt.get() as { totalTasks: number; totalSignals: number; };
    },

    reinforceExperience(id, newWeight) {
      const exp = getExp.get(id) as ExperienceRow | undefined;
      if (exp) {
        const avg = (exp.weight + newWeight) / 2;
        updateWeight.run(Math.min(avg, 1.0), id);
      }
    },

    close() {
      db.close();
    },
  };
}
