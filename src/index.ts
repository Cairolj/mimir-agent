import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { MimirServer } from './server.js';

const dbPath = getDbPath();
mkdirSync(dirname(dbPath), { recursive: true });

const server = new MimirServer(dbPath);
server.start().catch((err) => {
  console.error('Mimir failed to start:', err);
  process.exit(1);
});

function getDbPath(): string {
  const envPath = process.env.MIMIR_DB_PATH;
  if (envPath) return envPath;
  const home = process.env.HOME || process.env.USERPROFILE || '.';
  return `${home}/.mimir/experience.db`;
}
