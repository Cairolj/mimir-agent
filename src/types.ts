export type AgentType = 'investigator' | 'executor' | 'validator' | 'planner' | 'critic';
export type AgentMode = 'auto' | 'manual';
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';
export type TaskResult = 'success' | 'failure';

export interface Task {
  id: string;
  description: string;
  context: Record<string, string>;
  status: TaskStatus;
  result?: TaskResult;
  error?: string;
  attempts: number;
  createdAt: string;
  completedAt?: string;
  strategy?: string[];
}

export interface Experience {
  id: string;
  taskDescription: string;
  context: Record<string, string>;
  strategy: string[];
  result: TaskResult;
  error?: string;
  attempts: number;
  lesson?: string;
  weight: number;
  createdAt: string;
}

export interface AgentConfig {
  id: string;
  type: AgentType;
  mode: AgentMode;
  tools: string[];
}

export interface Strategy {
  description: string;
  steps: string[];
  confidence: number;
  source: string;
}

export interface LearningSignal {
  taskId: string;
  success: boolean;
  attempts: number;
  error?: string;
  duration: number;
}
