import { createHash, timingSafeEqual } from "node:crypto";

const mcpToken = process.env.DOKPLOY_MCP_TOKEN?.trim() || undefined;

export function getMcpToken(): string | undefined {
  return mcpToken;
}

function sha256(input: string): Buffer {
  return createHash("sha256").update(input).digest();
}

export function validateBearerToken(authHeader: string | null): boolean {
  if (!mcpToken) {
    return false;
  }
  if (!authHeader?.startsWith("Bearer ")) {
    return false;
  }
  const token = authHeader.slice(7);
  return timingSafeEqual(sha256(token), sha256(mcpToken));
}
