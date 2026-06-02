import { describe, it, expect } from 'vitest';
import { InvestigatorHandler } from '../../../src/agents/handlers/investigator';
import { WebSearchService } from '../../../src/agents/handlers/web-search-service.js';

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

  it('should reject search command without WebSearchService', async () => {
    const step = { id: 's5', agentType: 'investigator' as const, command: 'search:test', description: '', dependsOn: [] };
    const result = await investigator.execute(step);
    expect(result.status).toBe('failure');
    expect(result.error).toContain('requires a WebSearchService');
  });
});

describe('InvestigatorHandler with WebSearchService', () => {
  const webSearch = new WebSearchService();
  const investigator = new InvestigatorHandler(10_000, webSearch);

  it('should execute a search command', async () => {
    const step = { id: 's3', agentType: 'investigator' as const, command: 'search:TypeScript', description: '', dependsOn: [] };
    const result = await investigator.execute(step);
    expect(result.status).toBe('success');
    expect(result.output.length).toBeGreaterThan(0);
  }, 15000);

  it('should still fetch URLs normally', async () => {
    const step = { id: 's4', agentType: 'investigator' as const, command: 'https://example.com', description: '', dependsOn: [] };
    const result = await investigator.execute(step);
    expect(result.status).toBe('success');
    expect(result.output).toContain('Example');
  }, 15000);
});
