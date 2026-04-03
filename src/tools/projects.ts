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
