const DOKPLOY_API_TOKEN = process.env.DOKPLOY_API_TOKEN;
if (!DOKPLOY_API_TOKEN) {
  console.error(
    "DOKPLOY_API_TOKEN is required. Launch with: op run --env-file=.env.tpl -- bun run src/index.ts",
  );
  process.exit(1);
}

export const config = {
  apiToken: DOKPLOY_API_TOKEN,
  baseUrl: process.env.DOKPLOY_URL ?? "https://dokploy.wyattjoh.dev/api",
} as const;
