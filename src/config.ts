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
  const hasLegacy = hasLegacyToken;

  // Collect multi-instance tokens and URLs directly from env vars.
  // Store values during scanning to avoid reconstructing key names later.
  const multiTokens = new Map<string, string>(); // name -> token value
  const multiUrls = new Map<string, string>(); // name -> url value
  const multiTokenKeys = new Map<string, string>(); // name -> original env key
  const multiUrlKeys = new Map<string, string>(); // name -> original env key

  for (const key of Object.keys(env)) {
    if (!key.startsWith("DOKPLOY_")) continue;

    const withoutPrefix = key.slice("DOKPLOY_".length);

    if (withoutPrefix.endsWith("_API_TOKEN")) {
      const rawName = withoutPrefix.slice(0, -"_API_TOKEN".length);
      if (EXCLUDED_SUFFIXES.has(rawName)) continue;
      if (rawName === "") continue;
      const value = env[key];
      if (!isBlank(value)) {
        const name = rawName.toLowerCase();
        multiTokens.set(name, value!.trim());
        multiTokenKeys.set(name, key);
      }
    } else if (withoutPrefix.endsWith("_URL")) {
      const rawName = withoutPrefix.slice(0, -"_URL".length);
      if (EXCLUDED_SUFFIXES.has(rawName)) continue;
      if (rawName === "") continue;
      const value = env[key];
      if (!isBlank(value)) {
        const name = rawName.toLowerCase();
        multiUrls.set(name, value!.trim());
        multiUrlKeys.set(name, key);
      }
    }
  }

  const allMultiNames = new Set([...multiTokens.keys(), ...multiUrls.keys()]);
  const hasMulti = allMultiNames.size > 0;

  if (hasLegacy && hasMulti) {
    console.error(
      "Configuration error: DOKPLOY_API_TOKEN (legacy single-instance) cannot coexist with multi-instance vars (DOKPLOY_<NAME>_API_TOKEN / DOKPLOY_<NAME>_URL). Use one mode or the other.",
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
          url: !isBlank(legacyUrl) ? legacyUrl!.trim() : DEFAULT_URL,
          apiToken: legacyToken!.trim(),
        },
      },
    };
  }

  // --- Multi-instance mode ---

  const instances: Record<string, InstanceConfig> = {};

  for (const name of allMultiNames) {
    if (!validateInstanceName(name)) {
      console.error(
        `Configuration error: instance name "${name}" is invalid. Names must match [a-z0-9]([a-z0-9_]*[a-z0-9])? (single chars like "a" or "1" are also valid).`,
      );
      process.exit(1);
    }

    const apiToken = multiTokens.get(name);
    const url = multiUrls.get(name);
    const tokenKey = multiTokenKeys.get(name);
    const urlKey = multiUrlKeys.get(name);

    if (!apiToken) {
      console.error(
        `Configuration error: instance "${name}" has a URL (${urlKey}) but no matching API token. Set DOKPLOY_${name.toUpperCase()}_API_TOKEN.`,
      );
      process.exit(1);
    }

    if (!url) {
      console.error(
        `Configuration error: instance "${name}" has an API token (${tokenKey}) but no URL. Set DOKPLOY_${name.toUpperCase()}_URL.`,
      );
      process.exit(1);
    }

    instances[name] = { name, url, apiToken };
  }

  return { mode: "multi", instances };
}

export const config: Config = buildConfig();
