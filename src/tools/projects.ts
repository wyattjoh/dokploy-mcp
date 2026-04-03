import type { InstanceAwareServer } from "../instance-aware-server.js";

export function register(server: InstanceAwareServer): void {
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
    async ({ client }) => {
      const projects = await client.listProjects();
      return {
        content: [{ type: "text" as const, text: JSON.stringify(projects, null, 2) }],
      };
    },
  );
}
