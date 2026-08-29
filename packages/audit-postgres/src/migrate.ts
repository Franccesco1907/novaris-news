import { readFile } from "node:fs/promises";

import { Client } from "pg";

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.length === 0)
    throw new Error(`${name} is required`);
  return value;
}

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function quoteLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

export async function migrateAuditDatabase(): Promise<void> {
  const client = new Client({
    connectionString: requiredEnvironment("AUDIT_MIGRATOR_URL"),
  });
  const runtimeUser = requiredEnvironment("AUDIT_RUNTIME_USER");
  const runtimePassword = requiredEnvironment("AUDIT_RUNTIME_PASSWORD");
  await client.connect();
  try {
    const role = await client.query(
      "SELECT 1 FROM pg_roles WHERE rolname = $1",
      [runtimeUser],
    );
    if (role.rowCount === 0) {
      await client.query(
        `CREATE ROLE ${quoteIdentifier(runtimeUser)} LOGIN PASSWORD ${quoteLiteral(runtimePassword)}`,
      );
    } else {
      await client.query(
        `ALTER ROLE ${quoteIdentifier(runtimeUser)} PASSWORD ${quoteLiteral(runtimePassword)}`,
      );
    }
    const sql = await readFile(
      new URL("../migrations/001_append_only_audit.sql", import.meta.url),
      "utf8",
    );
    await client.query(sql);
    const runtime = quoteIdentifier(runtimeUser);
    const database = await client.query<{ current_database: string }>(
      "SELECT current_database()",
    );
    const databaseName = quoteIdentifier(database.rows[0]!.current_database);
    await client.query(
      `REVOKE CONNECT ON DATABASE ${databaseName} FROM PUBLIC`,
    );
    await client.query(
      `GRANT CONNECT ON DATABASE ${databaseName} TO CURRENT_USER, ${runtime}`,
    );
    await client.query(`REVOKE ALL ON SCHEMA novaris_audit FROM ${runtime}`);
    await client.query(`GRANT USAGE ON SCHEMA novaris_audit TO ${runtime}`);
    await client.query(
      `REVOKE ALL ON ALL TABLES IN SCHEMA novaris_audit FROM ${runtime}`,
    );
    await client.query(
      `GRANT SELECT, INSERT ON novaris_audit.audit_artifacts, novaris_audit.audit_events TO ${runtime}`,
    );
  } finally {
    await client.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrateAuditDatabase().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
