import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getCompose,
  deployCompose,
  redeployCompose,
  startCompose,
  stopCompose,
  updateCompose,
  loadComposeServices,
  listComposeDeployments,
  listComposeDomains,
} from "../client.js";

export function register(server: McpServer): void {
  server.registerTool(
    "dokploy_get_compose",
    {
      title: "Get Compose",
      description: "Get compose stack config by ID.",
      inputSchema: {
        composeId: z.string().describe("The compose stack ID"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async ({ composeId }) => {
      const result = await getCompose(composeId);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    "dokploy_deploy_compose",
    {
      title: "Deploy Compose",
      description: "Deploy a compose stack.",
      inputSchema: {
        composeId: z.string().describe("The compose stack ID"),
        title: z.string().optional().describe("Deployment title"),
        description: z.string().optional().describe("Deployment description"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
      },
    },
    async ({ composeId, title, description }) => {
      await deployCompose({ composeId, title, description });
      return {
        content: [{ type: "text" as const, text: "Compose deployment triggered successfully." }],
      };
    },
  );

  server.registerTool(
    "dokploy_redeploy_compose",
    {
      title: "Redeploy Compose",
      description: "Redeploy a compose stack from existing source.",
      inputSchema: {
        composeId: z.string().describe("The compose stack ID"),
        title: z.string().optional().describe("Deployment title"),
        description: z.string().optional().describe("Deployment description"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
      },
    },
    async ({ composeId, title, description }) => {
      await redeployCompose({ composeId, title, description });
      return {
        content: [{ type: "text" as const, text: "Compose redeployment triggered successfully." }],
      };
    },
  );

  server.registerTool(
    "dokploy_start_compose",
    {
      title: "Start Compose",
      description: "Start a stopped compose stack.",
      inputSchema: {
        composeId: z.string().describe("The compose stack ID"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
      },
    },
    async ({ composeId }) => {
      await startCompose(composeId);
      return {
        content: [{ type: "text" as const, text: "Compose stack started successfully." }],
      };
    },
  );

  server.registerTool(
    "dokploy_stop_compose",
    {
      title: "Stop Compose",
      description: "Stop a running compose stack.",
      inputSchema: {
        composeId: z.string().describe("The compose stack ID"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
      },
    },
    async ({ composeId }) => {
      await stopCompose(composeId);
      return {
        content: [{ type: "text" as const, text: "Compose stack stopped successfully." }],
      };
    },
  );

  server.registerTool(
    "dokploy_update_compose",
    {
      title: "Update Compose",
      description:
        "Update compose stack config fields. Only composeId is required; all other fields are optional.",
      inputSchema: {
        composeId: z.string().describe("The compose stack ID"),
        updates: z.record(z.string(), z.unknown()).describe("Key-value pairs of fields to update"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async ({ composeId, updates }) => {
      await updateCompose({ composeId, ...updates });
      return {
        content: [{ type: "text" as const, text: "Compose stack updated successfully." }],
      };
    },
  );

  server.registerTool(
    "dokploy_list_compose_services",
    {
      title: "List Compose Services",
      description: "List services defined in a compose stack.",
      inputSchema: {
        composeId: z.string().describe("The compose stack ID"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async ({ composeId }) => {
      const services = await loadComposeServices(composeId);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(services, null, 2) }],
      };
    },
  );

  server.registerTool(
    "dokploy_list_compose_deployments",
    {
      title: "List Compose Deployments",
      description: "List deployments for a compose stack (newest first).",
      inputSchema: {
        composeId: z.string().describe("The compose stack ID"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async ({ composeId }) => {
      const deployments = await listComposeDeployments(composeId);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(deployments, null, 2) }],
      };
    },
  );

  server.registerTool(
    "dokploy_list_compose_domains",
    {
      title: "List Compose Domains",
      description: "List domains configured for a compose stack.",
      inputSchema: {
        composeId: z.string().describe("The compose stack ID"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async ({ composeId }) => {
      const domains = await listComposeDomains(composeId);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(domains, null, 2) }],
      };
    },
  );
}
