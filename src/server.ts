import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { createStore, type MemoryStore } from './memory/store.js';
import { LearningEngine } from './memory/learning.js';
import { AgentRegistry } from './agents/registry.js';
import { AgentOrchestrator } from './agents/orchestrator.js';
import { nanoid } from 'nanoid';

interface TaskRecord {
  id: string;
  description: string;
  status: string;
  createdAt: string;
}

export class MimirServer {
  private store: MemoryStore;
  private learning: LearningEngine;
  private registry: AgentRegistry;
  private orchestrator: AgentOrchestrator;
  private tasks: Map<string, TaskRecord> = new Map();
  private mcpServer: Server;

  constructor(dbPath: string) {
    this.store = createStore(dbPath);
    this.learning = new LearningEngine(this.store);
    this.registry = new AgentRegistry();
    this.orchestrator = new AgentOrchestrator();
    this.setupDefaultAgents();
    this.mcpServer = this.createMcpServer();
  }

  private setupDefaultAgents(): void {
    const types = ['investigator', 'executor', 'validator', 'planner', 'critic'] as const;
    const toolSets: Record<string, string[]> = {
      investigator: ['web_search', 'fetch_url', 'scrape'],
      executor: ['git_clone', 'write_file', 'exec_cmd', 'read_file'],
      validator: ['run_tests', 'lint_code', 'check_types'],
      planner: ['decompose_task', 'resolve_deps', 'estimate_effort'],
      critic: ['review_output', 'check_consistency', 'suggest_improvements'],
    };
    for (const type of types) {
      this.registry.register(type, toolSets[type]);
    }
  }

  getToolDefinitions(): Tool[] {
    return [
      {
        name: 'mimir_submit_task',
        description: 'Submit a task to the Mimir multi-agent system',
        inputSchema: { type: 'object', properties: { description: { type: 'string', description: 'Task description' }, context: { type: 'string', description: 'JSON context object' } }, required: ['description'] },
      },
      {
        name: 'mimir_get_advice',
        description: 'Get advice from past similar experiences',
        inputSchema: { type: 'object', properties: { description: { type: 'string', description: 'Task description to match' } }, required: ['description'] },
      },
      {
        name: 'mimir_list_agents',
        description: 'List available agent types and their tools',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'mimir_get_stats',
        description: 'Get learning statistics',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'mimir_spawn_agents',
        description: 'Spawn additional agent instances',
        inputSchema: { type: 'object', properties: { type: { type: 'string', description: 'Agent type' }, count: { type: 'number', description: 'Number of instances' } }, required: ['type'] },
      },
      {
        name: 'mimir_run_task',
        description: 'Run a task through the agent orchestration pipeline (decompose, execute, validate, review)',
        inputSchema: { type: 'object', properties: { description: { type: 'string', description: 'Task description to execute' } }, required: ['description'] },
      },
    ];
  }

  async executeTool(name: string, args: Record<string, any>): Promise<{ content: Array<{ type: string; text: string }> }> {
    switch (name) {
      case 'mimir_submit_task': {
        const id = nanoid();
        const task: TaskRecord = { id, description: args.description, status: 'pending', createdAt: new Date().toISOString() };
        this.tasks.set(id, task);
        const advice = this.learning.getAdvice(args.description);
        const lessons = this.learning.getLessons(args.description);
        const context = args.context ? JSON.parse(args.context) : {};
        this.learning.recordTask({ id, description: args.description, context, strategy: advice?.strategy ?? [], result: 'success', attempts: 1, duration: 0 });
        return { content: [{ type: 'text', text: JSON.stringify({ id, status: task.status, advice: advice ?? undefined, lessons: lessons.length > 0 ? lessons : undefined }) }] };
      }
      case 'mimir_get_advice': {
        const advice = this.learning.getAdvice(args.description);
        const lessons = this.learning.getLessons(args.description);
        return { content: [{ type: 'text', text: JSON.stringify({ found: !!advice, description: args.description, ...(advice ? { strategy: advice.strategy, confidence: advice.confidence, lesson: advice.lesson } : {}), ...(lessons.length > 0 ? { lessons } : {}) }) }] };
      }
      case 'mimir_list_agents': {
        return { content: [{ type: 'text', text: JSON.stringify({ agents: this.registry.list().map(def => ({ type: def.type, tools: def.tools })) }) }] };
      }
      case 'mimir_get_stats': {
        return { content: [{ type: 'text', text: JSON.stringify(this.learning.getStats()) }] };
      }
      case 'mimir_spawn_agents': {
        const instances = this.registry.spawn(args.type as any, args.count ?? 1);
        return { content: [{ type: 'text', text: JSON.stringify({ spawned: instances.length, agents: instances }) }] };
      }
      case 'mimir_run_task': {
        const result = await this.orchestrator.runTask(args.description);
        const allOutput = result.results.map(r => r.output).join('\n');
        const hasError = result.results.some(r => r.status === 'failure');
        this.learning.recordTask({
          id: nanoid(),
          description: args.description,
          context: {},
          strategy: result.plan.map(s => `${s.agentType}:${s.command}`),
          result: result.success ? 'success' : 'failure',
          attempts: result.results.length,
          duration: result.totalDuration,
          error: hasError ? allOutput.substring(0, 500) : undefined,
        });
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private createMcpServer(): Server {
    const server = new Server({ name: 'mimir', version: '0.1.0' }, { capabilities: { tools: {} } });
    server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: this.getToolDefinitions() }));
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        return await this.executeTool(request.params.name, request.params.arguments ?? {});
      } catch (error) {
        return { content: [{ type: 'text', text: JSON.stringify({ error: (error as Error).message }) }], isError: true };
      }
    });
    return server;
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.mcpServer.connect(transport);
  }
}

export function createMimirServer(dbPath: string): MimirServer {
  return new MimirServer(dbPath);
}
