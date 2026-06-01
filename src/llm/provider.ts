import { nanoid } from 'nanoid';
import type { LLMConfig, LLMProvider } from './types.js';

export async function createProvider(config: LLMConfig): Promise<LLMProvider> {
  switch (config.provider) {
    case 'ollama': {
      const { OllamaProvider } = await import('./adapters/ollama.js');
      return new OllamaProvider(config);
    }
    case 'openai': {
      const { OpenAIProvider } = await import('./adapters/openai.js');
      return new OpenAIProvider(config);
    }
    case 'anthropic': {
      const { AnthropicProvider } = await import('./adapters/anthropic.js');
      return new AnthropicProvider(config);
    }
    default:
      throw new Error(`Unknown LLM provider: ${config.provider}`);
  }
}

export const SYSTEM_PROMPT = `You are a task planner. Given a task description, decompose it into a sequence of shell commands.

Available agent types:
- executor: runs shell commands via child_process.exec
- investigator: fetches HTTP URLs

Return a JSON array of steps:
[
  {
    "agentType": "executor",
    "command": "the shell command to run",
    "description": "what this step does in 5 words",
    "dependsOn": ["id-of-step-that-must-complete-first"]
  }
]

Rules:
- Each step must have a unique id (use short random strings)
- Steps that depend on previous steps must list those step ids in dependsOn
- Steps with empty dependsOn can run in parallel
- Keep commands simple and focused on one thing per step

Task: `;

export function parseStepResponse(text: string): any[] {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('LLM response did not contain valid JSON array');
  const steps = JSON.parse(jsonMatch[0]);
  return steps.map((s: any) => ({
    id: s.id || nanoid(8),
    agentType: s.agentType || 'executor',
    command: s.command || '',
    description: s.description || '',
    dependsOn: s.dependsOn || [],
  }));
}
