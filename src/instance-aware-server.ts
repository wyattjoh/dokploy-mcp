import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { config } from "./config.js";
import { getClient, type DokployClient } from "./client.js";

type ToolConfig = {
  title?: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
  _meta?: Record<string, unknown>;
};

type ClientAwareHandler<T extends Record<string, unknown> = Record<string, unknown>> = (
  args: T & { client: DokployClient },
) => Promise<{ content: Array<{ type: "text"; text: string }> }>;

export class InstanceAwareServer {
  private readonly _server: McpServer;

  constructor(server: McpServer) {
    this._server = server;
  }

  get raw(): McpServer {
    return this._server;
  }

  registerTool(name: string, toolConfig: ToolConfig, handler: ClientAwareHandler<any>): void {
    if (config.mode === "multi") {
      const augmentedSchema = {
        ...(toolConfig.inputSchema ?? {}),
        instance: z.string().describe("Dokploy instance name (e.g., prod, staging)"),
      };

      const augmentedConfig = { ...toolConfig, inputSchema: augmentedSchema };

      this._server.registerTool(
        name,
        augmentedConfig as any,
        async (args: Record<string, unknown>) => {
          const { instance, ...rest } = args;
          const client = getClient(instance as string);
          return handler({ ...rest, client });
        },
      );
    } else {
      this._server.registerTool(name, toolConfig as any, async (args: Record<string, unknown>) => {
        const client = getClient();
        return handler({ ...args, client });
      });
    }
  }
}
