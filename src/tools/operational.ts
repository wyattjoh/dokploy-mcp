import type { InstanceAwareServer } from "../instance-aware-server.js";
import { z } from "zod";

export function register(server: InstanceAwareServer): void {
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
    async ({ client, serverId }) => {
      const containers = await client.getContainers(serverId);
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
    async ({ client, appName }) => {
      const metrics = await client.readAppMonitoring(appName);
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
    async ({ client, applicationId, title, description }) => {
      await client.redeployApplication({ applicationId, title, description });
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
    async ({ client, applicationId }) => {
      await client.cancelDeployment(applicationId);
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
    async ({ client, applicationId }) => {
      await client.killBuild(applicationId);
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
    async ({ client }) => {
      const version = await client.getDokployVersion();
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
    async ({ client }) => {
      const servers = await client.listServers();
      return {
        content: [{ type: "text" as const, text: JSON.stringify(servers, null, 2) }],
      };
    },
  );
}
