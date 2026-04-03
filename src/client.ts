import { config } from "./config.js";
import type { InstanceConfig } from "./config.js";

export class DokployError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`Dokploy API error ${status}: ${JSON.stringify(body)}`);
    this.name = "DokployError";
  }
}

export class DokployClient {
  private readonly url: string;
  private readonly apiToken: string;

  constructor(instanceConfig: InstanceConfig) {
    this.url = instanceConfig.url;
    this.apiToken = instanceConfig.apiToken;
  }

  private async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.url}/${endpoint}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }
    const res = await fetch(url, {
      headers: {
        accept: "application/json",
        "x-api-key": this.apiToken,
      },
    });
    if (!res.ok) {
      throw new DokployError(res.status, await res.json().catch(() => res.statusText));
    }
    return (await res.json()) as T;
  }

  private async post<T>(endpoint: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.url}/${endpoint}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "x-api-key": this.apiToken,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new DokployError(res.status, await res.json().catch(() => res.statusText));
    }
    return (await res.json()) as T;
  }

  // --- Projects ---

  listProjects(): Promise<unknown[]> {
    return this.get<unknown[]>("project.all");
  }

  // --- Applications ---

  listAllApplications(): Promise<unknown[]> {
    return this.get<unknown[]>("project.all").then((projects: any[]) => {
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

  getApplication(applicationId: string): Promise<unknown> {
    return this.get<unknown>("application.one", { applicationId });
  }

  updateApplication(body: { applicationId: string; [key: string]: unknown }): Promise<true> {
    return this.post<true>("application.update", body);
  }

  deployApplication(body: {
    applicationId: string;
    title?: string;
    description?: string;
  }): Promise<true> {
    return this.post<true>("application.deploy", body);
  }

  startApplication(applicationId: string): Promise<unknown> {
    return this.post<unknown>("application.start", { applicationId });
  }

  stopApplication(applicationId: string): Promise<unknown> {
    return this.post<unknown>("application.stop", { applicationId });
  }

  // --- Deployments ---

  listDeployments(applicationId: string): Promise<unknown[]> {
    return this.get<unknown[]>("deployment.all", { applicationId });
  }

  // --- Domains ---

  listDomains(applicationId: string): Promise<unknown[]> {
    return this.get<unknown[]>("domain.byApplicationId", { applicationId });
  }

  createDomain(body: {
    host: string;
    applicationId: string;
    https?: boolean;
    port?: number;
    path?: string;
    certificateType?: "letsencrypt" | "none" | "custom";
  }): Promise<unknown> {
    return this.post<unknown>("domain.create", body);
  }

  // --- Environment ---

  saveEnvironment(body: {
    applicationId: string;
    env: string;
    buildArgs: string;
    buildSecrets: string;
    createEnvFile: boolean;
  }): Promise<true> {
    return this.post<true>("application.saveEnvironment", body);
  }

  // --- Build Config ---

  saveBuildType(body: {
    applicationId: string;
    buildType: string;
    dockerfile: string;
    dockerContextPath: string;
    dockerBuildStage: string;
    herokuVersion: string;
    railpackVersion: string;
  }): Promise<true> {
    return this.post<true>("application.saveBuildType", body);
  }

  saveGithubProvider(body: {
    applicationId: string;
    repository: string;
    branch: string;
    owner: string;
    buildPath: string;
    githubId: string;
    triggerType?: "push" | "tag";
  }): Promise<true> {
    return this.post<true>("application.saveGithubProvider", body);
  }

  // --- Compose ---

  getCompose(composeId: string): Promise<unknown> {
    return this.get<unknown>("compose.one", { composeId });
  }

  deployCompose(body: { composeId: string; title?: string; description?: string }): Promise<true> {
    return this.post<true>("compose.deploy", body);
  }

  redeployCompose(body: {
    composeId: string;
    title?: string;
    description?: string;
  }): Promise<true> {
    return this.post<true>("compose.redeploy", body);
  }

  startCompose(composeId: string): Promise<unknown> {
    return this.post<unknown>("compose.start", { composeId });
  }

  stopCompose(composeId: string): Promise<unknown> {
    return this.post<unknown>("compose.stop", { composeId });
  }

  updateCompose(body: { composeId: string; [key: string]: unknown }): Promise<true> {
    return this.post<true>("compose.update", body);
  }

  loadComposeServices(composeId: string): Promise<unknown[]> {
    return this.get<unknown[]>("compose.loadServices", { composeId });
  }

  listComposeDeployments(composeId: string): Promise<unknown[]> {
    return this.get<unknown[]>("deployment.allByCompose", { composeId });
  }

  listComposeDomains(composeId: string): Promise<unknown[]> {
    return this.get<unknown[]>("domain.byComposeId", { composeId });
  }

  // --- Operational ---

  getContainers(serverId?: string): Promise<unknown[]> {
    const params = serverId ? { serverId } : undefined;
    return this.get<unknown[]>("docker.getContainers", params);
  }

  readAppMonitoring(appName: string): Promise<unknown> {
    return this.get<unknown>("application.readAppMonitoring", { appName });
  }

  redeployApplication(body: {
    applicationId: string;
    title?: string;
    description?: string;
  }): Promise<true> {
    return this.post<true>("application.redeploy", body);
  }

  cancelDeployment(applicationId: string): Promise<unknown> {
    return this.post<unknown>("application.cancelDeployment", { applicationId });
  }

  killBuild(applicationId: string): Promise<unknown> {
    return this.post<unknown>("application.killBuild", { applicationId });
  }

  getDokployVersion(): Promise<unknown> {
    return this.get<unknown>("settings.getDokployVersion");
  }

  listServers(): Promise<unknown[]> {
    return this.get<unknown[]>("server.all");
  }
}

// Client cache keyed by instance name.
const clientCache = new Map<string, DokployClient>();

export function getClient(instance?: string): DokployClient {
  if (config.mode === "single") {
    const cached = clientCache.get("default");
    if (cached) return cached;
    const client = new DokployClient(config.instances["default"]);
    clientCache.set("default", client);
    return client;
  }

  // Multi mode: instance argument is required.
  if (!instance) {
    throw new Error(
      "Multi-instance mode requires an instance name. Available instances: " +
        Object.keys(config.instances).join(", "),
    );
  }

  const instanceConfig = config.instances[instance];
  if (!instanceConfig) {
    throw new Error(
      `Instance "${instance}" not found. Available instances: ` +
        Object.keys(config.instances).join(", "),
    );
  }

  const cached = clientCache.get(instance);
  if (cached) return cached;

  const client = new DokployClient(instanceConfig);
  clientCache.set(instance, client);
  return client;
}
