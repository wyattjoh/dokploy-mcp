import type { InstanceAwareServer } from "../instance-aware-server.js";
import { z } from "zod";

// Restore (volumeBackups.restoreVolumeBackupWithLogs) is a tRPC subscription
// with openapi.enabled: false, so it is not reachable over Dokploy's REST
// surface and cannot be wrapped here.

const supportedServiceTypeEnum = z.enum(["application", "compose"]);

export function register(server: InstanceAwareServer): void {
  server.registerTool(
    "dokploy_list_volume_backups",
    {
      title: "List Volume Backups",
      description:
        "List volume backups attached to a service. Pass the service ID and its type ('application' or 'compose').",
      inputSchema: {
        id: z.string().describe("Service ID (applicationId or composeId)"),
        serviceType: supportedServiceTypeEnum.describe("Which service kind the ID refers to"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    async ({ client, id, serviceType }) => {
      const backups = await client.listVolumeBackups({
        id,
        volumeBackupType: serviceType,
      });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(backups, null, 2) }],
      };
    },
  );

  server.registerTool(
    "dokploy_get_volume_backup",
    {
      title: "Get Volume Backup",
      description:
        "Get a volume backup configuration by ID, including its destination and linked service.",
      inputSchema: {
        volumeBackupId: z.string().describe("The volume backup ID"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    async ({ client, volumeBackupId }) => {
      const backup = await client.getVolumeBackup(volumeBackupId);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(backup, null, 2) }],
      };
    },
  );

  server.registerTool(
    "dokploy_create_application_volume_backup",
    {
      title: "Create Application Volume Backup",
      description:
        "Create a scheduled volume backup for an application. The named Docker volume is uploaded to the backup destination on the configured cron schedule.",
      inputSchema: {
        applicationId: z.string().describe("Application ID the backup is attached to"),
        name: z.string().describe("Display name for the backup"),
        volumeName: z.string().describe("Docker volume name to back up"),
        destinationId: z.string().describe("Backup destination ID (see dokploy_list_destinations)"),
        prefix: z.string().describe("Path prefix inside the destination bucket"),
        cronExpression: z.string().describe("Cron schedule, e.g. '0 2 * * *' for daily at 2am"),
        turnOff: z
          .boolean()
          .optional()
          .describe(
            "Stop the container during backup for a consistent snapshot. Defaults to false.",
          ),
        keepLatestCount: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("If set, prune older backups beyond this count"),
        enabled: z
          .boolean()
          .optional()
          .describe("Whether the schedule is active. Defaults to off."),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    async ({ client, ...input }) => {
      const backup = await client.createVolumeBackup({
        ...input,
        serviceType: "application",
      });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(backup, null, 2) }],
      };
    },
  );

  server.registerTool(
    "dokploy_create_compose_volume_backup",
    {
      title: "Create Compose Volume Backup",
      description:
        "Create a scheduled volume backup for a service inside a compose stack. serviceName identifies which service in the compose file owns the volume.",
      inputSchema: {
        composeId: z.string().describe("Compose stack ID the backup is attached to"),
        serviceName: z
          .string()
          .describe("Service name inside the compose file that owns the volume"),
        name: z.string().describe("Display name for the backup"),
        volumeName: z.string().describe("Docker volume name to back up"),
        destinationId: z.string().describe("Backup destination ID (see dokploy_list_destinations)"),
        prefix: z.string().describe("Path prefix inside the destination bucket"),
        cronExpression: z.string().describe("Cron schedule, e.g. '0 2 * * *' for daily at 2am"),
        turnOff: z
          .boolean()
          .optional()
          .describe(
            "Stop the container during backup for a consistent snapshot. Defaults to false.",
          ),
        keepLatestCount: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("If set, prune older backups beyond this count"),
        enabled: z
          .boolean()
          .optional()
          .describe("Whether the schedule is active. Defaults to off."),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    async ({ client, ...input }) => {
      const backup = await client.createVolumeBackup({
        ...input,
        serviceType: "compose",
      });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(backup, null, 2) }],
      };
    },
  );

  server.registerTool(
    "dokploy_update_volume_backup",
    {
      title: "Update Volume Backup",
      description:
        "Update a volume backup configuration. Fetch the current config with dokploy_get_volume_backup first, then send the merged result so existing fields are preserved. serviceName is required for compose backups; pass an empty string for application backups.",
      inputSchema: {
        volumeBackupId: z.string().describe("The volume backup ID"),
        name: z.string().describe("Display name for the backup"),
        volumeName: z.string().describe("Docker volume name to back up"),
        destinationId: z.string().describe("Backup destination ID"),
        prefix: z.string().describe("Path prefix inside the destination bucket"),
        cronExpression: z.string().describe("Cron schedule"),
        serviceName: z.string().describe("Compose service name (empty string for applications)"),
        turnOff: z.boolean().describe("Stop the container during backup for a consistent snapshot"),
        keepLatestCount: z.number().int().describe("Retention count"),
        enabled: z.boolean().describe("Whether the schedule is active"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    async ({ client, ...input }) => {
      await client.updateVolumeBackup(input);
      return {
        content: [{ type: "text" as const, text: "Volume backup updated successfully." }],
      };
    },
  );

  server.registerTool(
    "dokploy_remove_volume_backup",
    {
      title: "Remove Volume Backup",
      description:
        "Delete a volume backup configuration. Does not delete previously created backup files at the destination.",
      inputSchema: {
        volumeBackupId: z.string().describe("The volume backup ID"),
      },
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    async ({ client, volumeBackupId }) => {
      await client.removeVolumeBackup(volumeBackupId);
      return {
        content: [{ type: "text" as const, text: "Volume backup removed successfully." }],
      };
    },
  );

  server.registerTool(
    "dokploy_trigger_volume_backup",
    {
      title: "Trigger Volume Backup",
      description: "Run a volume backup now, ignoring its schedule.",
      inputSchema: {
        volumeBackupId: z.string().describe("The volume backup ID"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    async ({ client, volumeBackupId }) => {
      await client.runManualVolumeBackup(volumeBackupId);
      return {
        content: [{ type: "text" as const, text: "Volume backup triggered successfully." }],
      };
    },
  );
}
