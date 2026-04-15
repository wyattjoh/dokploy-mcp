import type { InstanceAwareServer } from "../instance-aware-server.js";
import { z } from "zod";

export function register(server: InstanceAwareServer): void {
  server.registerTool(
    "dokploy_list_applications",
    {
      title: "List Applications",
      description:
        "List all applications across all projects and environments. Returns each application with its projectName and environmentName.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async ({ client }) => {
      const apps = await client.listAllApplications();
      return {
        content: [{ type: "text" as const, text: JSON.stringify(apps, null, 2) }],
      };
    },
  );

  server.registerTool(
    "dokploy_create_application",
    {
      title: "Create Application",
      description:
        "Create a new application within an environment. Git/build provider config (GitHub, Dockerfile, etc.) is set via separate update tools after creation.",
      inputSchema: {
        name: z.string().describe("Application display name"),
        environmentId: z.string().describe("The parent environment ID"),
        appName: z
          .string()
          .optional()
          .describe("Container app name, 1-63 chars. Auto-generated if omitted."),
        description: z.string().optional().describe("Application description"),
        serverId: z
          .string()
          .optional()
          .describe("Target server ID. Omit to deploy on the Dokploy host."),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
      },
    },
    async ({ client, name, environmentId, appName, description, serverId }) => {
      const application = await client.createApplication({
        name,
        environmentId,
        appName,
        description,
        serverId,
      });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(application, null, 2) }],
      };
    },
  );

  server.registerTool(
    "dokploy_get_application",
    {
      title: "Get Application",
      description:
        "Get application config by ID. Returns status, git provider config, and other fields. Environment variables and secrets are excluded; use dokploy_list_environment to access those.",
      inputSchema: {
        applicationId: z.string().describe("The application ID"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async ({ client, applicationId }) => {
      const app = (await client.getApplication(applicationId)) as Record<string, unknown>;
      const { env: _env, buildArgs: _buildArgs, buildSecrets: _buildSecrets, ...safe } = app;
      return {
        content: [{ type: "text" as const, text: JSON.stringify(safe, null, 2) }],
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
        updates: z.record(z.string(), z.unknown()).describe("Key-value pairs of fields to update"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async ({ client, applicationId, updates }) => {
      await client.updateApplication({ applicationId, ...updates });
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
    async ({ client, applicationId, title, description }) => {
      await client.deployApplication({ applicationId, title, description });
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
    async ({ client, applicationId }) => {
      await client.startApplication(applicationId);
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
    async ({ client, applicationId }) => {
      await client.stopApplication(applicationId);
      return {
        content: [{ type: "text" as const, text: "Application stopped successfully." }],
      };
    },
  );
}
