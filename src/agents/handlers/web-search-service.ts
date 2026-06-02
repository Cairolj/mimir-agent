import type { WebSearchResult, IWebSearchService } from '../types.js';

const DDG_API = 'https://api.duckduckgo.com/';

export class WebSearchService implements IWebSearchService {
  private timeoutMs: number;

  constructor(timeoutMs = 10_000) {
    this.timeoutMs = timeoutMs;
  }

  async search(query: string): Promise<WebSearchResult> {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      no_html: '1',
      skip_disambig: '1',
    });

    const url = `${DDG_API}?${params.toString()}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`DuckDuckGo API returned ${response.status}`);
      }

      const text = await response.text();
      if (!text) return { query, relatedTopics: [] };
      const data = JSON.parse(text);
      return parseDdgResponse(query, data);
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

}


export function formatToText(result: WebSearchResult): string {
  const parts: string[] = [];

  if (result.heading) {
    parts.push(`# ${result.heading}`);
  }

  if (result.abstract) {
    parts.push(result.abstract);
    if (result.source) {
      parts.push(`Source: ${result.source}`);
    }
  }

  if (result.image) {
    parts.push(`Image: ${result.image}`);
  }

  if (result.relatedTopics.length > 0) {
    parts.push('Related topics:');
    for (const topic of result.relatedTopics) {
      parts.push(`- ${topic.text} (${topic.url})`);
    }
  }

  if (result.infobox) {
    parts.push(`---\n${result.infobox.heading}: ${result.infobox.content}`);
    if (result.infobox.url) {
      parts.push(`Info: ${result.infobox.url}`);
    }
  }

  return parts.join('\n') || 'No se encontraron resultados.';
}

interface DdgResponse {
  Abstract?: string;
  AbstractSource?: string;
  Heading?: string;
  Image?: string;
  RelatedTopics?: Array<{ Text?: string; FirstURL?: string; Topics?: Array<{ Text?: string; FirstURL?: string }> }>;
  Infobox?: { content?: string; meta?: Array<{ label?: string; value?: string }>; url?: string };
}

function parseDdgResponse(query: string, data: DdgResponse): WebSearchResult {
  const result: WebSearchResult = { query, relatedTopics: [] };

  if (data.Abstract) result.abstract = data.Abstract;
  if (data.AbstractSource) result.source = data.AbstractSource;
  if (data.Heading) result.heading = data.Heading;
  if (data.Image) result.image = data.Image;

  if (data.RelatedTopics) {
    for (const topic of data.RelatedTopics) {
      if (topic.Text && topic.FirstURL) {
        result.relatedTopics.push({ text: topic.Text, url: topic.FirstURL });
      } else if (topic.Topics) {
        for (const sub of topic.Topics) {
          if (sub.Text && sub.FirstURL) {
            result.relatedTopics.push({ text: sub.Text, url: sub.FirstURL });
          }
        }
      }
    }
  }

  if (data.Infobox) {
    result.infobox = {
      heading: data.Infobox.content || '',
      content: data.Infobox.meta?.map(m => `${m.label}: ${m.value}`).join(', ') || '',
      url: data.Infobox.url,
    };
  }

  return result;
}
