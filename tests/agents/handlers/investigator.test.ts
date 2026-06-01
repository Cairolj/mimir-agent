import { describe, it, expect } from 'vitest';
import { InvestigatorHandler } from '../../../src/agents/handlers/investigator';

describe('InvestigatorHandler', () => {
  const investigator = new InvestigatorHandler();

  it('should fetch a URL', async () => {
    const step = { id: 's1', agentType: 'investigator' as const, command: 'https://example.com', description: '', dependsOn: [] };
    const result = await investigator.execute(step);
    expect(result.status).toBe('success');
    expect(result.output.length).toBeGreaterThan(0);
  }, 15000);

  it('should handle invalid URL', async () => {
    const step = { id: 's2', agentType: 'investigator' as const, command: 'https://this-domain-does-not-exist-12345.com', description: '', dependsOn: [] };
    const result = await investigator.execute(step);
    expect(result.status).toBe('failure');
    expect(result.error).toBeTruthy();
  }, 15000);
});
