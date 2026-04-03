# Dokploy MCP Server Design

## Problem

The existing `dokploy-api` skill in claude-toolkit embeds `op read` in every
curl snippet. Each time Claude follows one of these patterns, 1Password triggers
a Touch ID prompt. A typical multi-step workflow (check status, deploy, verify)
hits the user with 3+ prompts.

## Solution

A Bun TypeScript MCP server that wraps the Dokploy REST API. The Dokploy API
token is injected once at startup via `op run`, then held in memory for the
lifetime of the process. All subsequent tool calls are prompt-free.

## Architecture

```
Client (Claude Code / Claude mobile)
  |
  |  POST /mcp  Authorization: Bearer <token>
  |  -- or --
  |  stdio (local pipe, no auth)
  v
+---------------------------+
|  dokploy-mcp (Bun)        |
|  - Validates bearer (HTTP) |
|  - Routes to MCP handler   |
|  - Calls Dokploy API       |
+------------+--------------+
             |  x-api-key: <same token>
             v
   https://dokploy.wyattjoh.dev/api
```

### Auth Model

Single token (`DOKPLOY_API_TOKEN`) serves both purposes:

- **Client auth (HTTP mode):** Clients send the token as `Authorization: Bearer
  <token>`. The server validates using timing-safe comparison.
- **Dokploy API auth:** The server forwards the same token as `x-api-key` to all
  Dokploy API requests.

In stdio mode, no client auth is needed (local pipe).

### Transport

The server supports two transports, selected by CLI flags:

- **stdio (default):** MCP SDK `StdioServerTransport`. Used by Claude Code
  locally. No auth layer.
- **HTTP (`--http --port <n>`):** Streamable HTTP transport. Single `POST /mcp`
  endpoint with bearer auth. Used by Claude mobile and remote clients. Default
  port 3000.

### Startup

**Local (Claude Code via `.mcp.json`):**

```json
{
  "mcpServers": {
    "dokploy": {
      "command": "op",
      "args": [
        "run",
        "--env-file=/path/to/dokploy-mcp/.env.tpl",
        "--",
        "bun",
        "run",
        "/path/to/dokploy-mcp/src/index.ts"
      ]
    }
  }
}
```

One Touch ID prompt when the session starts. Zero after that.

**Remote (Claude mobile):**

```bash
op run --env-file=.env.tpl -- bun run src/index.ts --http --port 3000
```

## Tools

### Read Operations (annotated as read-only)

| Tool | Description |
|------|-------------|
| `dokploy_list_projects` | List all projects |
| `dokploy_list_applications` | List all applications (optionally filtered by project) |
| `dokploy_get_application` | Get full app config by ID |
| `dokploy_list_deployments` | List deployments for an app (newest first) |
| `dokploy_list_domains` | List domains configured for an app |
| `dokploy_list_environment` | List environment variables for an app |

### Write Operations

| Tool | Description |
|------|-------------|
| `dokploy_deploy` | Trigger a deployment (applicationId, optional title/description) |
| `dokploy_update_application` | Update app config fields (applicationId + any updatable fields) |
| `dokploy_start_application` | Start an app |
| `dokploy_stop_application` | Stop an app |
| `dokploy_save_build_type` | Update build config (dockerfile, dockerContextPath, dockerBuildStage) |
| `dokploy_save_github_provider` | Update GitHub source config (repository, branch, owner, buildPath, triggerType) |
| `dokploy_create_domain` | Add a domain to an app |
| `dokploy_update_environment` | Create/update environment variables for an app |
| `dokploy_delete_environment` | Remove an environment variable from an app |

15 tools total. Each maps 1:1 to a Dokploy API endpoint.

### Deployment Metadata

Deployment objects include `logPath` (filesystem path on the server) but the MCP
server does not read log content. Claude can SSH separately using `Bash(ssh:*)`
when actual log content is needed.

## Dokploy API Client

`client.ts` is a thin typed wrapper around `fetch`:

- GET endpoints (`.one`, `.all`) use query params
- POST endpoints (`.update`, `.deploy`, `.create`) use JSON body
- All endpoints use `x-api-key` header for auth
- Returns typed responses, throws on non-2xx with the error body
- Base URL: `https://dokploy.wyattjoh.dev/api` with optional `DOKPLOY_URL` env
  override

## Project Structure

```
dokploy-mcp/
├── .env.tpl                  # op:// reference for DOKPLOY_API_TOKEN
├── .env.example              # Placeholder docs for required vars
├── .gitignore
├── package.json
├── tsconfig.json
├── .oxlintrc.json            # Linting config (oxlint)
└── src/
    ├── index.ts              # Entry point: CLI arg parsing, transport selection
    ├── server.ts             # MCP server setup, tool registration
    ├── config.ts             # Environment config (DOKPLOY_API_TOKEN, base URL)
    ├── auth.ts               # Bearer token validation (timing-safe, HTTP only)
    ├── client.ts             # Dokploy API client (typed fetch wrapper)
    └── tools/
        ├── projects.ts       # list_projects
        ├── applications.ts   # list, get, update, start, stop, deploy
        ├── deployments.ts    # list_deployments
        ├── domains.ts        # list, create
        ├── environment.ts    # list, update, delete
        └── build.ts          # save_build_type, save_github_provider
```

### Toolchain

| Concern | Tool |
|---------|------|
| Linting | oxlint |
| Formatting | oxfmt |
| Type checking | `bun check` (built-in tsc) |

## Skill Updates (claude-toolkit)

After the MCP server is built, update `dokploy-api` in claude-toolkit:

- Remove inline `op read` / curl snippets from SKILL.md
- Replace `allowed-tools` with MCP tool names (`mcp__dokploy__*`)
- Keep `Bash(ssh:*)` for log reading
- Keep references/api-reference.md and gotchas sections
- Add `.mcp.json` configuration example to SKILL.md

## Decisions

- **Bun runtime** over Deno (user preference)
- **Streamable HTTP** over SSE (simpler, aligns with MCP spec direction)
- **Single token** for both client auth and Dokploy API auth (simpler, no
  separate MCP auth token)
- **No OpenAPI spec tool** (purpose-built tools only, expand manually)
- **No SSH operations** in the MCP server (returns logPath metadata, Claude SSHs
  separately)
- **oxlint + oxfmt** over Biome (user preference for oxc toolchain)
