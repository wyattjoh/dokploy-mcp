import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { listDomains, createDomain } from "../client.js";

export function register(server: McpServer): void {
  server.registerTool(
    "dokploy_list_domains",
    {
      title: "List Domains",
      description: "List all domains configured for an application.",
      inputSchema: {
        applicationId: z.string().describe("The application ID"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
      },
    },
    async ({ applicationId }) => {
      const domains = await listDomains(applicationId);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(domains, null, 2) }],
      };
    },
  );

  server.registerTool(
    "dokploy_create_domain",
    {
      title: "Create Domain",
      description: "Add a domain to an application.",
      inputSchema: {
        applicationId: z.string().describe("The application ID"),
        host: z.string().describe("The domain hostname (e.g. app.example.com)"),
        https: z.boolean().optional().describe("Enable HTTPS (default false)"),
        port: z.number().optional().describe("Container port to route to"),
        path: z.string().optional().describe("URL path prefix"),
        certificateType: z
          .enum(["letsencrypt", "none", "custom"])
          .optional()
          .describe("Certificate type"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
      },
    },
    async ({ applicationId, host, https, port, path, certificateType }) => {
      const domain = await createDomain({
        applicationId,
        host,
        https,
        port,
        path,
        certificateType,
      });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(domain, null, 2) }],
      };
    },
  );
}
