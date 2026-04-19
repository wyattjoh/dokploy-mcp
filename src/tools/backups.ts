import type { InstanceAwareServer } from "../instance-aware-server.js";
import { z } from "zod";

const databaseTypeEnum = z.enum(["postgres", "mariadb", "mysql", "mongo", "web-server", "libsql"]);

const backupMetadataSchema = z
  .object({
    postgres: z.object({ databaseUser: z.string() }).optional(),
    mariadb: z.object({ databaseUser: z.string(), databasePassword: z.string() }).optional(),
    mongo: z.object({ databaseUser: z.string(), databasePassword: z.string() }).optional(),
    mysql: z.object({ databaseRootPassword: z.string() }).optional(),
  })
  .describe(
    "Credentials used by the backup routine to dump the DB running inside the compose stack.",
  );

export function register(server: InstanceAwareServer): void {
  server.registerTool(
    "dokploy_list_destinations",
    {
      title: "List Backup Destinations",
      description:
        "List all configured S3-compatible backup destinations. Use this to find a destinationId for creating backups.",
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    async ({ client }) => {
      const destinations = await client.listDestinations();
      return {
        content: [{ type: "text" as const, text: JSON.stringify(destinations, null, 2) }],
      };
    },
  );

  server.registerTool(
    "dokploy_create_compose_backup",
    {
      title: "Create Compose Backup",
      description:
        "Create a scheduled backup for a database running inside a compose stack. databaseType selects which DB inside the stack is being backed up (postgres/mariadb/mysql/mongo). metadata carries the credentials needed to dump that DB.",
      inputSchema: {
        composeId: z.string().describe("Compose stack ID the backup is attached to"),
        serviceName: z
          .string()
          .describe("Service name inside the compose file that runs the database"),
        databaseType: databaseTypeEnum.describe(
          "Which database engine inside the compose stack is being backed up",
        ),
        database: z.string().describe("Database name to dump"),
        destinationId: z.string().describe("Backup destination ID (see dokploy_list_destinations)"),
        schedule: z.string().describe("Cron schedule, e.g. '0 2 * * *' for daily at 2am"),
        prefix: z.string().describe("Path prefix inside the destination bucket"),
        enabled: z
          .boolean()
          .optional()
          .describe("Whether the schedule is active. Defaults to off."),
        keepLatestCount: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("If set, prune older backups beyond this count"),
        metadata: backupMetadataSchema.optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    async ({ client, ...input }) => {
      const backup = await client.createBackup({
        ...input,
        backupType: "compose",
      });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(backup, null, 2) }],
      };
    },
  );

  server.registerTool(
    "dokploy_get_backup",
    {
      title: "Get Backup",
      description:
        "Get a backup configuration by ID, including its destination and linked service.",
      inputSchema: {
        backupId: z.string().describe("The backup ID"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    async ({ client, backupId }) => {
      const backup = await client.getBackup(backupId);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(backup, null, 2) }],
      };
    },
  );

  server.registerTool(
    "dokploy_update_backup",
    {
      title: "Update Backup",
      description:
        "Update a backup configuration. Dokploy's update endpoint requires all fields (schedule, enabled, prefix, destinationId, database, keepLatestCount, serviceName, metadata, databaseType) to be present. Fetch the current config with dokploy_get_backup first, then send the merged result.",
      inputSchema: {
        backupId: z.string().describe("The backup ID"),
        schedule: z.string().describe("Cron schedule"),
        enabled: z.boolean().describe("Whether the schedule is active"),
        prefix: z.string().describe("Path prefix inside the destination bucket"),
        destinationId: z.string().describe("Backup destination ID"),
        database: z.string().describe("Database name to dump"),
        keepLatestCount: z.number().int().describe("Retention count"),
        serviceName: z.string().describe("Compose service name (empty string for non-compose)"),
        databaseType: databaseTypeEnum.describe("Database engine being backed up"),
        metadata: backupMetadataSchema,
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    async ({ client, ...input }) => {
      await client.updateBackup(input);
      return {
        content: [{ type: "text" as const, text: "Backup updated successfully." }],
      };
    },
  );

  server.registerTool(
    "dokploy_remove_backup",
    {
      title: "Remove Backup",
      description:
        "Delete a backup configuration. Does not delete previously created backup files at the destination.",
      inputSchema: {
        backupId: z.string().describe("The backup ID"),
      },
      annotations: { readOnlyHint: false, destructiveHint: true },
    },
    async ({ client, backupId }) => {
      await client.removeBackup(backupId);
      return {
        content: [{ type: "text" as const, text: "Backup removed successfully." }],
      };
    },
  );

  server.registerTool(
    "dokploy_trigger_compose_backup",
    {
      title: "Trigger Compose Backup",
      description: "Run a compose backup now, ignoring its schedule.",
      inputSchema: {
        backupId: z.string().describe("The backup ID"),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    async ({ client, backupId }) => {
      await client.triggerComposeBackup(backupId);
      return {
        content: [{ type: "text" as const, text: "Compose backup triggered successfully." }],
      };
    },
  );

  server.registerTool(
    "dokploy_list_backup_files",
    {
      title: "List Backup Files",
      description:
        "List backup files at a destination. search is a path-or-prefix inside the bucket; pass an empty string for the root. Returns up to 100 matching files.",
      inputSchema: {
        destinationId: z.string().describe("Backup destination ID"),
        search: z
          .string()
          .describe("Path prefix or filename fragment. Use '' for the bucket root."),
        serverId: z
          .string()
          .optional()
          .describe("Run the listing on a specific server (for remote-host destinations)"),
      },
      annotations: { readOnlyHint: true, destructiveHint: false },
    },
    async ({ client, destinationId, search, serverId }) => {
      const files = await client.listBackupFiles({ destinationId, search, serverId });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(files, null, 2) }],
      };
    },
  );
}
