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
