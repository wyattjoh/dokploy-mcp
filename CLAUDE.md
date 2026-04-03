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

**Dual transport MCP server.** Supports single-instance and multi-instance modes.

**Single instance:** Set `DOKPLOY_API_TOKEN` (and optionally `DOKPLOY_URL`). Tools have no `instance` parameter.

**Multi-instance:** Set `DOKPLOY_<NAME>_API_TOKEN` and `DOKPLOY_<NAME>_URL` for each instance (e.g., `DOKPLOY_PROD_API_TOKEN`). Instance names are derived by lowercasing the segment between `DOKPLOY_` and `_API_TOKEN`. Tools gain a required `instance` parameter.

The two modes are mutually exclusive. `DOKPLOY_MCP_TOKEN` is required for HTTP transport (bearer auth), decoupled from instance tokens.

```
src/index.ts                 Entry point: CLI arg parsing (--http, --port), transport selection
src/server.ts                Creates McpServer, registers all tool modules
src/config.ts                Instance discovery, env var scanning, validation
src/auth.ts                  Timing-safe bearer token validation (HTTP transport only)
src/client.ts                DokployClient class with typed API methods, getClient() factory
src/instance-aware-server.ts Wraps McpServer, auto-injects instance param in multi mode
src/tools/                   One file per domain, each exports register(server: InstanceAwareServer)
```

### Adding a new tool

1. Add the method to the `DokployClient` class in `src/client.ts` (GET uses `get()`, POST uses `post()`)
2. Register the tool in the appropriate `src/tools/*.ts` file (or create a new one). Use `client` from handler args.
3. If new tool file, import and call its `register()` in `src/server.ts`

### Tool module pattern

Every file in `src/tools/` exports a single `register(server: InstanceAwareServer)` function that calls `server.registerTool()` for each tool. Handlers receive a `client: DokployClient` in their args (injected by the wrapper). Read-only tools use `annotations: { readOnlyHint: true, destructiveHint: false }`.

### Dokploy API conventions

- tRPC-style endpoints at `/api/<router>.<action>` (e.g., `application.deploy`)
- GET for queries (params as query string), POST for mutations (JSON body)
- Auth via `x-api-key` header
- Base URL defaults to `https://dokploy.wyattjoh.dev/api` in single-instance mode, required per instance in multi-instance mode
- No `application.all` endpoint exists; apps are extracted from `project.all` response
- Environment variables stored as newline-delimited `KEY=VALUE` strings, not structured objects

## Zod v4

This project uses Zod v4. Key difference: `z.record()` requires two arguments: `z.record(keySchema, valueSchema)`, not `z.record(valueSchema)`.

## Global binary

`bun link` registers `dokploy-mcp` as a global command (via the `bin` field in package.json). The `.mcp.json` config references this command name, not a file path.
