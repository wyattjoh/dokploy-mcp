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
