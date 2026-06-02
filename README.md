# Mimir Agent (`mimir-mcp-agent`)

Multi-agent self-improving system with shared experiential memory, web search, and parallel agent execution.

Mimir is a local-first, MCP-native platform where specialized AI agents collaborate, execute tasks in parallel, learn from every outcome, and collectively become more effective over time. Zero configuration required — uses your editor's LLM via MCP sampling protocol.

[![npm version](https://img.shields.io/npm/v/mimir-mcp-agent)](https://www.npmjs.com/package/mimir-mcp-agent)
[![GitHub](https://img.shields.io/badge/github-Cairolj/mimir--agent-blue)](https://github.com/Cairolj/mimir-agent)

## Quick Start

### Zero install (recommended)

```bash
npx mimir-mcp-agent
```

This downloads and starts the MCP server on stdio. Configure your editor (see below) and restart.

### From source

```bash
git clone https://github.com/Cairolj/mimir-agent
cd mimir
npm install
npm run build
node dist/cli.js
```

## MCP Configuration

Choose your approach:

- **`npx mimir-mcp-agent`** — run instantly, no local setup (auto-caches after first download)
- **`node <path>/dist/cli.js`** — local development, no network dependency

> **Windows users**: If `.js` files open in an editor (Notepad++) instead of running, update to `mimir-mcp-agent@0.1.1` which includes a proper Node.js shebang. Clear `%APPDATA%\npm-cache\_npx\` if you see the old behavior.

### Windsurf

**File:** `~/.codeium/windsurf/mcp_config.json` (Windows: `%USERPROFILE%\.codeium\windsurf\mcp_config.json`)

```json
{
  "mcpServers": {
    "mimir": {
      "command": "npx",
      "args": ["mimir-mcp-agent"],
      "env": {
        "MIMIR_DB_PATH": "%USERPROFILE%\\.mimir\\memory.db"
      }
    }
  }
}
```

**Local dev alternative:**
```json
{
  "mcpServers": {
    "mimir": {
      "command": "node",
      "args": ["C:\\Users\\you\\projects\\mimir\\dist\\cli.js"],
      "env": {
        "MIMIR_DB_PATH": "C:\\Users\\you\\.mimir\\memory.db"
      }
    }
  }
}
```

### VS Code

**File:** `%APPDATA%\Code\User\mcp.json` or via Command Palette → **MCP: Configure MCP Servers**

```json
{
  "servers": {
    "mimir": {
      "command": "npx",
      "args": ["mimir-mcp-agent"]
    }
  }
}
```

### Claude Code

**File:** `~/.claude/settings.json`

```json
{
  "mcpServers": {
    "mimir": {
      "command": "npx",
      "args": ["mimir-mcp-agent"]
    }
  }
}
```

### Cursor

**File:** `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "mimir": {
      "command": "npx",
      "args": ["mimir-mcp-agent"]
    }
  }
}
```

### Smoke Test

Pega esto en el chat de tu editor para verificar que Mimir funciona:

> Quiero probar que Mimir funciona correctamente. Ejecuta estos pasos en orden:
>
> 1. Usa `mimir_list_agents` para mostrar los agentes disponibles
> 2. Usa `mimir_get_stats` para mostrar las estadísticas de aprendizaje
> 3. Usa `mimir_run_task` para ejecutar `echo "hello from Mimir agents"`
> 4. Usa `mimir_get_advice` con la descripción `"run a shell command"`
> 5. Usa `mimir_submit_task` para registrar `"test completed successfully"` con contexto `{"test": "smoke", "result": "ok"}`
>
> Muestra el resultado de cada paso.

## Features

- **Zero-config LLM** — uses your editor's LLM via MCP `sampling/createMessage`. No API keys, no `.env`.
- **Web search** — Investigator agent searches the web via DuckDuckGo Instant Answer API. No API key required.
- **Parallel execution** — agents run in waves using a dependency graph. Independent steps execute concurrently.
- **Experiential memory** — every task outcome is stored in SQLite. Future tasks retrieve the best strategy from past experiences.
- **Plugin-based** — agents are registered as tool lists. Extensible by design.
- **Local-first** — all data stays on your machine. No cloud, no telemetry.
- **MCP-native** — integrates with Windsurf, VS Code, Claude Code, Cursor, and any MCP-compatible editor.

## MCP Tools

| Tool | Description |
|---|---|
| `mimir_run_task` | Run a task through the full agent orchestration pipeline |
| `mimir_get_advice` | Get the best strategy from past similar experiences |
| `mimir_list_agents` | List all available agent types and their tools |
| `mimir_get_stats` | View learning statistics and success rates |
| `mimir_submit_task` | Submit a task outcome — the system records and learns |
| `mimir_spawn_agents` | Dynamically spawn agent instances for parallel work |

### `mimir_run_task`

Executes a complete agent pipeline:

1. **Planner** — decomposes the description into executable steps (uses your editor's LLM via MCP sampling)
2. **Executor** — runs shell commands via `child_process.exec`
3. **Investigator** — fetches HTTP URLs or web searches (prefix with `search:`)
4. **Validator** — checks output for errors and warnings
5. **Critic** — reviews overall quality and assigns a score
6. **Learning** — everything is recorded in experiential memory

**Dependency graph**: the orchestrator builds a dependency graph from the plan and executes independent steps in parallel waves via `Promise.all`. Steps that depend on others wait until their dependencies resolve.

Example prompts:

> _"Use mimir_run_task to execute 'echo hello from agents'"_
> _"Use mimir_run_task to execute 'install express'"_
> _"Use mimir_run_task to execute 'https://example.com'"_
> _"Use mimir_run_task to execute 'search: latest news on AI agents'"_

### `mimir_get_advice`

Retrieves the best strategy from past similar experiences stored in SQLite. The more tasks you run, the better the advice becomes.

### `mimir_submit_task`

Manually record a task outcome so the system can learn from it even without running the full pipeline:
```json
{
  "description": "installed express successfully",
  "context": { "command": "npm install express", "result": "success" }
}
```

## CLI

```bash
npx mimir-mcp-agent           # Start MCP server on stdio (default)
npx mimir-mcp-agent start     # Same
npx mimir-mcp-agent query <desc>    # Get advice from past experiences
npx mimir-mcp-agent submit <desc>   # Submit a task to learn from
npx mimir-mcp-agent stats          # Show learning statistics
npx mimir-mcp-agent agents         # List available agent types
npx mimir-mcp-agent run <command>  # Run a shell command directly (no LLM needed)
npx mimir-mcp-agent --help         # Show help
```

When installed globally:
```bash
mimir start       # Start MCP server
mimir run <cmd>   # Run a command directly
mimir query <d>   # Query memory
mimir submit <d>  # Submit task
mimir --help      # Show help
```

> **`mimir run`** uses `ExecutorHandler` directly — no planning, no LLM, no server. Runs the command in a terminal and returns output. Useful for quick one-off commands.

## Agent Types

| Agent | Tools | Behavior |
|---|---|---|
| **Planner** | decompose_task, resolve_deps, estimate_effort | Uses editor's LLM (MCP sampling) to decompose descriptions into executable steps. Falls back to keyword-based decomposition if sampling is unavailable. Can swap in Ollama/OpenAI/Anthropic via `MIMIR_LLM_PROVIDER`. |
| **Executor** | git_clone, write_file, exec_cmd, read_file | Spawns child processes via `child_process.exec`. Runs shell commands, captures stdout/stderr, exit codes. |
| **Investigator** | web_search, fetch_url, scrape | Fetches HTTP URLs via `fetch`. Detects `search:` prefix and delegates to DuckDuckGo Instant Answer API. Returns structured results (abstract, topics, infobox). No API key required. |
| **Validator** | run_tests, lint_code, check_types | Scans output for error/warning patterns. Validates exit codes and output content. |
| **Critic** | review_output, check_consistency, suggest_improvements | Reviews overall quality, assigns a score, and suggests improvements based on output analysis. |

## Web Search

The Investigator agent can search the web using the DuckDuckGo Instant Answer API — zero configuration, no API key needed.

Prefix a task description with `search:` to trigger a web search:

```
mimir_run_task: "search: latest developments in AI agents 2026"
```

The search returns:
- **Abstract** — a concise summary when available
- **Related topics** — relevant subtopics with URLs
- **Infobox** — structured data (definitions, metrics, etc.)
- **Images** — associated images when present

Without `search:`, the Investigator fetches URLs directly via HTTP.

## LLM Integration

Mimir uses a **sampling architecture** that requires no API keys by default:

### Default: Editor's LLM (MCP Sampling)

The `SamplingProvider` calls your editor via MCP's `sampling/createMessage`. Whatever model your editor uses (Claude, GPT-4, Gemini, etc.) is what Mimir uses for task decomposition. Zero config, zero cost.

### Optional: External Providers

Set `MIMIR_LLM_PROVIDER` to switch to an external LLM:

| Provider | Env Variable |
|---|---|
| `ollama` | `OLLAMA_BASE_URL` (default: `http://localhost:11434`) |
| `openai` | `OPENAI_API_KEY` |
| `anthropic` | `ANTHROPIC_API_KEY` |

```bash
set MIMIR_LLM_PROVIDER=ollama
npx mimir-mcp-agent
```

```bash
set MIMIR_LLM_PROVIDER=openai
set OPENAI_API_KEY=sk-...
npx mimir-mcp-agent
```

## Architecture

```
User/Editor
    │
    ▼ (MCP protocol / stdio)
┌──────────────────────────────────┐
│        Mimir MCP Server           │
│                                   │
│  ┌─────────────────────────────┐  │
│  │      AgentOrchestrator       │  │
│  │  ┌───────┐ ┌───────────┐   │  │
│  │  │Planner│ │ Executor  │   │  │
│  │  ├───────┤ ├───────────┤   │  │
│  │  │Invest.│ │ Validator │   │  │
│  │  ├───────┤ ├───────────┤   │  │
│  │  │Critic │ │           │   │  │
│  │  └───────┘ └───────────┘   │  │
│  │  Dependency graph + waves   │  │
│  └─────────────────────────────┘  │
│                                   │
│  ┌─────────────────────────────┐  │
│  │      Learning Engine         │  │
│  │  ┌─────────┐ ┌───────────┐  │  │
│  │  │ SQLite  │ │ Experience │  │  │
│  │  │  Store  │ │   Graph    │  │  │
│  │  └─────────┘ └───────────┘  │  │
│  └─────────────────────────────┘  │
│                                   │
│  ┌─────────────────────────────┐  │
│  │      SamplingProvider        │  │
│  │  (MCP createMessage → LLM)   │  │
│  └─────────────────────────────┘  │
│                                   │
│  ┌─────────────────────────────┐  │
│  │     WebSearchService         │  │
│  │  (DuckDuckGo Instant Answer) │  │
│  └─────────────────────────────┘  │
│                                   │
│  ┌─────────────────────────────┐  │
│  │       Agent Registry         │  │
│  └─────────────────────────────┘  │
└──────────────────────────────────┘
```

## Memory

All data is stored locally in SQLite. The memory layer has three components:

- **Experience Store** — raw task records with description, context, result, and outcome
- **Experience Graph** — relationships between experiences (similarity, dependency, sequence)
- **Learning Engine** — queries past experiences to find the best strategy for new tasks

Set `MIMIR_DB_PATH` to customize the database location:

```bash
set MIMIR_DB_PATH=C:\Users\youruser\.mimir\memory.db
npx mimir-mcp-agent
```

Default: `~/.mimir/experience.db`

## Tests

```bash
npm test                           # All tests (66 passing across 21 files)
npx vitest run tests/demo.test.ts  # Multi-agent demo (parallel execution)
npx vitest run --reporter=verbose  # Verbose output
```

The demo test runs 3 tasks concurrently and measures wall time vs sequential time, plus a multi-step pipeline with real command execution.

## Development

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript to dist/
npm test             # Run all tests
npm run test:watch   # Watch mode
```

Requires Node.js 20+.

## Windows Notes

- **File associations**: If `npx` opens `cli.js` in Notepad++ instead of running it, ensure you have `mimir-mcp-agent@0.1.1` or later (includes Node.js shebang so npm generates proper `.cmd` shims). Clear `%APPDATA%\npm-cache\_npx\` if cached from an older version.
- **Paths**: Use `%USERPROFILE%` in editor configs for portability.
- **Environment variables**: Use `set VAR=value` in cmd or `$env:VAR = "value"` in PowerShell.

## Links

- [npm](https://www.npmjs.com/package/mimir-mcp-agent)
- [GitHub](https://github.com/Cairolj/mimir-agent)
- [Issues](https://github.com/Cairolj/mimir-agent/issues)
