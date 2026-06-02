import type { AgentType } from '../types.js';

export interface TaskStep {
  id: string;
  agentType: AgentType;
  command: string;
  description: string;
  dependsOn: string[];
}

export interface StepResult {
  stepId: string;
  agentId: string;
  agentType: AgentType;
  status: 'success' | 'failure';
  output: string;
  error?: string;
  duration: number;
}

export interface RunResult {
  taskDescription: string;
  plan: TaskStep[];
  results: StepResult[];
  totalDuration: number;
  success: boolean;
}

export interface AgentActor {
  type: AgentType;
  execute(step: TaskStep): Promise<StepResult>;
}

export interface WebSearchResult {
  query: string;
  abstract?: string;
  source?: string;
  heading?: string;
  image?: string;
  relatedTopics: Array<{ text: string; url: string }>;
  infobox?: { heading: string; content: string; url?: string };
}

export interface IWebSearchService {
  search(query: string): Promise<WebSearchResult>;
}
