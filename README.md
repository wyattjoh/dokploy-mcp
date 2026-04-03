# @wyattjoh/dokploy-mcp

MCP server that wraps the [Dokploy](https://dokploy.com) REST API. Exposes
Dokploy operations as [Model Context Protocol](https://modelcontextprotocol.io)
tools for Claude Code, Claude Desktop, and other MCP clients.

## Install

```bash
npm install -g @wyattjoh/dokploy-mcp
```

Or with Bun:

```bash
bun install -g @wyattjoh/dokploy-mcp
```

## Configuration

The server supports two modes: **single-instance** and **multi-instance**. The
two modes are mutually exclusive.

### Single instance

Set a single Dokploy API token. All tools operate against one Dokploy server.

| Variable | Required | Description |
| --- | --- | --- |
| `DOKPLOY_API_TOKEN` | Yes | API token for your Dokploy instance |
| `DOKPLOY_URL` | No | Base URL (defaults to `https://dokploy.wyattjoh.dev`) |

### Multi-instance

Set per-instance tokens and URLs. Tools gain a required `instance` parameter so
you can target different Dokploy servers from a single MCP session.

For each instance, define a pair of environment variables:

- `DOKPLOY_<NAME>_API_TOKEN` - API token for the instance
- `DOKPLOY_<NAME>_URL` - Base URL for the instance

Instance names are derived by lowercasing the `<NAME>` segment. Names must match
`[a-z0-9]([a-z0-9_]*[a-z0-9])?`.

Example for two instances named `prod` and `staging`:

```
DOKPLOY_PROD_API_TOKEN=dkp_abc123
DOKPLOY_PROD_URL=https://dokploy.example.com
DOKPLOY_STAGING_API_TOKEN=dkp_def456
DOKPLOY_STAGING_URL=https://staging-dokploy.example.com
```

### HTTP transport

By default the server uses stdio transport (for Claude Code and similar
clients). Pass `--http` to start an HTTP server instead.

| Variable | Required | Description |
| --- | --- | --- |
| `DOKPLOY_MCP_TOKEN` | Yes (HTTP only) | Bearer token for authenticating MCP clients |

```bash
dokploy-mcp --http --port 3000
```

The MCP endpoint is `POST /mcp`. A health check is available at `GET /health`.

## MCP client configuration

### Claude Code (`.mcp.json`)

Add to your project's `.mcp.json` or `~/.claude/.mcp.json`:

**Single instance:**

```json
{
  "mcpServers": {
    "dokploy": {
      "command": "dokploy-mcp",
      "env": {
        "DOKPLOY_API_TOKEN": "dkp_your_token_here",
        "DOKPLOY_URL": "https://dokploy.example.com"
      }
    }
  }
}
```

**Multi-instance:**

```json
{
  "mcpServers": {
    "dokploy": {
      "command": "dokploy-mcp",
      "env": {
        "DOKPLOY_PROD_API_TOKEN": "dkp_prod_token",
        "DOKPLOY_PROD_URL": "https://dokploy.example.com",
        "DOKPLOY_STAGING_API_TOKEN": "dkp_staging_token",
        "DOKPLOY_STAGING_URL": "https://staging-dokploy.example.com"
      }
    }
  }
}
```

### Using 1Password CLI (recommended)

Store your Dokploy API tokens in 1Password and use `op run` to inject them at
runtime. This keeps secrets out of config files entirely.

1. Store each API token in 1Password (e.g., in a vault called `Development`)
2. Reference them with `op://` URIs in your `.mcp.json`
3. Use `op` as the command so secrets are resolved in-memory

```json
{
  "mcpServers": {
    "dokploy": {
      "command": "op",
      "args": ["run", "--", "dokploy-mcp"],
      "env": {
        "DOKPLOY_PROD_API_TOKEN": "op://Development/dokploy-prod/credential",
        "DOKPLOY_PROD_URL": "https://dokploy.example.com",
        "DOKPLOY_STAGING_API_TOKEN": "op://Development/dokploy-staging/credential",
        "DOKPLOY_STAGING_URL": "https://staging-dokploy.example.com"
      }
    }
  }
}
```

With this setup, `op run` resolves the `op://` references and injects the real
tokens into the subprocess environment. No plaintext secrets touch disk.

For HTTP transport with 1Password:

```json
{
  "mcpServers": {
    "dokploy": {
      "command": "op",
      "args": ["run", "--", "dokploy-mcp", "--http"],
      "env": {
        "DOKPLOY_MCP_TOKEN": "op://Development/dokploy-mcp-token/credential",
        "DOKPLOY_PROD_API_TOKEN": "op://Development/dokploy-prod/credential",
        "DOKPLOY_PROD_URL": "https://dokploy.example.com"
      }
    }
  }
}
```

## Tools

### Projects

| Tool | Description |
| --- | --- |
| `dokploy_list_instances` | List all configured Dokploy instances |
| `dokploy_list_projects` | List all projects |

### Applications

| Tool | Description |
| --- | --- |
| `dokploy_list_applications` | List all applications (filtered from projects) |
| `dokploy_get_application` | Get full application config by ID |
| `dokploy_update_application` | Update application config fields |
| `dokploy_deploy` | Trigger a deployment |
| `dokploy_start_application` | Start an application |
| `dokploy_stop_application` | Stop an application |

### Compose

| Tool | Description |
| --- | --- |
| `dokploy_get_compose` | Get compose stack config by ID |
| `dokploy_deploy_compose` | Deploy a compose stack |
| `dokploy_redeploy_compose` | Redeploy a compose stack |
| `dokploy_start_compose` | Start a compose stack |
| `dokploy_stop_compose` | Stop a compose stack |
| `dokploy_update_compose` | Update compose stack config |
| `dokploy_list_compose_services` | List services in a compose stack |
| `dokploy_list_compose_deployments` | List deployments for a compose stack |
| `dokploy_list_compose_domains` | List domains for a compose stack |

### Deployments

| Tool | Description |
| --- | --- |
| `dokploy_list_deployments` | List deployments for an application |

### Domains

| Tool | Description |
| --- | --- |
| `dokploy_list_domains` | List domains for an application |
| `dokploy_create_domain` | Add a domain to an application |

### Environment

| Tool | Description |
| --- | --- |
| `dokploy_list_environment` | List environment variables for an application |
| `dokploy_update_environment` | Set environment variables (merge with existing) |
| `dokploy_delete_environment` | Remove environment variables by key |

### Build

| Tool | Description |
| --- | --- |
| `dokploy_save_build_type` | Update build configuration |
| `dokploy_save_github_provider` | Update GitHub source configuration |

### Operational

| Tool | Description |
| --- | --- |
| `dokploy_get_containers` | List Docker containers |
| `dokploy_get_app_monitoring` | Get application monitoring data |
| `dokploy_redeploy_application` | Redeploy an application |
| `dokploy_cancel_deployment` | Cancel a running deployment |
| `dokploy_kill_build` | Kill a running build |
| `dokploy_get_version` | Get the Dokploy server version |
| `dokploy_list_servers` | List all configured servers |

## Development

```bash
bun install
bun run start              # stdio transport
bun run start:http         # HTTP transport on port 3000
bun run build              # transpile to dist/ (Node.js target)
bun run lint               # oxlint
bun run typecheck          # tsc --noEmit
```

## License

MIT
