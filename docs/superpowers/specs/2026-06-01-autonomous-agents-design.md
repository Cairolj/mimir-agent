# Autonomous Multi-Agent Collaboration

Decouple Mimir's fixed pipeline into a message-bus architecture where independent agents run long-lived loops, communicate via pub/sub, and collaborate autonomously through shared state.

## Motivation

The current `AgentOrchestrator` runs a deterministic pipeline: Planner decomposes → Executor/Investigator run → Validator checks → Critic reviews. All steps are decided upfront, agents don't communicate, and there is no real collaboration.

This design replaces the pipeline with a **message bus** where each agent type runs as an independent loop, reacts to messages, publishes results, and the system converges naturally through decentralized coordination supervised by a lightweight Supervisor.

## Architecture

```
                     ┌─────────────────────┐
                     │     MessageBus       │
                     │  (EventEmitter)      │
                     └─────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │       │       │       │       │       │   │
  ┌─────▼──┐ ┌──▼─────┐ ┌──▼───┐ ┌──▼──┐ ┌──▼────┐ │
  │Planner │ │Executor│ │Invest│ │Valid│ │Critic │ │
  │ Agent  │ │ Agent  │ │Agent │ │Agent│ │ Agent │ │
  └────┬───┘ └───┬────┘ └──┬───┘ └──┬──┘ └───┬───┘ │
       │         │         │        │        │     │
  ┌────▼─────────▼─────────▼────────▼────────▼─────▼──┐
  │                  SupervisorAgent                    │
  │  (tracks task state, decides completion/failure)   │
  └────────────────────────────────────────────────────┘
```

## Components

### MessageBus

An in-memory pub/sub channel. Each agent subscribes to the channels it cares about and publishes results after each cycle.

```typescript
interface Message {
  channel: string
  sender: string
  payload: Record<string, unknown>
  timestamp: number
}

class MessageBus {
  publish(channel: string, sender: string, payload: any): void
  subscribe(channel: string, handler: (msg: Message) => void): () => void
  unsubscribe(channel: string, handler: Function): void
}
```

**Channels:**

| Channel | Publisher | Consumers | Payload |
|---|---|---|---|
| `task:new` | External (CLI/MCP) | Supervisor | `{ taskId, description, context }` |
| `step:ready` | PlannerAgent | ExecutorAgent, InvestigatorAgent | `{ taskId, step }` |
| `step:done` | ExecutorAgent, InvestigatorAgent | ValidatorAgent | `{ taskId, stepId, output, error, duration }` |
| `step:verified` | ValidatorAgent | CriticAgent | `{ taskId, stepId, output, verified }` |
| `step:reviewed` | CriticAgent | Supervisor | `{ taskId, stepId, score, issues }` |
| `step:failed` | ValidatorAgent | Supervisor | `{ taskId, stepId, error }` |
| `task:complete` | Supervisor | External | `{ taskId, results }` |
| `task:failed` | Supervisor | External | `{ taskId, error }` |

### AutonomousAgent (base class)

```typescript
abstract class AutonomousAgent {
  abstract readonly agentType: string

  constructor(
    protected bus: MessageBus,
    protected llm: LLMProvider,
  ) {}

  async start(): Promise<void> {
    while (this.running) {
      const messages = this.poll()
      if (messages.length === 0) { await sleep(500); continue }
      await this.cycle(messages)
    }
  }

  stop(): void { this.running = false }

  protected abstract poll(): Message[]
  protected abstract cycle(messages: Message[]): Promise<void>
}
```

Each agent subscribes to specific channels and processes messages in batches per cycle. The `cycle()` method uses the LLM to decide how to process incoming messages.

### Concrete Agents

**PlannerAgent**
- Subscribes to: `task:new`
- Publishes to: `step:ready`
- On `task:new` → uses LLM to decompose description into steps → publishes each step as `step:ready`
- If LLM unavailable → uses existing keyword-based fallback

**ExecutorAgent**
- Subscribes to: `step:ready`
- Publishes to: `step:done`
- Only claims steps with `agentType: 'executor'`
- Executes via `child_process.exec` same as current `ExecutorHandler`

**InvestigatorAgent**
- Subscribes to: `step:ready`
- Publishes to: `step:done`
- Only claims steps with `agentType: 'investigator'` or commands with `http://` / `search:`
- Fetches URLs or performs DuckDuckGo search via existing `WebSearchService`

**ValidatorAgent**
- Subscribes to: `step:done`
- Publishes to: `step:verified` or `step:failed`
- Scans output for errors/warnings patterns (same logic as current `ValidatorHandler`)

**CriticAgent**
- Subscribes to: `step:verified`
- Publishes to: `step:reviewed`
- Reviews quality, assigns score (same logic as current `CriticHandler`)

**SupervisorAgent**
- Subscribes to: all channels
- Publishes to: `task:complete`, `task:failed`
- Maintains `Map<taskId, TaskState>` tracking progress
- On `step:reviewed` → marks step complete → if all steps done → `task:complete`
- On `step:failed` → decides retry (up to 3) or `task:failed`
- On idle tasks (no progress for 60s) → `task:failed` with timeout

### Shared LLM Provider

```typescript
class SharedLLMProvider implements LLMProvider {
  async decide(context: AgentContext): Promise<AgentDecision> {
    // Delegates to configured external provider or falls back to keywords
  }
}
```

Resolution order:
1. `MIMIR_LLM_PROVIDER` → create appropriate adapter (OllamaProvider, OpenAIProvider, AnthropicProvider)
2. No config → `FallbackProvider` handles basic patterns (keywords, URLs, search: prefix)

Each agent receives the same `LLMProvider` instance. The provider is stateless — decisions depend only on current context.

## Flow Example

```
User submits task: "check npm version and search for latest node release"

1. CLI/MCP publishes → task:new { id: "t1", desc: "check npm..." }

2. SupervisorAgent receives task:new
   → creates TaskState { id: "t1", steps: [], completed: new Set() }
   → publishes → task:planning { taskId: "t1" }

3. PlannerAgent receives task:planning
   → LLM decomposes into:
     Step A: executor - "node --version"
     Step B: investigator - "search: latest node.js release 2026"
   → publishes step:ready for each step
   (Both steps have empty dependsOn → parallel execution)

4. ExecutorAgent receives step:ready (Step A)
   → runs "node --version" → captures output
   → publishes → step:done { taskId: "t1", stepId: "A", output: "v20.19.0" }

   InvestigatorAgent receives step:ready (Step B)
   → calls DuckDuckGo API → captures results
   → publishes → step:done { taskId: "t1", stepId: "B", output: "..." }

5. ValidatorAgent receives step:done for A and B
   → validates both → passes
   → publishes → step:verified for each

6. CriticAgent receives step:verified for A and B
   → reviews quality → passes
   → publishes → step:reviewed for each

7. SupervisorAgent receives step:reviewed for A and B
   → marks both complete → all steps done
   → publishes → task:complete { taskId: "t1", results: [...] }
```

## Error Handling

- **Agent crash**: Supervisor detects missing progress (heartbeat timeout) → `task:failed`
- **Step failure**: Validator publishes `step:failed` → Supervisor decides retry (up to 3) or fail
- **LLM unavailable**: Falls back to keyword decomposition. Agent still processes messages but with simpler logic.
- **Deadlock detection**: Supervisor tracks time per task. If no messages published for 60s → timeout.
- **Bus overflow**: Messages are processed per cycle in batches. Backpressure handled by sleep(500ms) between empty cycles.

## Testing

- `tests/agents/message-bus.test.ts` — pub/sub, unsubscribe, multiple channels
- `tests/agents/autonomous-agent.test.ts` — base loop, stop, cycle, polling
- `tests/agents/supervisor.test.ts` — task lifecycle, retries, timeouts
- `tests/agents/planner-agent.test.ts` — decomposition via LLM and fallback
- `tests/agents/collaboration.test.ts` — end-to-end multi-agent task
- Update existing handler tests to ensure they still work with message bus

## File Changes

```
NEW  src/agents/bus.ts              — MessageBus class
NEW  src/agents/agent.ts            — AutonomousAgent base class
NEW  src/agents/supervisor.ts       — SupervisorAgent
NEW  src/agents/llm.ts              — SharedLLMProvider
MOD  src/agents/handlers/planner.ts — refactor to PlannerAgent
MOD  src/agents/handlers/executor.ts— refactor to ExecutorAgent
MOD  src/agents/handlers/investigator.ts — refactor to InvestigatorAgent
MOD  src/agents/handlers/validator.ts— refactor to ValidatorAgent
MOD  src/agents/handlers/critic.ts  — refactor to CriticAgent
MOD  src/agents/orchestrator.ts     — replace with bus-based startup
MOD  src/server.ts                  — wire agents, start/stop
NEW  tests/agents/message-bus.test.ts
NEW  tests/agents/autonomous-agent.test.ts
NEW  tests/agents/supervisor.test.ts
NEW  tests/agents/planner-agent.test.ts
NEW  tests/agents/collaboration.test.ts
```

## Out of Scope

- Message persistence (SQLite-based bus can be added later)
- Multi-process agents (all agents run in the same Node.js process)
- Agent-to-agent direct messaging (all communication goes through bus)
- Dynamic agent spawning (each agent type has exactly one instance)
