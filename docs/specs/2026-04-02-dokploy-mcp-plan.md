# Dokploy MCP Server Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Bun TypeScript MCP server that wraps the Dokploy REST API, eliminating per-call 1Password Touch ID prompts by injecting the token once at startup.

**Architecture:** A single Bun process exposes Dokploy operations as MCP tools. Supports stdio transport (for Claude Code, launched via `.mcp.json` with `op run`) and Streamable HTTP transport (for Claude mobile, with bearer auth). A thin API client handles all Dokploy HTTP calls using the injected `DOKPLOY_API_TOKEN`.

**Tech Stack:** Bun, TypeScript, `@modelcontextprotocol/sdk` v1.x, Zod, Express (for HTTP transport), oxlint, oxfmt

**Spec:** `docs/specs/2026-04-02-dokploy-mcp-design.md`

---

## File Structure

```
dokploy-mcp/
├── .env.tpl                  # op:// reference for DOKPLOY_API_TOKEN
├── .env.example              # Placeholder docs
├── .gitignore
├── .oxlintrc.json
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts              # Entry point: CLI arg parsing, transport selection
    ├── server.ts             # MCP server setup, registers all tools
    ├── config.ts             # Reads env vars, exports typed config
    ├── auth.ts               # Timing-safe bearer token validation
    ├── client.ts             # Dokploy API client (typed fetch wrapper)
    └── tools/
        ├── projects.ts       # dokploy_list_projects
        ├── applications.ts   # dokploy_list_applications, dokploy_get_application,
        │                     # dokploy_update_application, dokploy_start_application,
        │                     # dokploy_stop_application, dokploy_deploy
        ├── deployments.ts    # dokploy_list_deployments
        ├── domains.ts        # dokploy_list_domains, dokploy_create_domain
        ├── environment.ts    # dokploy_list_environment, dokploy_update_environment,
        │                     # dokploy_delete_environment
        └── build.ts          # dokploy_save_build_type, dokploy_save_github_provider
```

---

### Task 1: Project Scaffold

**Files:**

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `.oxlintrc.json`
- Create: `.env.tpl`
- Create: `.env.example`

- [ ] **Step 1: Initialize Bun project and install dependencies**

Run:

```bash
cd /Users/wyatt.johnson/Code/github.com/wyattjoh/dokploy-mcp
bun init -y
bun add @modelcontextprotocol/sdk zod express
bun add -D @types/express oxlint oxfmt bun-types
```

- [ ] **Step 2: Configure tsconfig.json**

Replace the generated `tsconfig.json` with:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "declaration": true,
    "types": ["bun-types"]
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Configure .oxlintrc.json**

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "categories": {
    "correctness": "error",
    "suspicious": "warn"
  },
  "plugins": ["typescript"]
}
```

- [ ] **Step 4: Create .env.tpl**

```
DOKPLOY_API_TOKEN=op://Personal/Dokploy API Token - Claude Code Cybersphere/credential
```

- [ ] **Step 5: Create .env.example**

```
# Required: Dokploy API token (injected via op run --env-file=.env.tpl)
DOKPLOY_API_TOKEN=your-api-token-here

# Optional: Override the default Dokploy instance URL
# DOKPLOY_URL=https://dokploy.wyattjoh.dev/api
```

- [ ] **Step 6: Update .gitignore**

```
node_modules/
dist/
.env
.env.local
.env.tpl
```

- [ ] **Step 7: Add scripts to package.json**

Add these scripts to the generated `package.json`:

```json
{
  "scripts": {
    "start": "bun run src/index.ts",
    "start:http": "bun run src/index.ts --http",
    "lint": "oxlint",
    "lint:fix": "oxlint --fix",
    "fmt": "oxfmt .",
    "fmt:check": "oxfmt --check .",
    "typecheck": "bun check"
  }
}
```

- [ ] **Step 8: Commit**

```bash
git add package.json tsconfig.json .gitignore .oxlintrc.json .env.example bun.lock
git commit -m "chore: scaffold Bun project with MCP SDK dependencies"
```

---

### Task 2: Config and Auth Modules

**Files:**

- Create: `src/config.ts`
- Create: `src/auth.ts`

- [ ] **Step 1: Create src/config.ts**

```typescript
const DOKPLOY_API_TOKEN = process.env.DOKPLOY_API_TOKEN;
if (!DOKPLOY_API_TOKEN) {
  console.error(
    "DOKPLOY_API_TOKEN is required. Launch with: op run --env-file=.env.tpl -- bun run src/index.ts",
  );
  process.exit(1);
}

export const config = {
  apiToken: DOKPLOY_API_TOKEN,
  baseUrl: process.env.DOKPLOY_URL ?? "https://dokploy.wyattjoh.dev/api",
} as const;
```

- [ ] **Step 2: Create src/auth.ts**

```typescript
import { timingSafeEqual } from "node:crypto";

function sha256(input: string): Buffer {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(input);
  return hasher.digest() as Buffer;
}

export function validateBearerToken(authHeader: string | null, expectedToken: string): boolean {
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }
  const token = authHeader.slice(7);
  return timingSafeEqual(sha256(token), sha256(expectedToken));
}
```

- [ ] **Step 3: Commit**

```bash
git add src/config.ts src/auth.ts
git commit -m "feat: add config and auth modules"
```

---

### Task 3: Dokploy API Client

**Files:**

- Create: `src/client.ts`

This is the typed fetch wrapper for all Dokploy API calls. Every tool delegates to this module.

- [ ] **Step 1: Create src/client.ts**

```typescript
import { config } from "./config.js";

class DokployError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`Dokploy API error ${status}: ${JSON.stringify(body)}`);
    this.name = "DokployError";
  }
}

async function get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${config.baseUrl}/${endpoint}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      "x-api-key": config.apiToken,
    },
  });
  if (!res.ok) {
    throw new DokployError(res.status, await res.json().catch(() => res.statusText));
  }
  return (await res.json()) as T;
}

async function post<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${config.baseUrl}/${endpoint}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "x-api-key": config.apiToken,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new DokployError(res.status, await res.json().catch(() => res.statusText));
  }
  return (await res.json()) as T;
}

// --- Projects ---

export function listProjects(): Promise<unknown[]> {
  return get<unknown[]>("project.all");
}

// --- Applications ---

export function searchApplications(
  params?: Record<string, string>,
): Promise<{ items: unknown[]; total: number }> {
  return get<{ items: unknown[]; total: number }>("application.search", params);
}

export function getApplication(applicationId: string): Promise<unknown> {
  return get<unknown>("application.one", { applicationId });
}

export function updateApplication(body: {
  applicationId: string;
  [key: string]: unknown;
}): Promise<true> {
  return post<true>("application.update", body);
}

export function deployApplication(body: {
  applicationId: string;
  title?: string;
  description?: string;
}): Promise<true> {
  return post<true>("application.deploy", body);
}

export function startApplication(applicationId: string): Promise<unknown> {
  return post<unknown>("application.start", { applicationId });
}

export function stopApplication(applicationId: string): Promise<unknown> {
  return post<unknown>("application.stop", { applicationId });
}

// --- Deployments ---

export function listDeployments(applicationId: string): Promise<unknown[]> {
  return get<unknown[]>("deployment.all", { applicationId });
}

// --- Domains ---

export function listDomains(applicationId: string): Promise<unknown[]> {
  return get<unknown[]>("domain.byApplicationId", { applicationId });
}

export function createDomain(body: {
  host: string;
  applicationId: string;
  https?: boolean;
  port?: number;
  path?: string;
  certificateType?: "letsencrypt" | "none" | "custom";
}): Promise<unknown> {
  return post<unknown>("domain.create", body);
}

// --- Environment ---

export function saveEnvironment(body: {
  applicationId: string;
  env: string;
  buildArgs: string;
  buildSecrets: string;
  createEnvFile: boolean;
}): Promise<true> {
  return post<true>("application.saveEnvironment", body);
}

// --- Build Config ---

export function saveBuildType(body: {
  applicationId: string;
  buildType: string;
  dockerfile: string;
  dockerContextPath: string;
  dockerBuildStage: string;
  herokuVersion: string;
  railpackVersion: string;
}): Promise<true> {
  return post<true>("application.saveBuildType", body);
}

export function saveGithubProvider(body: {
  applicationId: string;
  repository: string;
  branch: string;
  owner: string;
  buildPath: string;
  githubId: string;
  triggerType?: "push" | "tag";
}): Promise<true> {
  return post<true>("application.saveGithubProvider", body);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client.ts
git commit -m "feat: add Dokploy API client"
```

---

### Task 4: Tool Modules (Projects, Applications, Deployments, Domains, Environment)

**Files:**

- Create: `src/tools/projects.ts`
- Create: `src/tools/applications.ts`
- Create: `src/tools/deployments.ts`
- Create: `src/tools/domains.ts`
- Create: `src/tools/environment.ts`

Each tool module exports a `register` function that takes an `McpServer` and registers its tools.

- [ ] **Step 1: Create src/tools/projects.ts**

```typescript
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listProjects } from "../client.js";

export function register(server: McpServer): void {
  server.registerTool(
    "dokploy_list_projects",
    {
      title: "List Projects",
      description: "List all projects in Dokploy",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async () => {
      const projects = await listProjects();
      return {
        content: [{ type: "text" as const, text: JSON.stringify(projects, null, 2) }],
      };
    },
  );
}
```

- [ ] **Step 2: Create src/tools/applications.ts (read + write operations)**

```typescript
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  searchApplications,
  getApplication,
  updateApplication,
  deployApplication,
  startApplication,
  stopApplication,
} from "../client.js";

export function register(server: McpServer): void {
  server.registerTool(
    "dokploy_list_applications",
    {
      title: "List Applications",
      description:
        "Search and list applications. All filter parameters are optional. Returns paginated results.",
      inputSchema: {
        projectId: z.string().optional().describe("Filter by project ID"),
        name: z.string().optional().describe("Filter by application name"),
        limit: z.number().min(1).max(100).optional().describe("Max results (1-100, default 20)"),
        offset: z.number().optional().describe("Offset for pagination"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async (args) => {
      const params: Record<string, string> = {};
      if (args.projectId) params.projectId = args.projectId;
      if (args.name) params.name = args.name;
      if (args.limit) params.limit = String(args.limit);
      if (args.offset) params.offset = String(args.offset);
      const result = await searchApplications(params);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "dokploy_get_application",
    {
      title: "Get Application",
      description:
        "Get full application config by ID. Returns all fields including env, buildArgs, buildSecrets, status, and git provider config.",
      inputSchema: {
        applicationId: z.string().describe("The application ID"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async ({ applicationId }) => {
      const app = await getApplication(applicationId);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(app, null, 2) }],
      };
    },
  );

  server.registerTool(
    "dokploy_update_application",
    {
      title: "Update Application",
      description:
        "Update application config fields. Only applicationId is required; all other fields are optional. Supports: name, appName, description, dockerfile, dockerContextPath, command, replicas, memoryLimit, cpuLimit, and more.",
      inputSchema: {
        applicationId: z.string().describe("The application ID"),
        updates: z.record(z.unknown()).describe("Key-value pairs of fields to update"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async ({ applicationId, updates }) => {
      await updateApplication({ applicationId, ...updates });
      return {
        content: [{ type: "text" as const, text: "Application updated successfully." }],
      };
    },
  );

  server.registerTool(
    "dokploy_deploy",
    {
      title: "Deploy Application",
      description: "Trigger a deployment for an application.",
      inputSchema: {
        applicationId: z.string().describe("The application ID"),
        title: z.string().optional().describe("Deployment title"),
        description: z.string().optional().describe("Deployment description"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
      },
    },
    async ({ applicationId, title, description }) => {
      await deployApplication({ applicationId, title, description });
      return {
        content: [{ type: "text" as const, text: "Deployment triggered successfully." }],
      };
    },
  );

  server.registerTool(
    "dokploy_start_application",
    {
      title: "Start Application",
      description: "Start a stopped application.",
      inputSchema: {
        applicationId: z.string().describe("The application ID"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
      },
    },
    async ({ applicationId }) => {
      await startApplication(applicationId);
      return {
        content: [{ type: "text" as const, text: "Application started successfully." }],
      };
    },
  );

  server.registerTool(
    "dokploy_stop_application",
    {
      title: "Stop Application",
      description: "Stop a running application.",
      inputSchema: {
        applicationId: z.string().describe("The application ID"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
      },
    },
    async ({ applicationId }) => {
      await stopApplication(applicationId);
      return {
        content: [{ type: "text" as const, text: "Application stopped successfully." }],
      };
    },
  );
}
```

- [ ] **Step 3: Create src/tools/deployments.ts**

```typescript
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listDeployments } from "../client.js";

export function register(server: McpServer): void {
  server.registerTool(
    "dokploy_list_deployments",
    {
      title: "List Deployments",
      description:
        "List deployments for an application (newest first). Returns status, logPath, startedAt, finishedAt, and errorMessage for each deployment.",
      inputSchema: {
        applicationId: z.string().describe("The application ID"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async ({ applicationId }) => {
      const deployments = await listDeployments(applicationId);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(deployments, null, 2) }],
      };
    },
  );
}
```

- [ ] **Step 4: Create src/tools/domains.ts**

```typescript
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listDomains, createDomain } from "../client.js";

export function register(server: McpServer): void {
  server.registerTool(
    "dokploy_list_domains",
    {
      title: "List Domains",
      description: "List all domains configured for an application.",
      inputSchema: {
        applicationId: z.string().describe("The application ID"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async ({ applicationId }) => {
      const domains = await listDomains(applicationId);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(domains, null, 2) }],
      };
    },
  );

  server.registerTool(
    "dokploy_create_domain",
    {
      title: "Create Domain",
      description: "Add a domain to an application.",
      inputSchema: {
        applicationId: z.string().describe("The application ID"),
        host: z.string().describe("The domain hostname (e.g. app.example.com)"),
        https: z.boolean().optional().describe("Enable HTTPS (default false)"),
        port: z.number().optional().describe("Container port to route to"),
        path: z.string().optional().describe("URL path prefix"),
        certificateType: z
          .enum(["letsencrypt", "none", "custom"])
          .optional()
          .describe("Certificate type"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
      },
    },
    async ({ applicationId, host, https, port, path, certificateType }) => {
      const domain = await createDomain({
        applicationId,
        host,
        https,
        port,
        path,
        certificateType,
      });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(domain, null, 2) }],
      };
    },
  );
}
```

- [ ] **Step 5: Create src/tools/environment.ts**

Dokploy stores env vars as newline-delimited `KEY=VALUE` strings, not structured objects. The tools parse and reconstruct this format.

```typescript
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApplication, saveEnvironment } from "../client.js";

function parseEnvString(env: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of env.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    result[trimmed.slice(0, eqIndex)] = trimmed.slice(eqIndex + 1);
  }
  return result;
}

function buildEnvString(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

export function register(server: McpServer): void {
  server.registerTool(
    "dokploy_list_environment",
    {
      title: "List Environment Variables",
      description: "List environment variables, build args, and build secrets for an application.",
      inputSchema: {
        applicationId: z.string().describe("The application ID"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async ({ applicationId }) => {
      const app = (await getApplication(applicationId)) as {
        env: string;
        buildArgs: string;
        buildSecrets: string;
      };
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                env: parseEnvString(app.env ?? ""),
                buildArgs: parseEnvString(app.buildArgs ?? ""),
                buildSecrets: parseEnvString(app.buildSecrets ?? ""),
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.registerTool(
    "dokploy_update_environment",
    {
      title: "Update Environment Variables",
      description:
        "Set environment variables for an application. Merges with existing vars (existing keys are overwritten, new keys are added, unmentioned keys are preserved).",
      inputSchema: {
        applicationId: z.string().describe("The application ID"),
        env: z.record(z.string()).optional().describe("Environment variables to set (KEY: VALUE)"),
        buildArgs: z.record(z.string()).optional().describe("Build arguments to set (KEY: VALUE)"),
        buildSecrets: z.record(z.string()).optional().describe("Build secrets to set (KEY: VALUE)"),
        createEnvFile: z
          .boolean()
          .optional()
          .describe("Write a .env file in the container (default false)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async ({ applicationId, env, buildArgs, buildSecrets, createEnvFile }) => {
      const app = (await getApplication(applicationId)) as {
        env: string;
        buildArgs: string;
        buildSecrets: string;
      };

      const currentEnv = parseEnvString(app.env ?? "");
      const currentBuildArgs = parseEnvString(app.buildArgs ?? "");
      const currentBuildSecrets = parseEnvString(app.buildSecrets ?? "");

      await saveEnvironment({
        applicationId,
        env: buildEnvString({ ...currentEnv, ...env }),
        buildArgs: buildEnvString({ ...currentBuildArgs, ...buildArgs }),
        buildSecrets: buildEnvString({ ...currentBuildSecrets, ...buildSecrets }),
        createEnvFile: createEnvFile ?? false,
      });

      return {
        content: [{ type: "text" as const, text: "Environment updated successfully." }],
      };
    },
  );

  server.registerTool(
    "dokploy_delete_environment",
    {
      title: "Delete Environment Variables",
      description: "Remove environment variables from an application by key name.",
      inputSchema: {
        applicationId: z.string().describe("The application ID"),
        keys: z.array(z.string()).describe("List of environment variable keys to remove"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
      },
    },
    async ({ applicationId, keys }) => {
      const app = (await getApplication(applicationId)) as {
        env: string;
        buildArgs: string;
        buildSecrets: string;
      };

      const currentEnv = parseEnvString(app.env ?? "");
      for (const key of keys) {
        delete currentEnv[key];
      }

      await saveEnvironment({
        applicationId,
        env: buildEnvString(currentEnv),
        buildArgs: app.buildArgs ?? "",
        buildSecrets: app.buildSecrets ?? "",
        createEnvFile: false,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: `Removed ${keys.length} environment variable(s).`,
          },
        ],
      };
    },
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/tools/
git commit -m "feat: add MCP tool modules for all Dokploy operations"
```

---

### Task 5: Build Config Tools

**Files:**

- Create: `src/tools/build.ts`

- [ ] **Step 1: Create src/tools/build.ts**

```typescript
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { saveBuildType, saveGithubProvider } from "../client.js";

export function register(server: McpServer): void {
  server.registerTool(
    "dokploy_save_build_type",
    {
      title: "Save Build Type",
      description:
        "Update build configuration for an application. All fields are required (pass empty string for unused fields).",
      inputSchema: {
        applicationId: z.string().describe("The application ID"),
        buildType: z
          .enum([
            "dockerfile",
            "heroku_buildpacks",
            "paketo_buildpacks",
            "nixpacks",
            "static",
            "railpack",
          ])
          .describe("Build type"),
        dockerfile: z.string().describe("Path to Dockerfile (e.g. './Dockerfile')"),
        dockerContextPath: z
          .string()
          .describe("Docker build context path (e.g. '.' for repo root)"),
        dockerBuildStage: z
          .string()
          .describe("Docker build stage (empty string if not using multi-stage)"),
        herokuVersion: z.string().describe("Heroku version (empty string if not using Heroku)"),
        railpackVersion: z
          .string()
          .describe("Railpack version (empty string if not using Railpack)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async (args) => {
      await saveBuildType(args);
      return {
        content: [{ type: "text" as const, text: "Build type saved successfully." }],
      };
    },
  );

  server.registerTool(
    "dokploy_save_github_provider",
    {
      title: "Save GitHub Provider",
      description: "Update GitHub source configuration for an application.",
      inputSchema: {
        applicationId: z.string().describe("The application ID"),
        repository: z.string().describe("GitHub repository name"),
        branch: z.string().describe("Branch to deploy from"),
        owner: z.string().describe("GitHub repository owner"),
        buildPath: z.string().describe("Build path within the repo ('/' for root)"),
        githubId: z.string().describe("GitHub integration ID"),
        triggerType: z
          .enum(["push", "tag"])
          .optional()
          .describe("Deploy trigger type (default 'push')"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async (args) => {
      await saveGithubProvider(args);
      return {
        content: [{ type: "text" as const, text: "GitHub provider saved successfully." }],
      };
    },
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/tools/build.ts
git commit -m "feat: add build config tool module"
```

---

### Task 6: MCP Server Setup

**Files:**

- Create: `src/server.ts`

- [ ] **Step 1: Create src/server.ts**

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { register as registerProjects } from "./tools/projects.js";
import { register as registerApplications } from "./tools/applications.js";
import { register as registerDeployments } from "./tools/deployments.js";
import { register as registerDomains } from "./tools/domains.js";
import { register as registerEnvironment } from "./tools/environment.js";
import { register as registerBuild } from "./tools/build.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "dokploy-mcp",
    version: "1.0.0",
  });

  registerProjects(server);
  registerApplications(server);
  registerDeployments(server);
  registerDomains(server);
  registerEnvironment(server);
  registerBuild(server);

  return server;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/server.ts
git commit -m "feat: add MCP server setup with tool registration"
```

---

### Task 7: Entry Point with Dual Transport

**Files:**

- Create: `src/index.ts`

- [ ] **Step 1: Create src/index.ts**

```typescript
import "./config.js"; // Validate env vars on startup (side-effect import)
import { createServer } from "./server.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { config } from "./config.js";
import { validateBearerToken } from "./auth.js";

const args = process.argv.slice(2);
const isHttp = args.includes("--http");
const portIndex = args.indexOf("--port");
const port = portIndex !== -1 ? Number(args[portIndex + 1]) : 3000;

if (isHttp) {
  await startHttp(port);
} else {
  await startStdio();
}

async function startStdio(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("dokploy-mcp: stdio transport ready");
}

async function startHttp(port: number): Promise<void> {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless
  });
  await server.connect(transport);

  const app = express();
  app.use(express.json());

  app.post("/mcp", async (req, res) => {
    const authorized = validateBearerToken(req.headers.authorization ?? null, config.apiToken);
    if (!authorized) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    try {
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.listen(port, () => {
    console.error(`dokploy-mcp: HTTP transport ready on port ${port}`);
  });
}
```

- [ ] **Step 2: Verify stdio transport starts**

Run:

```bash
echo '{}' | DOKPLOY_API_TOKEN=test bun run src/index.ts 2>&1 | head -5
```

Expected: Should see "dokploy-mcp: stdio transport ready" on stderr.

- [ ] **Step 3: Verify HTTP transport starts**

Run:

```bash
DOKPLOY_API_TOKEN=test bun run src/index.ts --http --port 3001 &
sleep 1
curl -s http://localhost:3001/health
kill %1
```

Expected: `{"status":"ok"}`

- [ ] **Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat: add entry point with stdio and HTTP transport"
```

---

### Task 8: Integration Test with Live API

**Files:** None (manual verification)

- [ ] **Step 1: Test stdio mode with op run**

Run:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}' | \
  op run --env-file=.env.tpl -- bun run src/index.ts 2>/dev/null | head -1
```

Expected: JSON response with server capabilities (Touch ID prompt once).

- [ ] **Step 2: Test HTTP mode list projects**

Start the server in HTTP mode:

```bash
op run --env-file=.env.tpl -- bun run src/index.ts --http --port 3001 &
```

Then test the list projects tool via MCP protocol:

```bash
API_KEY=$(op read 'op://Personal/Dokploy API Token - Claude Code Cybersphere/credential')

# Initialize
curl -s -X POST http://localhost:3001/mcp \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}'

# Call tool
curl -s -X POST http://localhost:3001/mcp \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"dokploy_list_projects","arguments":{}}}'

kill %1
```

Expected: JSON response containing Dokploy projects.

- [ ] **Step 3: Test auth rejection**

```bash
op run --env-file=.env.tpl -- bun run src/index.ts --http --port 3001 &
sleep 1
curl -s -X POST http://localhost:3001/mcp \
  -H "Authorization: Bearer wrong-token" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}'
kill %1
```

Expected: `{"error":"Unauthorized"}` with HTTP 401.

---

### Task 9: Lint, Format, Type Check

- [ ] **Step 1: Run oxlint**

```bash
bunx oxlint src/
```

Fix any issues found.

- [ ] **Step 2: Run oxfmt**

```bash
bunx oxfmt src/
```

- [ ] **Step 3: Run type check**

```bash
bun check
```

Fix any type errors found.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "chore: fix lint, formatting, and type errors"
```

---

### Task 10: Update dokploy-api Skill in claude-toolkit

**Files:**

- Modify: `/Users/wyatt.johnson/Code/github.com/wyattjoh/claude-toolkit/skills/dokploy-api/SKILL.md`

- [ ] **Step 1: Update SKILL.md**

Replace the skill content to reference MCP tools instead of curl snippets. Keep the gotchas section and SSH log reading. The new `allowed-tools` should list the MCP tool names plus `Bash(ssh:*)` for log reading.

Key changes:

- Replace `allowed-tools: Bash(deno:*, ssh:*)` with MCP tool names and `Bash(ssh:*)`
- Remove the Authentication section with `op read` snippets
- Remove all Quick Reference curl snippets
- Add a section explaining the MCP server and `.mcp.json` config
- Keep Known Applications table
- Keep Key Gotchas section
- Keep the references/ directory

Updated frontmatter `allowed-tools`:

```yaml
allowed-tools:
  - mcp__dokploy__dokploy_list_projects
  - mcp__dokploy__dokploy_list_applications
  - mcp__dokploy__dokploy_get_application
  - mcp__dokploy__dokploy_list_deployments
  - mcp__dokploy__dokploy_list_domains
  - mcp__dokploy__dokploy_list_environment
  - mcp__dokploy__dokploy_deploy
  - mcp__dokploy__dokploy_update_application
  - mcp__dokploy__dokploy_start_application
  - mcp__dokploy__dokploy_stop_application
  - mcp__dokploy__dokploy_save_build_type
  - mcp__dokploy__dokploy_save_github_provider
  - mcp__dokploy__dokploy_create_domain
  - mcp__dokploy__dokploy_update_environment
  - mcp__dokploy__dokploy_delete_environment
  - Bash(ssh:*)
  - Read
  - Grep
  - Glob
  - AskUserQuestion
```

Add a `.mcp.json` example section:

```json
{
  "mcpServers": {
    "dokploy": {
      "command": "op",
      "args": [
        "run",
        "--env-file=/Users/wyatt.johnson/Code/github.com/wyattjoh/dokploy-mcp/.env.tpl",
        "--",
        "bun",
        "run",
        "/Users/wyatt.johnson/Code/github.com/wyattjoh/dokploy-mcp/src/index.ts"
      ]
    }
  }
}
```

- [ ] **Step 2: Commit in claude-toolkit repo**

```bash
cd /Users/wyatt.johnson/Code/github.com/wyattjoh/claude-toolkit
git add skills/dokploy-api/SKILL.md
git commit -m "refactor(dokploy-api): replace curl snippets with MCP tool references"
```

---

### Task 11: Final Verification

- [ ] **Step 1: Start a fresh Claude Code session with .mcp.json configured**

Add the `.mcp.json` to the dokploy-mcp project root (or the user's global config) and verify that:

1. Claude Code launches the MCP server via `op run`
2. Touch ID prompts exactly once
3. All 15 tools appear in Claude's tool list
4. A multi-step workflow (list projects, get app, deploy) completes without additional Touch ID prompts

- [ ] **Step 2: Commit .mcp.json if adding to project**

```bash
git add .mcp.json
git commit -m "chore: add MCP server config for Claude Code"
```
