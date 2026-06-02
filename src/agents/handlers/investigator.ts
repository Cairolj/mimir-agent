import { nanoid } from 'nanoid';
import type { TaskStep, StepResult } from '../types.js';
import type { IWebSearchService } from '../types.js';
import { formatToText } from './web-search-service.js';

export class InvestigatorHandler {
  private timeoutMs: number;
  private webSearch: IWebSearchService | null;

  constructor(timeoutMs = 10_000, webSearch?: IWebSearchService) {
    this.timeoutMs = timeoutMs;
    this.webSearch = webSearch ?? null;
  }

  get type() { return 'investigator' as const; }

  async execute(step: TaskStep): Promise<StepResult> {
    const start = Date.now();
    if (step.command.startsWith('search:')) {
      try {
        if (!this.webSearch) {
          return {
            stepId: step.id,
            agentId: `investigator-${nanoid(8)}`,
            agentType: 'investigator',
            status: 'failure',
            output: '',
            error: 'search: command requires a WebSearchService',
            duration: Date.now() - start,
          };
        }
        const query = step.command.slice(7);
        const result = await this.webSearch.search(query);
        const output = formatToText(result);
        const duration = Date.now() - start;
        return {
          stepId: step.id,
          agentId: `investigator-${nanoid(8)}`,
          agentType: 'investigator',
          status: 'success',
          output: output.substring(0, 2000),
          duration,
        };
      } catch (err) {
        return {
          stepId: step.id,
          agentId: `investigator-${nanoid(8)}`,
          agentType: 'investigator',
          status: 'failure',
          output: '',
          error: (err as Error).message,
          duration: Date.now() - start,
        };
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(step.command, { signal: controller.signal });
      clearTimeout(timer);
      const text = await response.text();
      const duration = Date.now() - start;
      return {
        stepId: step.id,
        agentId: `investigator-${nanoid(8)}`,
        agentType: 'investigator',
        status: 'success',
        output: text.substring(0, 2000),
        duration,
      };
    } catch (err) {
      clearTimeout(timer);
      const duration = Date.now() - start;
      return {
        stepId: step.id,
        agentId: `investigator-${nanoid(8)}`,
        agentType: 'investigator',
        status: 'failure',
        output: '',
        error: (err as Error).message,
        duration,
      };
    }
  }
}
