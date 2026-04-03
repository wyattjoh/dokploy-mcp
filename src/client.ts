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

export function listAllApplications(): Promise<unknown[]> {
  return get<unknown[]>("project.all").then((projects: any[]) => {
    const apps: unknown[] = [];
    for (const project of projects) {
      for (const env of project.environments ?? []) {
        for (const app of env.applications ?? []) {
          apps.push({ ...app, projectName: project.name, environmentName: env.name });
        }
      }
    }
    return apps;
  });
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

// --- Compose ---

export function getCompose(composeId: string): Promise<unknown> {
  return get<unknown>("compose.one", { composeId });
}

export function deployCompose(body: {
  composeId: string;
  title?: string;
  description?: string;
}): Promise<true> {
  return post<true>("compose.deploy", body);
}

export function redeployCompose(body: {
  composeId: string;
  title?: string;
  description?: string;
}): Promise<true> {
  return post<true>("compose.redeploy", body);
}

export function startCompose(composeId: string): Promise<unknown> {
  return post<unknown>("compose.start", { composeId });
}

export function stopCompose(composeId: string): Promise<unknown> {
  return post<unknown>("compose.stop", { composeId });
}

export function updateCompose(body: { composeId: string; [key: string]: unknown }): Promise<true> {
  return post<true>("compose.update", body);
}

export function loadComposeServices(composeId: string): Promise<unknown[]> {
  return get<unknown[]>("compose.loadServices", { composeId });
}

export function listComposeDeployments(composeId: string): Promise<unknown[]> {
  return get<unknown[]>("deployment.allByCompose", { composeId });
}

export function listComposeDomains(composeId: string): Promise<unknown[]> {
  return get<unknown[]>("domain.byComposeId", { composeId });
}

// --- Operational ---

export function getContainers(serverId?: string): Promise<unknown[]> {
  const params = serverId ? { serverId } : undefined;
  return get<unknown[]>("docker.getContainers", params);
}

export function readAppMonitoring(appName: string): Promise<unknown> {
  return get<unknown>("application.readAppMonitoring", { appName });
}

export function redeployApplication(body: {
  applicationId: string;
  title?: string;
  description?: string;
}): Promise<true> {
  return post<true>("application.redeploy", body);
}

export function cancelDeployment(applicationId: string): Promise<unknown> {
  return post<unknown>("application.cancelDeployment", { applicationId });
}

export function killBuild(applicationId: string): Promise<unknown> {
  return post<unknown>("application.killBuild", { applicationId });
}

export function getDokployVersion(): Promise<unknown> {
  return get<unknown>("settings.getDokployVersion");
}

export function listServers(): Promise<unknown[]> {
  return get<unknown[]>("server.all");
}
