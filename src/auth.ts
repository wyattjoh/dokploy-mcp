import { timingSafeEqual } from "node:crypto";

const mcpToken = process.env.DOKPLOY_MCP_TOKEN?.trim();

export function getMcpToken(): string | undefined {
  return mcpToken;
}

function sha256(input: string): Buffer {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(input);
  return hasher.digest() as Buffer;
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
