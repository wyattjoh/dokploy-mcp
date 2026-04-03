import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { register as registerProjects } from "./tools/projects.js";
import { register as registerApplications } from "./tools/applications.js";
import { register as registerDeployments } from "./tools/deployments.js";
import { register as registerDomains } from "./tools/domains.js";
import { register as registerEnvironment } from "./tools/environment.js";
import { register as registerBuild } from "./tools/build.js";
import { register as registerCompose } from "./tools/compose.js";
import { register as registerOperational } from "./tools/operational.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "dokploy-mcp",
    version: "1.0.0",
  });

  registerProjects(server);
  registerApplications(server);
  registerDeployments(server);
  registerDomains(server);
  registerEnvironment(server);
  registerBuild(server);
  registerCompose(server);
  registerOperational(server);

  return server;
}
