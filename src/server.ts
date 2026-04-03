import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { config } from "./config.js";
import { InstanceAwareServer } from "./instance-aware-server.js";
import { register as registerProjects } from "./tools/projects.js";
import { register as registerApplications } from "./tools/applications.js";
import { register as registerDeployments } from "./tools/deployments.js";
import { register as registerDomains } from "./tools/domains.js";
import { register as registerEnvironment } from "./tools/environment.js";
import { register as registerBuild } from "./tools/build.js";
import { register as registerCompose } from "./tools/compose.js";
import { register as registerOperational } from "./tools/operational.js";

export function createServer(): McpServer {
  const mcpServer = new McpServer({
    name: "dokploy-mcp",
    version: "1.0.0",
  });

  mcpServer.registerTool(
    "dokploy_list_instances",
    {
      title: "List Instances",
      description:
        "List all configured Dokploy instances. Returns instance names and URLs. Use this to discover valid instance names for other tools.",
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    async () => {
      const instances = Object.values(config.instances).map(({ name, url }) => ({ name, url }));
      return {
        content: [{ type: "text", text: JSON.stringify(instances, null, 2) }],
      };
    },
  );

  const server = new InstanceAwareServer(mcpServer);

  registerProjects(server as any);
  registerApplications(server as any);
  registerDeployments(server as any);
  registerDomains(server as any);
  registerEnvironment(server as any);
  registerBuild(server as any);
  registerCompose(server as any);
  registerOperational(server as any);

  return mcpServer;
}
