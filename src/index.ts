#!/usr/bin/env bun
import "./config.js"; // Validate env vars on startup (side-effect import)
import { createServer } from "./server.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { config } from "./config.js";
import { validateBearerToken } from "./auth.js";

const args = process.argv.slice(2);
const isHttp = args.includes("--http");
const portIndex = args.indexOf("--port");
const port = portIndex !== -1 ? Number(args[portIndex + 1]) : 3000;

if (isHttp) {
  await startHttp(port);
} else {
  await startStdio();
}

async function startStdio(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("dokploy-mcp: stdio transport ready");
}

async function startHttp(httpPort: number): Promise<void> {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless
  });
  await server.connect(transport);

  const app = express();
  app.use(express.json());

  app.post("/mcp", async (req, res) => {
    const authorized = validateBearerToken(req.headers.authorization ?? null, config.apiToken);
    if (!authorized) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    try {
      await transport.handleRequest(req, res, req.body);
    } catch {
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.listen(httpPort, () => {
    console.error(`dokploy-mcp: HTTP transport ready on port ${httpPort}`);
  });
}
