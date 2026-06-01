# Mimir Agent (`mimir-agent`)

Multi-agent self-improving system with shared experiential memory and parallel agent execution.

Mimir is a local-first, MCP-native platform where specialized AI agents collaborate, execute tasks in parallel, learn from every outcome, and collectively become more effective over time.

## Quick Start

### Zero install (recommended)

```bash
npx mimir-agent
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

- **`npx mimir-agent`** — run instantly, no local setup (auto-caches after first download)
- **`node <path>/dist/cli.js`** — local development, no network dependency

### Windsurf

**File:** `~/.codeium/windsurf/mcp_config.json` (Windows: `%USERPROFILE%\.codeium\windsurf\mcp_config.json`)

```json
{
  "mcpServers": {
    "mimir": {
      "command": "npx",
      "args": ["mimir-agent"],
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

### Claude Code

**File:** `~/.claude/settings.json`

```json
{
  "mcpServers": {
    "mimir": {
      "command": "npx",
      "args": ["mimir-agent"]
    }
  }
}
```

### VS Code

**File:** `.vscode/mcp.json` or via Command Palette → **MCP: Configure MCP Servers**

```json
{
  "mcpServers": {
    "mimir": {
      "command": "npx",
      "args": ["mimir-agent"]
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
      "args": ["mimir-agent"]
    }
  }
}
```

### Verify it works

```bash
npx mimir-agent start
```

The server prints `Starting Mimir MCP server on stdio...` and listens on stdio. Once connected to your editor, the MCP tools appear in the client UI.

Test from the terminal:

```bash
npx mimir-agent run "echo test"
# → { results: [{ status: "success", output: "test\r\n", duration: 30 }] }
```

## MCP Tools

| Tool | Description |
|---|---|
| `mimir_submit_task` | Submit a task — the system records outcomes and learns |
| `mimir_get_advice` | Get the best strategy from past similar experiences |
| `mimir_list_agents` | List all available agent types and their tools |
| `mimir_get_stats` | View learning statistics and success rates |
| `mimir_spawn_agents` | Dynamically spawn agent instances for parallel work |
| `mimir_run_task` | Run a task through the full agent orchestration pipeline |

### `mimir_run_task`

Executes a complete agent pipeline:

1. **Planner** — decomposes the description into executable steps
2. **Executor** — runs shell commands via `child_process.exec`
3. **Investigator** — fetches HTTP URLs
4. **Validator** — checks output for errors and warnings
5. **Critic** — reviews overall quality and assigns a score
6. **Learning** — everything is recorded in experiential memory

Independent steps execute in **parallel** via `Promise.all`.

Example prompts for Cascade in Windsurf:

> _"Use mimir_run_task to execute 'echo hello from agents'"_

> _"Use mimir_run_task to execute 'install express'"_

> _"Use mimir_run_task to execute 'https://example.com'"_

## CLI

```bash
npm run build        # Compile TypeScript to JS
node dist/cli.js     # Start MCP server (default)
npx mimir            # Start MCP server (from npm)
npx mimir start      # Same
npx mimir run <desc> # Run a task through agent orchestration
npx mimir stats      # Show learning statistics
npx mimir agents     # List available agent types
mimir start          # Same, if installed globally
mimir run <desc>     # Run a task
mimir --help         # Show help
```

## Development

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm test             # Run all tests
npm run test:watch   # Watch mode
```

Requires Node.js 20+.

## Tests

```bash
npx vitest run                       # All tests (46 passing)
npx vitest run tests/demo.test.ts    # Multi-agent demo (parallel execution)
npx vitest run --reporter=verbose    # Verbose output
```

The demo test (`tests/demo.test.ts`) runs 3 tasks concurrently and measures wall time vs sequential time, plus a multi-step "install express" pipeline with real command execution.

## Agent Types

| Agent | Tools | Real behavior |
|---|---|---|
| **Planner** | decompose_task, resolve_deps, estimate_effort | Rule-based task decomposition: keywords → shell command steps |
| **Executor** | git_clone, write_file, exec_cmd, read_file | Spawns child processes via `child_process.exec` |
| **Investigator** | web_search, fetch_url, scrape | HTTP fetch to URLs |
| **Validator** | run_tests, lint_code, check_types | Checks output for errors/warnings patterns |
| **Critic** | review_output, check_consistency, suggest_improvements | Scans output for issues, assigns quality score |

## Architecture

```
User/Editor
    │
    ▼ (MCP protocol / stdio)
┌──────────────────────────┐
│     Mimir MCP Server      │
│                           │
│  ┌─────────────────────┐  │
│  │  AgentOrchestrator   │  │
│  │  ┌───────────────┐  │  │
│  │  │ Planner       │  │  │
│  │  ├───────────────┤  │  │
│  │  │ Executor      │  │  │
│  │  ├───────────────┤  │  │
│  │  │ Investigator  │  │  │
│  │  ├───────────────┤  │  │
│  │  │ Validator     │  │  │
│  │  ├───────────────┤  │  │
│  │  │ Critic        │  │  │
│  │  └───────────────┘  │  │
│  └─────────────────────┘  │
│                           │
│  ┌─────────────────────┐  │
│  │   Learning Engine    │  │
│  │  (SQLite + graph)    │  │
│  └─────────────────────┘  │
│                           │
│  ┌─────────────────────┐  │
│  │   Agent Registry     │  │
│  └─────────────────────┘  │
└──────────────────────────┘
```

- **MCP-native** — integrates with Windsurf, Claude Code, VS Code, Cursor, Codex CLI
- **Local-first** — all data stays on your machine (SQLite)
- **Plugin-based** — agents are defined as tool lists, extensible
- **Parallel execution** — independent steps run concurrently via `Promise.all`
- **Experiential learning** — every task writes to memory; future tasks retrieve best strategies

## Data

All data is stored locally in SQLite. Set `MIMIR_DB_PATH` environment variable to customize the database location:

```bash
set MIMIR_DB_PATH=C:\Users\youruser\.mimir\memory.db
npx mimir-agent
```

Default: `~/.mimir/experience.db`
