export type InstanceConfig = {
  name: string;
  url: string;
  apiToken: string;
};

export type Config = {
  mode: "single" | "multi";
  instances: Record<string, InstanceConfig>;
};

const DEFAULT_URL = "https://dokploy.wyattjoh.dev/api";

// Env var names to skip when scanning for multi-instance vars.
const EXCLUDED_SUFFIXES = new Set(["MCP_TOKEN"]);

function isBlank(value: string | undefined): value is undefined {
  return !value || value.trim().length === 0;
}

function validateInstanceName(name: string): boolean {
  return /^[a-z0-9]([a-z0-9_]*[a-z0-9])?$/.test(name);
}

function buildConfig(): Config {
  const env = process.env;

  const legacyToken = env["DOKPLOY_API_TOKEN"];
  const legacyUrl = env["DOKPLOY_URL"];

  const hasLegacyToken = !isBlank(legacyToken);
  const hasLegacyUrl = !isBlank(legacyUrl);
  const hasLegacy = hasLegacyToken || hasLegacyUrl;

  // Collect multi-instance names from DOKPLOY_<NAME>_API_TOKEN and DOKPLOY_<NAME>_URL.
  const multiNames = new Set<string>();
  for (const key of Object.keys(env)) {
    if (!key.startsWith("DOKPLOY_")) continue;

    const withoutPrefix = key.slice("DOKPLOY_".length);

    if (withoutPrefix.endsWith("_API_TOKEN")) {
      const rawName = withoutPrefix.slice(0, -"_API_TOKEN".length);
      if (EXCLUDED_SUFFIXES.has(rawName)) continue;
      if (rawName === "") continue;
      const name = rawName.toLowerCase();
      if (!isBlank(env[key])) multiNames.add(name);
    } else if (withoutPrefix.endsWith("_URL")) {
      const rawName = withoutPrefix.slice(0, -"_URL".length);
      if (EXCLUDED_SUFFIXES.has(rawName)) continue;
      if (rawName === "") continue;
      const name = rawName.toLowerCase();
      if (!isBlank(env[key])) multiNames.add(name);
    }
  }

  // Filter out "default" from multi names since that would come from DOKPLOY_DEFAULT_API_TOKEN,
  // which is distinct from the legacy DOKPLOY_API_TOKEN var.
  const hasMulti = multiNames.size > 0;

  if (hasLegacy && hasMulti) {
    console.error(
      "Configuration error: DOKPLOY_API_TOKEN / DOKPLOY_URL (legacy single-instance) cannot coexist with multi-instance vars (DOKPLOY_<NAME>_API_TOKEN / DOKPLOY_<NAME>_URL). Use one mode or the other.",
    );
    process.exit(1);
  }

  // --- Single-instance mode ---
  if (!hasMulti) {
    if (!hasLegacyToken) {
      console.error(
        "No Dokploy configuration found. Set DOKPLOY_API_TOKEN for single-instance mode, or DOKPLOY_<NAME>_API_TOKEN / DOKPLOY_<NAME>_URL pairs for multi-instance mode.",
      );
      process.exit(1);
    }

    return {
      mode: "single",
      instances: {
        default: {
          name: "default",
          url: hasLegacyUrl ? (legacyUrl as string).trim() : DEFAULT_URL,
          apiToken: (legacyToken as string).trim(),
        },
      },
    };
  }

  // --- Multi-instance mode ---

  // Validate each discovered name.
  for (const name of multiNames) {
    if (!validateInstanceName(name)) {
      console.error(
        `Configuration error: instance name "${name}" is invalid. Names must match [a-z0-9]([a-z0-9_]*[a-z0-9])? (single chars like "a" or "1" are also valid).`,
      );
      process.exit(1);
    }
  }

  const instances: Record<string, InstanceConfig> = {};

  for (const name of multiNames) {
    const rawName = name.toUpperCase();
    const tokenKey = `DOKPLOY_${rawName}_API_TOKEN`;
    const urlKey = `DOKPLOY_${rawName}_URL`;

    const apiToken = env[tokenKey];
    const url = env[urlKey];

    if (isBlank(apiToken)) {
      console.error(
        `Configuration error: instance "${name}" has a URL (${urlKey}) but no API token (${tokenKey}).`,
      );
      process.exit(1);
    }

    if (isBlank(url)) {
      console.error(
        `Configuration error: instance "${name}" has an API token (${tokenKey}) but no URL (${urlKey}). DOKPLOY_<NAME>_URL is required in multi-instance mode.`,
      );
      process.exit(1);
    }

    instances[name] = {
      name,
      url: (url as string).trim(),
      apiToken: (apiToken as string).trim(),
    };
  }

  return { mode: "multi", instances };
}

export const config: Config = buildConfig();
