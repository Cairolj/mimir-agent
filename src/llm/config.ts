import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import type { LLMConfig, LLMProviderName } from './types.js';

interface ConfigFile {
  llm?: {
    provider?: string;
    openaiKey?: string;
    anthropicKey?: string;
    ollamaUrl?: string;
    ollamaModel?: string;
    model?: string;
  };
}

function readConfigFile(): ConfigFile {
  const configPath = join(homedir(), '.mimir', 'config.json');
  if (!existsSync(configPath)) return {};
  try {
    return JSON.parse(readFileSync(configPath, 'utf-8'));
  } catch {
    return {};
  }
}

export function loadLLMConfig(): LLMConfig {
  const file = readConfigFile();

  const provider = (process.env.MIMIR_LLM_PROVIDER || file.llm?.provider || '') as LLMProviderName;
  if (!provider) {
    throw new Error('No LLM provider configured. Set MIMIR_LLM_PROVIDER=ollama|openai|anthropic or create ~/.mimir/config.json');
  }

  return {
    provider,
    openaiKey: process.env.MIMIR_OPENAI_KEY || file.llm?.openaiKey,
    anthropicKey: process.env.MIMIR_ANTHROPIC_KEY || file.llm?.anthropicKey,
    ollamaUrl: process.env.MIMIR_OLLAMA_URL || file.llm?.ollamaUrl || 'http://localhost:11434',
    ollamaModel: process.env.MIMIR_OLLAMA_MODEL || file.llm?.ollamaModel || 'llama3.2',
    model: process.env.MIMIR_LLM_MODEL || file.llm?.model,
  };
}
