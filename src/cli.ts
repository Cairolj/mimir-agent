import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { MimirServer } from './server.js';

const command = process.argv[2];

async function main() {
  switch (command) {
    case 'start': {
      console.error('Starting Mimir MCP server on stdio...');
      const dbPath = getDbPath();
      ensureDir(dbPath);
      await new MimirServer(dbPath).start();
      break;
    }
      break;
    case 'query': {
      const description = process.argv[3];
      if (!description) { console.error('Usage: mimir query <description>'); process.exit(1); }
      const dbPath = getDbPath();
      ensureDir(dbPath);
      const result = await new MimirServer(dbPath).executeTool('mimir_get_advice', { description });
      console.log(result.content[0].text);
      process.exit(0);
      break;
    }
    case 'stats': {
      const dbPath = getDbPath();
      ensureDir(dbPath);
      const result = await new MimirServer(dbPath).executeTool('mimir_get_stats', {});
      console.log(result.content[0].text);
      process.exit(0);
      break;
    }
    case 'submit': {
      const description = process.argv[3];
      const context = process.argv[4] || '{}';
      if (!description) { console.error('Usage: mimir submit <description> [context_json]'); process.exit(1); }
      const dbPath = getDbPath();
      ensureDir(dbPath);
      const result = await new MimirServer(dbPath).executeTool('mimir_submit_task', { description, context });
      console.log(result.content[0].text);
      process.exit(0);
      break;
    }
    case 'agents': {
      const dbPath = getDbPath();
      ensureDir(dbPath);
      const result = await new MimirServer(dbPath).executeTool('mimir_list_agents', {});
      console.log(result.content[0].text);
      process.exit(0);
      break;
    }
    case 'run': {
      const description = process.argv[3];
      if (!description) { console.error('Usage: mimir run <description>'); process.exit(1); }
      const dbPath = getDbPath();
      ensureDir(dbPath);
      const result = await new MimirServer(dbPath).executeTool('mimir_run_task', { description });
      const data = JSON.parse(result.content[0].text);
      console.log(JSON.stringify(data, null, 2));
      process.exit(0);
      break;
    }
    case 'help':
    case '--help': {
      console.log(`
Mimir — Multi-Agent Self-Improving System

Usage:
  mimir                    Start MCP server (stdio mode, default)
  mimir start              Start MCP server (stdio mode)
  mimir query <desc>       Get advice from past experiences
  mimir submit <desc>      Submit a task to learn from
  mimir stats              Show learning statistics
  mimir agents             List available agent types
  mimir run <desc>         Run a task through agent orchestration
      `);
      process.exit(0);
    }
    default: {
      console.error('Starting Mimir MCP server on stdio...');
      const dbPath = getDbPath();
      ensureDir(dbPath);
      await new MimirServer(dbPath).start();
      break;
    }
  }
}

function getDbPath(): string {
  const envPath = process.env.MIMIR_DB_PATH;
  if (envPath) return envPath;
  const home = process.env.HOME || process.env.USERPROFILE || '.';
  return `${home}/.mimir/experience.db`;
}

function ensureDir(filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
}

main().catch((err) => { console.error('Error:', err.message); process.exit(1); });
