import { describe, it, expect } from 'vitest';
import { WebSearchService } from '../../../src/agents/handlers/web-search-service.js';

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

  it('should handle timeout', async () => {
    const slowService = new WebSearchService(1);
    const result = await slowService.search('test');
    expect(result.relatedTopics).toEqual([]);
  }, 10000);

  it('should format result to text', async () => {
    const result = await service.search('TypeScript');
    const text = WebSearchService.formatToText(result);
    expect(text.length).toBeGreaterThan(0);
    expect(text).toContain('TypeScript');
  }, 15000);
});
