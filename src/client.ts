import { config } from "./config.js";

class DokployError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`Dokploy API error ${status}: ${JSON.stringify(body)}`);
    this.name = "DokployError";
  }
}

async function get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${config.baseUrl}/${endpoint}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      "x-api-key": config.apiToken,
    },
  });
  if (!res.ok) {
    throw new DokployError(res.status, await res.json().catch(() => res.statusText));
  }
  return (await res.json()) as T;
}

async function post<T>(endpoint: string, body: unknown): Promise<T> {
  const res = await fetch(`${config.baseUrl}/${endpoint}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "x-api-key": config.apiToken,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new DokployError(res.status, await res.json().catch(() => res.statusText));
  }
  return (await res.json()) as T;
}

// --- Projects ---

export function listProjects(): Promise<unknown[]> {
  return get<unknown[]>("project.all");
}

// --- Applications ---

export function searchApplications(
  params?: Record<string, string>,
): Promise<{ items: unknown[]; total: number }> {
  return get<{ items: unknown[]; total: number }>("application.search", params);
}

export function getApplication(applicationId: string): Promise<unknown> {
  return get<unknown>("application.one", { applicationId });
}

export function updateApplication(body: {
  applicationId: string;
  [key: string]: unknown;
}): Promise<true> {
  return post<true>("application.update", body);
}

export function deployApplication(body: {
  applicationId: string;
  title?: string;
  description?: string;
}): Promise<true> {
  return post<true>("application.deploy", body);
}

export function startApplication(applicationId: string): Promise<unknown> {
  return post<unknown>("application.start", { applicationId });
}

export function stopApplication(applicationId: string): Promise<unknown> {
  return post<unknown>("application.stop", { applicationId });
}

// --- Deployments ---

export function listDeployments(applicationId: string): Promise<unknown[]> {
  return get<unknown[]>("deployment.all", { applicationId });
}

// --- Domains ---

export function listDomains(applicationId: string): Promise<unknown[]> {
  return get<unknown[]>("domain.byApplicationId", { applicationId });
}

export function createDomain(body: {
  host: string;
  applicationId: string;
  https?: boolean;
  port?: number;
  path?: string;
  certificateType?: "letsencrypt" | "none" | "custom";
}): Promise<unknown> {
  return post<unknown>("domain.create", body);
}

// --- Environment ---

export function saveEnvironment(body: {
  applicationId: string;
  env: string;
  buildArgs: string;
  buildSecrets: string;
  createEnvFile: boolean;
}): Promise<true> {
  return post<true>("application.saveEnvironment", body);
}

// --- Build Config ---

export function saveBuildType(body: {
  applicationId: string;
  buildType: string;
  dockerfile: string;
  dockerContextPath: string;
  dockerBuildStage: string;
  herokuVersion: string;
  railpackVersion: string;
}): Promise<true> {
  return post<true>("application.saveBuildType", body);
}

export function saveGithubProvider(body: {
  applicationId: string;
  repository: string;
  branch: string;
  owner: string;
  buildPath: string;
  githubId: string;
  triggerType?: "push" | "tag";
}): Promise<true> {
  return post<true>("application.saveGithubProvider", body);
}
