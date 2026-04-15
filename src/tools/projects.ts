import { z } from "zod";
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

  server.registerTool(
    "dokploy_create_project",
    {
      title: "Create Project",
      description:
        "Create a new project. A default 'production' environment is created automatically.",
      inputSchema: {
        name: z.string().describe("Project name"),
        description: z.string().optional().describe("Project description"),
        env: z
          .string()
          .optional()
          .describe("Shared environment variables as newline-delimited KEY=VALUE pairs"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
      },
    },
    async ({ client, name, description, env }) => {
      const project = await client.createProject({ name, description, env });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(project, null, 2) }],
      };
    },
  );

  server.registerTool(
    "dokploy_create_environment",
    {
      title: "Create Environment",
      description: "Create a new environment within an existing project.",
      inputSchema: {
        name: z.string().describe("Environment name (e.g., staging, production)"),
        projectId: z.string().describe("The parent project ID"),
        description: z.string().optional().describe("Environment description"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
      },
    },
    async ({ client, name, projectId, description }) => {
      const environment = await client.createEnvironment({ name, projectId, description });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(environment, null, 2) }],
      };
    },
  );
}
