import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  prepareEvidencePackageAuditAppend,
  reconstructEvidencePackage,
} from "@novaris/audit-lineage";
import { assembleEvidencePackage } from "@novaris/evidence-pipeline";
import {
  AUDIT_GENESIS_HASH,
  type PreparedAuditAppend,
} from "@novaris/shared-contracts";

import { PostgresAuditStore } from "./index.js";
import { migrateAuditDatabase } from "./migrate.js";

const HASH_A: `sha256:${string}` = `sha256:${"a".repeat(64)}`;
const HASH_B: `sha256:${string}` = `sha256:${"b".repeat(64)}`;
const HASH_C: `sha256:${string}` = `sha256:${"c".repeat(64)}`;
const HASH_D: `sha256:${string}` = `sha256:${"d".repeat(64)}`;
const NOW = "2026-08-29T12:00:00.000Z";

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.length === 0)
    throw new Error(`${name} is required`);
  return value;
}

function prepareCommand(
  storyId: string,
  idempotencyKey: string,
  expectedPreviousEventHash = AUDIT_GENESIS_HASH,
  claimText = "The authority published an update.",
): PreparedAuditAppend {
  const decision = {
    outcome: "eligible" as const,
    reasonCodes: ["eligible_evidence" as const],
    independentOriginCount: 1,
  };
  const assembled = assembleEvidencePackage(
    {
      schemaVersion: "evidence-package-v1",
      admission: {
        input: {
          storyId,
          policyVersion: "phase1-v1",
          topic: "technology_science",
          policyServiceAvailable: true,
          provenanceStoreAvailable: true,
          containsDiscoveryContent: false,
          financialRecommendation: "none",
          excludedCategory: "none",
          evidence: [
            {
              documentId: `doc-${storyId}`,
              tier: "E1",
              originGroup: `origin-${storyId}`,
              rightsStatus: "approved",
              provenanceStatus: "complete",
              inRemit: true,
              current: true,
              materiallyContradicted: false,
            },
          ],
        },
        suppliedDecision: decision,
        decidedAt: NOW,
      },
      assembledAt: NOW,
      documents: [
        {
          documentId: `doc-${storyId}`,
          sourceId: "source-audit",
          tier: "E1",
          originGroup: `origin-${storyId}`,
          originNodeId: `origin-${storyId}`,
          sourceFingerprint: HASH_A,
          documentFingerprint: HASH_B,
          rightsSnapshot: {
            snapshotId: "rights-audit",
            snapshotHash: HASH_C,
            status: "approved",
            capturedAt: NOW,
            allowedUse: "publication_summary",
          },
          provenanceSnapshot: {
            snapshotId: "provenance-audit",
            snapshotHash: HASH_D,
            status: "complete",
            capturedAt: NOW,
          },
          inRemit: true,
          current: true,
          materiallyContradicted: false,
        },
      ],
      originGraph: {
        nodes: [{ originId: `origin-${storyId}`, fingerprint: HASH_A }],
        edges: [],
      },
      claims: [{ claimId: "claim-audit", text: claimText }],
      claimEvidenceLinks: [
        {
          claimId: "claim-audit",
          documentId: `doc-${storyId}`,
          evidenceFragmentFingerprint: HASH_B,
          locator: "paragraph:1",
        },
      ],
    },
    { evaluate: () => decision },
  );
  if (assembled.status !== "ok") throw new Error(assembled.reasonCode);
  const prepared = prepareEvidencePackageAuditAppend({
    package: assembled.package,
    idempotencyKey,
    occurredAt: NOW,
    expectedPreviousEventHash,
  });
  if (prepared.status !== "ok") throw new Error(prepared.reasonCode);
  return prepared.command;
}

describe("PostgreSQL append-only audit", () => {
  const runtimeUrl = requiredEnvironment("AUDIT_RUNTIME_URL");
  const migratorUrl = requiredEnvironment("AUDIT_MIGRATOR_URL");
  const runtimePool = new Pool({ connectionString: runtimeUrl });
  const migratorPool = new Pool({ connectionString: migratorUrl });

  beforeAll(async () => migrateAuditDatabase());
  afterAll(async () => Promise.all([runtimePool.end(), migratorPool.end()]));

  it("PG01 creates constrained tables and a least-privilege runtime role", async () => {
    const tables = await migratorPool.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'novaris_audit' ORDER BY tablename",
    );
    expect(tables.rows.map((row) => row.tablename)).toEqual([
      "audit_artifacts",
      "audit_events",
    ]);
    const privileges = await runtimePool.query(
      "SELECT has_table_privilege(current_user, 'novaris_audit.audit_events', 'SELECT,INSERT') AS allowed, has_table_privilege(current_user, 'novaris_audit.audit_events', 'UPDATE,DELETE,TRUNCATE') AS forbidden",
    );
    expect(privileges.rows[0]).toEqual({ allowed: true, forbidden: false });
  });

  it("PG02 persists lineage after close and reconnect", async () => {
    const first = new PostgresAuditStore({ connectionString: runtimeUrl });
    const receipt = await first.append(prepareCommand("pg02", "pg02-request"));
    expect(receipt.status).toBe("ok");
    await first.close();
    const second = new PostgresAuditStore({ connectionString: runtimeUrl });
    expect((await second.readStream("story:pg02")).status).toBe("ok");
    await second.close();
  });

  it("PG03 serializes concurrent appends against one trusted head", async () => {
    const store = new PostgresAuditStore({ connectionString: runtimeUrl });
    const results = await Promise.all([
      store.append(
        prepareCommand("pg03", "pg03-a", AUDIT_GENESIS_HASH, "Claim A"),
      ),
      store.append(
        prepareCommand("pg03", "pg03-b", AUDIT_GENESIS_HASH, "Claim B"),
      ),
    ]);
    expect(results.filter((result) => result.status === "ok")).toHaveLength(1);
    expect(results).toContainEqual({
      status: "error",
      reasonCode: "stream_concurrency_conflict",
    });
    await store.close();
  });

  it("PG04 replays an identical request without another row", async () => {
    const store = new PostgresAuditStore({ connectionString: runtimeUrl });
    const command = prepareCommand("pg04", "pg04-request");
    await store.append(command);
    expect(await store.append(command)).toMatchObject({
      status: "ok",
      replayed: true,
    });
    const count = await runtimePool.query(
      "SELECT count(*)::int AS count FROM novaris_audit.audit_events WHERE stream_id = $1",
      [command.streamId],
    );
    expect(count.rows[0].count).toBe(1);
    await store.close();
  });

  it("PG05 rejects conflicting idempotency intent", async () => {
    const store = new PostgresAuditStore({ connectionString: runtimeUrl });
    const command = prepareCommand("pg05", "pg05-request");
    await store.append(command);
    const changed = {
      ...command,
      requestFingerprint: HASH_A,
      artifact: {
        ...command.artifact,
        artifactId: HASH_C,
        bytesFingerprint: HASH_C,
      },
    };
    expect(await store.append(changed)).toEqual({
      status: "error",
      reasonCode: "idempotency_conflict",
    });
    await store.close();
  });

  it("PG06 rejects runtime mutation and upsert-update attempts", async () => {
    const attempts = [
      "UPDATE novaris_audit.audit_events SET idempotency_key = 'changed'",
      "DELETE FROM novaris_audit.audit_events",
      "TRUNCATE novaris_audit.audit_events",
      "INSERT INTO novaris_audit.audit_events SELECT * FROM novaris_audit.audit_events LIMIT 1 ON CONFLICT (stream_id, sequence) DO UPDATE SET idempotency_key = 'changed'",
    ];
    for (const sql of attempts)
      await expect(runtimePool.query(sql)).rejects.toThrow();
  });

  it("PG07 rejects an artifact hash collision", async () => {
    const store = new PostgresAuditStore({ connectionString: runtimeUrl });
    const command = prepareCommand("pg07", "pg07-request");
    await store.append(command);
    const collision = {
      ...command,
      streamId: "story:pg07-collision",
      idempotencyKey: "pg07-collision",
      requestFingerprint: HASH_B,
      artifact: {
        ...command.artifact,
        canonicalBytes: `${command.artifact.canonicalBytes} `,
      },
    };
    expect(await store.append(collision)).toEqual({
      status: "error",
      reasonCode: "artifact_hash_collision",
    });
    await store.close();
  });

  it("PG08 rolls back without an orphan artifact on event failure", async () => {
    const store = new PostgresAuditStore({ connectionString: runtimeUrl });
    const command = prepareCommand("pg08", "pg08-request", HASH_A);
    expect(await store.append(command)).toEqual({
      status: "error",
      reasonCode: "stream_concurrency_conflict",
    });
    expect(await store.readArtifact(command.artifact.artifactId)).toEqual({
      status: "not_found",
    });
    await store.close();
  });

  it("PG09 reconstructs and verifies a committed package", async () => {
    const store = new PostgresAuditStore({ connectionString: runtimeUrl });
    const receipt = await store.append(prepareCommand("pg09", "pg09-request"));
    if (receipt.status !== "ok") throw new Error(receipt.reasonCode);
    expect(
      await reconstructEvidencePackage(
        receipt.event.streamId,
        receipt.event.sequence,
        receipt.event.eventHash,
        store,
      ),
    ).toMatchObject({
      status: "ok",
      package: { packageId: receipt.artifact.packageId },
    });
    await store.close();
  });
});
