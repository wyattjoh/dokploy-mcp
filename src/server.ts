import { createRequire } from "node:module";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { config } from "./config.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };
import { InstanceAwareServer } from "./instance-aware-server.js";
import { register as registerProjects } from "./tools/projects.js";
import { register as registerApplications } from "./tools/applications.js";
import { register as registerDeployments } from "./tools/deployments.js";
import { register as registerDomains } from "./tools/domains.js";
import { register as registerEnvironment } from "./tools/environment.js";
import { register as registerBuild } from "./tools/build.js";
import { register as registerCompose } from "./tools/compose.js";
import { register as registerOperational } from "./tools/operational.js";
import { register as registerBackups } from "./tools/backups.js";
import { register as registerVolumeBackups } from "./tools/volume-backups.js";

export function createServer(): McpServer {
  const mcpServer = new McpServer({
    name: "dokploy-mcp",
    version,
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

  registerProjects(server);
  registerApplications(server);
  registerDeployments(server);
  registerDomains(server);
  registerEnvironment(server);
  registerBuild(server);
  registerCompose(server);
  registerOperational(server);
  registerBackups(server);
  registerVolumeBackups(server);

  return mcpServer;
}
