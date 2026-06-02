import { describe, it, expect } from 'vitest';
import { WebSearchService, formatToText } from '../../../src/agents/handlers/web-search-service.js';

describe('WebSearchService', () => {
  const service = new WebSearchService();

  it('should return rich results for a real query', async () => {
    const result = await service.search('JavaScript');
    expect(result.query).toBe('JavaScript');
    // DuckDuckGo should return at least some fields
    expect(result.relatedTopics.length).toBeGreaterThan(0);
  }, 15000);

  it('should handle empty query', async () => {
    const result = await service.search('');
    expect(result.relatedTopics).toEqual([]);
  }, 10000);

  it('should return gracefully on network failure', async () => {
    const failService = new WebSearchService(1);
    const result = await failService.search('test');
    expect(result.relatedTopics).toEqual([]);
  }, 10000);

  it('should format result to text with heading and topics', async () => {
    const result = await service.search('TypeScript');
    const text = formatToText(result);
    expect(text.length).toBeGreaterThan(0);
    if (result.heading) expect(text).toContain(result.heading);
    if (result.abstract) expect(text).toContain(result.abstract);
  }, 15000);
});
