import { Pool, type PoolClient } from "pg";

import {
  materializeAuditEvent,
  serializeAuditEventMaterial,
  type EvidencePackageAuditStore,
} from "@novaris/audit-lineage";
import {
  AUDIT_GENESIS_HASH,
  auditEventSchema,
  evidencePackageArtifactSchema,
  preparedAuditAppendSchema,
  type AuditAppendResult,
  type AuditEvent,
  type EvidencePackageArtifact,
  type PreparedAuditAppend,
  type StoredArtifactResult,
  type StoredAuditStreamResult,
} from "@novaris/shared-contracts";

export interface AuditPostgresConfig {
  connectionString: string;
}

interface ArtifactRow {
  artifact_id: string;
  package_id: string;
  artifact_type: string;
  media_type: string;
  canonical_bytes: Buffer;
  byte_length: string;
  bytes_fingerprint: string;
}

interface EventRow {
  event_hash: string;
  material_json: Record<string, unknown>;
}

function mapArtifact(row: ArtifactRow): EvidencePackageArtifact | undefined {
  const parsed = evidencePackageArtifactSchema.safeParse({
    artifactId: row.artifact_id,
    packageId: row.package_id,
    artifactType: row.artifact_type,
    mediaType: row.media_type,
    canonicalBytes: row.canonical_bytes.toString("utf8"),
    byteLength: Number(row.byte_length),
    bytesFingerprint: row.bytes_fingerprint,
  });
  return parsed.success ? parsed.data : undefined;
}

function mapEvent(row: EventRow): AuditEvent | undefined {
  const parsed = auditEventSchema.safeParse({
    ...row.material_json,
    eventHash: row.event_hash,
  });
  return parsed.success ? parsed.data : undefined;
}

async function selectArtifact(
  client: PoolClient,
  artifactId: string,
): Promise<EvidencePackageArtifact | undefined> {
  const result = await client.query<ArtifactRow>(
    `SELECT artifact_id, package_id, artifact_type, media_type, canonical_bytes,
            byte_length::text, bytes_fingerprint
       FROM novaris_audit.audit_artifacts WHERE artifact_id = $1`,
    [artifactId],
  );
  return result.rows[0] === undefined ? undefined : mapArtifact(result.rows[0]);
}

function persistenceError(error: unknown): AuditAppendResult {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  if (code === "42501")
    return { status: "error", reasonCode: "append_only_violation" };
  if (code.startsWith("08"))
    return { status: "error", reasonCode: "persistence_unavailable" };
  return { status: "error", reasonCode: "persistence_failure" };
}

export class PostgresAuditStore implements EvidencePackageAuditStore {
  readonly #pool: Pool;

  constructor(config: AuditPostgresConfig) {
    this.#pool = new Pool({
      connectionString: config.connectionString,
      max: 5,
    });
  }

  async append(commandInput: PreparedAuditAppend): Promise<AuditAppendResult> {
    const parsed = preparedAuditAppendSchema.safeParse(commandInput);
    if (!parsed.success)
      return { status: "error", reasonCode: "invalid_store_result" };
    const command = parsed.data;
    let client: PoolClient | undefined;
    try {
      client = await this.#pool.connect();
      await client.query("BEGIN");
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
        [command.streamId],
      );

      const idempotent = await client.query<EventRow>(
        `SELECT event_hash, material_json FROM novaris_audit.audit_events
          WHERE stream_id = $1 AND idempotency_key = $2`,
        [command.streamId, command.idempotencyKey],
      );
      if (idempotent.rows[0] !== undefined) {
        const event = mapEvent(idempotent.rows[0]);
        if (event === undefined) {
          await client.query("ROLLBACK");
          return { status: "error", reasonCode: "invalid_store_result" };
        }
        if (event.requestFingerprint !== command.requestFingerprint) {
          await client.query("ROLLBACK");
          return { status: "error", reasonCode: "idempotency_conflict" };
        }
        const artifact = await selectArtifact(client, event.artifactId);
        if (artifact === undefined) {
          await client.query("ROLLBACK");
          return { status: "error", reasonCode: "invalid_store_result" };
        }
        await client.query("COMMIT");
        return { status: "ok", event, artifact, replayed: true };
      }

      const logicalDuplicate = await client.query(
        `SELECT 1 FROM novaris_audit.audit_events
          WHERE stream_id = $1 AND event_type = 'evidence_package_persisted' AND artifact_id = $2`,
        [command.streamId, command.artifact.artifactId],
      );
      if (logicalDuplicate.rowCount !== 0) {
        await client.query("ROLLBACK");
        return { status: "error", reasonCode: "artifact_already_recorded" };
      }

      const head = await client.query<{ sequence: string; event_hash: string }>(
        `SELECT sequence::text, event_hash FROM novaris_audit.audit_events
          WHERE stream_id = $1 ORDER BY sequence DESC LIMIT 1`,
        [command.streamId],
      );
      const previousHash = head.rows[0]?.event_hash ?? AUDIT_GENESIS_HASH;
      if (previousHash !== command.expectedPreviousEventHash) {
        await client.query("ROLLBACK");
        return { status: "error", reasonCode: "stream_concurrency_conflict" };
      }

      const existingArtifact = await selectArtifact(
        client,
        command.artifact.artifactId,
      );
      if (existingArtifact !== undefined) {
        if (
          existingArtifact.canonicalBytes !== command.artifact.canonicalBytes ||
          existingArtifact.packageId !== command.artifact.packageId ||
          existingArtifact.bytesFingerprint !==
            command.artifact.bytesFingerprint
        ) {
          await client.query("ROLLBACK");
          return { status: "error", reasonCode: "artifact_hash_collision" };
        }
      } else {
        await client.query(
          `INSERT INTO novaris_audit.audit_artifacts
            (artifact_id, package_id, artifact_type, media_type, canonical_bytes,
             semantic_json, byte_length, bytes_fingerprint)
           VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8)`,
          [
            command.artifact.artifactId,
            command.artifact.packageId,
            command.artifact.artifactType,
            command.artifact.mediaType,
            Buffer.from(command.artifact.canonicalBytes),
            command.artifact.canonicalBytes,
            command.artifact.byteLength,
            command.artifact.bytesFingerprint,
          ],
        );
      }

      const sequence = String(BigInt(head.rows[0]?.sequence ?? "0") + 1n);
      const event = materializeAuditEvent(command, sequence, previousHash);
      const { eventHash: _eventHash, ...material } = event;
      const materialBytes = serializeAuditEventMaterial(material);
      await client.query(
        `INSERT INTO novaris_audit.audit_events
          (stream_id, sequence, event_hash, previous_event_hash, idempotency_key,
           request_fingerprint, event_type, artifact_id, package_id, story_id,
           policy_version, admission_input_fingerprint, admission_decision_fingerprint,
           occurred_at, material_bytes, material_json)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb)`,
        [
          event.streamId,
          event.sequence,
          event.eventHash,
          event.previousEventHash,
          event.idempotencyKey,
          event.requestFingerprint,
          event.eventType,
          event.artifactId,
          event.packageId,
          event.storyId,
          event.policyVersion,
          event.admissionInputFingerprint,
          event.admissionDecisionFingerprint,
          event.occurredAt,
          Buffer.from(materialBytes),
          materialBytes,
        ],
      );
      await client.query("COMMIT");
      return {
        status: "ok",
        event,
        artifact: command.artifact,
        replayed: false,
      };
    } catch (error: unknown) {
      if (client !== undefined) {
        try {
          await client.query("ROLLBACK");
        } catch {}
      }
      return persistenceError(error);
    } finally {
      client?.release();
    }
  }

  async readStream(streamId: string): Promise<StoredAuditStreamResult> {
    try {
      const result = await this.#pool.query<EventRow>(
        `SELECT event_hash, material_json FROM novaris_audit.audit_events
          WHERE stream_id = $1 ORDER BY sequence`,
        [streamId],
      );
      return {
        status: "ok",
        events: result.rows.map((row) => ({
          ...row.material_json,
          eventHash: row.event_hash,
        })),
      };
    } catch {
      return { status: "error", reasonCode: "persistence_unavailable" };
    }
  }

  async readArtifact(artifactId: string): Promise<StoredArtifactResult> {
    try {
      const client = await this.#pool.connect();
      try {
        const artifact = await selectArtifact(client, artifactId);
        return artifact === undefined
          ? { status: "not_found" }
          : { status: "ok", artifact };
      } finally {
        client.release();
      }
    } catch {
      return { status: "error", reasonCode: "persistence_unavailable" };
    }
  }

  async close(): Promise<void> {
    await this.#pool.end();
  }
}
