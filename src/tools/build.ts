import type { InstanceAwareServer } from "../instance-aware-server.js";
import { z } from "zod";

export function register(server: InstanceAwareServer): void {
  server.registerTool(
    "dokploy_save_build_type",
    {
      title: "Save Build Type",
      description:
        "Update build configuration for an application. All fields are required (pass empty string for unused fields).",
      inputSchema: {
        applicationId: z.string().describe("The application ID"),
        buildType: z
          .enum([
            "dockerfile",
            "heroku_buildpacks",
            "paketo_buildpacks",
            "nixpacks",
            "static",
            "railpack",
          ])
          .describe("Build type"),
        dockerfile: z.string().describe("Path to Dockerfile (e.g. './Dockerfile')"),
        dockerContextPath: z
          .string()
          .describe("Docker build context path (e.g. '.' for repo root)"),
        dockerBuildStage: z
          .string()
          .describe("Docker build stage (empty string if not using multi-stage)"),
        herokuVersion: z.string().describe("Heroku version (empty string if not using Heroku)"),
        railpackVersion: z
          .string()
          .describe("Railpack version (empty string if not using Railpack)"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async ({ client, ...args }) => {
      await client.saveBuildType(args);
      return {
        content: [{ type: "text" as const, text: "Build type saved successfully." }],
      };
    },
  );

  server.registerTool(
    "dokploy_save_github_provider",
    {
      title: "Save GitHub Provider",
      description: "Update GitHub source configuration for an application.",
      inputSchema: {
        applicationId: z.string().describe("The application ID"),
        repository: z.string().describe("GitHub repository name"),
        branch: z.string().describe("Branch to deploy from"),
        owner: z.string().describe("GitHub repository owner"),
        buildPath: z.string().describe("Build path within the repo ('/' for root)"),
        githubId: z.string().describe("GitHub integration ID"),
        triggerType: z
          .enum(["push", "tag"])
          .optional()
          .describe("Deploy trigger type (default 'push')"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
      },
    },
    async ({ client, ...args }) => {
      await client.saveGithubProvider(args);
      return {
        content: [{ type: "text" as const, text: "GitHub provider saved successfully." }],
      };
    },
  );
}
