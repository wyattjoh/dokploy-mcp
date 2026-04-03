import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getApplication, saveEnvironment } from "../client.js";

function parseEnvString(env: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of env.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    result[trimmed.slice(0, eqIndex)] = trimmed.slice(eqIndex + 1);
  }
  return result;
}

function buildEnvString(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

export function register(server: McpServer): void {
  server.registerTool(
    "dokploy_list_environment",
    {
      title: "List Environment Variables",
      description: "List environment variables, build args, and build secrets for an application.",
      inputSchema: {
        applicationId: z.string().describe("The application ID"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async ({ applicationId }) => {
      const app = (await getApplication(applicationId)) as {
        env: string;
        buildArgs: string;
        buildSecrets: string;
      };
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                env: parseEnvString(app.env ?? ""),
                buildArgs: parseEnvString(app.buildArgs ?? ""),
                buildSecrets: parseEnvString(app.buildSecrets ?? ""),
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.registerTool(
    "dokploy_update_environment",
    {
      title: "Update Environment Variables",
      description:
        "Set environment variables for an application. Merges with existing vars (existing keys are overwritten, new keys are added, unmentioned keys are preserved).",
      inputSchema: {
        applicationId: z.string().describe("The application ID"),
        env: z
          .record(z.string(), z.string())
          .optional()
          .describe("Environment variables to set (KEY: VALUE)"),
        buildArgs: z
          .record(z.string(), z.string())
          .optional()
          .describe("Build arguments to set (KEY: VALUE)"),
        buildSecrets: z
          .record(z.string(), z.string())
          .optional()
          .describe("Build secrets to set (KEY: VALUE)"),
        createEnvFile: z
          .boolean()
          .optional()
          .describe("Write a .env file in the container (default false)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async ({ applicationId, env, buildArgs, buildSecrets, createEnvFile }) => {
      const app = (await getApplication(applicationId)) as {
        env: string;
        buildArgs: string;
        buildSecrets: string;
      };

      const currentEnv = parseEnvString(app.env ?? "");
      const currentBuildArgs = parseEnvString(app.buildArgs ?? "");
      const currentBuildSecrets = parseEnvString(app.buildSecrets ?? "");

      await saveEnvironment({
        applicationId,
        env: buildEnvString({ ...currentEnv, ...(env ?? {}) }),
        buildArgs: buildEnvString({ ...currentBuildArgs, ...(buildArgs ?? {}) }),
        buildSecrets: buildEnvString({ ...currentBuildSecrets, ...(buildSecrets ?? {}) }),
        createEnvFile: createEnvFile ?? false,
      });

      return {
        content: [{ type: "text" as const, text: "Environment updated successfully." }],
      };
    },
  );

  server.registerTool(
    "dokploy_delete_environment",
    {
      title: "Delete Environment Variables",
      description: "Remove environment variables from an application by key name.",
      inputSchema: {
        applicationId: z.string().describe("The application ID"),
        keys: z.array(z.string()).describe("List of environment variable keys to remove"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
      },
    },
    async ({ applicationId, keys }) => {
      const app = (await getApplication(applicationId)) as {
        env: string;
        buildArgs: string;
        buildSecrets: string;
      };

      const currentEnv = parseEnvString(app.env ?? "");
      for (const key of keys) {
        delete currentEnv[key];
      }

      await saveEnvironment({
        applicationId,
        env: buildEnvString(currentEnv),
        buildArgs: app.buildArgs ?? "",
        buildSecrets: app.buildSecrets ?? "",
        createEnvFile: false,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: `Removed ${keys.length} environment variable(s).`,
          },
        ],
      };
    },
  );
}
