# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

MCP (Model Context Protocol) server that wraps the Dokploy REST API. Exposes Dokploy operations as MCP tools for Claude Code and Claude mobile. Built with Bun, TypeScript, and `@modelcontextprotocol/sdk` v1.x.

## Commands

```bash
bun run start              # stdio transport (default, for Claude Code)
bun run start:http         # HTTP transport on port 3000 (for remote/mobile)
bun run lint               # oxlint
bun run lint:fix           # oxlint --fix
bun run fmt                # oxfmt format
bun run fmt:check          # oxfmt check
bunx tsc --noEmit          # type check
```

After code changes, run: `bunx oxlint src/ && bunx oxfmt src/ && bunx tsc --noEmit`

## Architecture

**Dual transport MCP server.** A single `DOKPLOY_API_TOKEN` env var (injected via `op run` at startup) authenticates both client connections (bearer token for HTTP) and outbound Dokploy API calls (`x-api-key` header).

```
src/index.ts     Entry point: CLI arg parsing (--http, --port), transport selection
src/server.ts    Creates McpServer, registers all tool modules
src/config.ts    Validates DOKPLOY_API_TOKEN at startup, exports config
src/auth.ts      Timing-safe bearer token validation (HTTP transport only)
src/client.ts    Dokploy API client: typed get/post wrappers for all endpoints
src/tools/       One file per domain, each exports register(server: McpServer)
```

### Adding a new tool

1. Add the client function to `src/client.ts` (GET uses `get()`, POST uses `post()`)
2. Register the tool in the appropriate `src/tools/*.ts` file (or create a new one)
3. If new tool file, import and call its `register()` in `src/server.ts`

### Tool module pattern

Every file in `src/tools/` exports a single `register(server: McpServer)` function that calls `server.registerTool()` for each tool. Read-only tools use `annotations: { readOnlyHint: true, destructiveHint: false }`.

### Dokploy API conventions

- tRPC-style endpoints at `/api/<router>.<action>` (e.g., `application.deploy`)
- GET for queries (params as query string), POST for mutations (JSON body)
- Auth via `x-api-key` header
- Base URL defaults to `https://dokploy.wyattjoh.dev/api`, overridable via `DOKPLOY_URL`
- No `application.all` endpoint exists; apps are extracted from `project.all` response
- Environment variables stored as newline-delimited `KEY=VALUE` strings, not structured objects

## Zod v4

This project uses Zod v4. Key difference: `z.record()` requires two arguments: `z.record(keySchema, valueSchema)`, not `z.record(valueSchema)`.

## Global binary

`bun link` registers `dokploy-mcp` as a global command (via the `bin` field in package.json). The `.mcp.json` config references this command name, not a file path.
