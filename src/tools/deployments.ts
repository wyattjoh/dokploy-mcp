import type { InstanceAwareServer } from "../instance-aware-server.js";
import { z } from "zod";

export function register(server: InstanceAwareServer): void {
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
    async ({ client, applicationId }) => {
      const deployments = await client.listDeployments(applicationId);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(deployments, null, 2) }],
      };
    },
  );
}
