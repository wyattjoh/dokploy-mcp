import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getContainers,
  readAppMonitoring,
  redeployApplication,
  cancelDeployment,
  killBuild,
  getDokployVersion,
  listServers,
} from "../client.js";

export function register(server: McpServer): void {
  server.registerTool(
    "dokploy_get_containers",
    {
      title: "Get Containers",
      description: "List all Docker containers. Optionally filter by server ID.",
      inputSchema: {
        serverId: z.string().optional().describe("Filter containers by server ID"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async ({ serverId }) => {
      const containers = await getContainers(serverId);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(containers, null, 2) }],
      };
    },
  );

  server.registerTool(
    "dokploy_get_app_monitoring",
    {
      title: "Get App Monitoring",
      description: "Get CPU and memory metrics for an application by its appName.",
      inputSchema: {
        appName: z.string().describe("The application appName (not applicationId)"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async ({ appName }) => {
      const metrics = await readAppMonitoring(appName);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(metrics, null, 2) }],
      };
    },
  );

  server.registerTool(
    "dokploy_redeploy_application",
    {
      title: "Redeploy Application",
      description: "Rebuild and redeploy an application from its existing source.",
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
      await redeployApplication({ applicationId, title, description });
      return {
        content: [
          { type: "text" as const, text: "Application redeployment triggered successfully." },
        ],
      };
    },
  );

  server.registerTool(
    "dokploy_cancel_deployment",
    {
      title: "Cancel Deployment",
      description: "Cancel a running deployment for an application.",
      inputSchema: {
        applicationId: z.string().describe("The application ID"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
      },
    },
    async ({ applicationId }) => {
      await cancelDeployment(applicationId);
      return {
        content: [{ type: "text" as const, text: "Deployment cancelled successfully." }],
      };
    },
  );

  server.registerTool(
    "dokploy_kill_build",
    {
      title: "Kill Build",
      description: "Kill a stuck or hung build for an application.",
      inputSchema: {
        applicationId: z.string().describe("The application ID"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
      },
    },
    async ({ applicationId }) => {
      await killBuild(applicationId);
      return {
        content: [{ type: "text" as const, text: "Build killed successfully." }],
      };
    },
  );

  server.registerTool(
    "dokploy_get_version",
    {
      title: "Get Dokploy Version",
      description: "Get the current Dokploy server version.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async () => {
      const version = await getDokployVersion();
      return {
        content: [{ type: "text" as const, text: JSON.stringify(version, null, 2) }],
      };
    },
  );

  server.registerTool(
    "dokploy_list_servers",
    {
      title: "List Servers",
      description: "List all servers registered in Dokploy.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async () => {
      const servers = await listServers();
      return {
        content: [{ type: "text" as const, text: JSON.stringify(servers, null, 2) }],
      };
    },
  );
}
