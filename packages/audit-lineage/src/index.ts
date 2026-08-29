import { createHash } from "node:crypto";

import { serializeEvidencePackage } from "@novaris/evidence-pipeline";
import {
  AUDIT_ARTIFACT_TYPE,
  AUDIT_EVENT_TYPE,
  AUDIT_GENESIS_HASH,
  AUDIT_MEDIA_TYPE,
  AUDIT_SCHEMA_VERSION,
  AUDIT_VERIFICATION_REASON,
  auditEventMaterialSchema,
  auditEventSchema,
  evidencePackageArtifactSchema,
  evidencePackageSchema,
  preparedAuditAppendSchema,
  storedArtifactResultSchema,
  storedAuditStreamResultSchema,
  type AuditAppendResult,
  type AuditEvent,
  type AuditEventMaterial,
  type AuditVerificationReason,
  type EvidencePackage,
  type EvidencePackageArtifact,
  type PreparedAuditAppend,
  type StoredArtifactResult,
  type StoredAuditStreamResult,
} from "@novaris/shared-contracts";

export interface EvidencePackageAuditStore {
  append(command: PreparedAuditAppend): Promise<AuditAppendResult>;
  readStream(streamId: string): Promise<StoredAuditStreamResult>;
  readArtifact(artifactId: string): Promise<StoredArtifactResult>;
}

export interface PrepareAuditAppendInput {
  package: EvidencePackage;
  idempotencyKey: string;
  occurredAt: string;
  expectedPreviousEventHash: string;
}

export type PrepareAuditAppendResult =
  | { status: "ok"; command: PreparedAuditAppend }
  | {
      status: "error";
      reasonCode: "invalid_evidence_package" | "package_identity_mismatch";
    };

export type AuditVerificationResult =
  | { status: "ok"; events: AuditEvent[]; headHash: string }
  | { status: "error"; reasonCode: AuditVerificationReason };

export type EvidencePackageReconstructionResult =
  | { status: "ok"; package: EvidencePackage; event: AuditEvent }
  | { status: "error"; reasonCode: AuditVerificationReason };

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function canonicalJson(value: unknown): string {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Non-finite number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => compareText(left, right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${canonicalJson(nested)}`)
      .join(",")}}`;
  }
  throw new TypeError("Unsupported canonical value");
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function eventHash(material: AuditEventMaterial): string {
  return sha256(canonicalJson(material));
}

export function serializeAuditEventMaterial(input: AuditEventMaterial): string {
  return canonicalJson(auditEventMaterialSchema.parse(input));
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value))
    return value;
  for (const nested of Object.values(value as Record<string, unknown>))
    deepFreeze(nested);
  return Object.freeze(value);
}

export function prepareEvidencePackageAuditAppend(
  input: PrepareAuditAppendInput,
): PrepareAuditAppendResult {
  const packageResult = evidencePackageSchema.safeParse(input.package);
  if (!packageResult.success)
    return { status: "error", reasonCode: "invalid_evidence_package" };
  const serialized = serializeEvidencePackage(packageResult.data);
  if (serialized.status !== "ok") {
    return {
      status: "error",
      reasonCode:
        serialized.reasonCode === "package_identity_mismatch"
          ? "package_identity_mismatch"
          : "invalid_evidence_package",
    };
  }

  const bytesFingerprint = sha256(serialized.bytes);
  const artifact: EvidencePackageArtifact = {
    artifactId: bytesFingerprint,
    packageId: packageResult.data.packageId,
    artifactType: AUDIT_ARTIFACT_TYPE.EVIDENCE_PACKAGE,
    mediaType: AUDIT_MEDIA_TYPE.EVIDENCE_PACKAGE,
    canonicalBytes: serialized.bytes,
    byteLength: Buffer.byteLength(serialized.bytes),
    bytesFingerprint,
  };
  const streamId = `story:${packageResult.data.storyId}`;
  const requestFingerprint = sha256(
    canonicalJson({
      artifactId: artifact.artifactId,
      expectedPreviousEventHash: input.expectedPreviousEventHash,
      idempotencyKey: input.idempotencyKey,
      occurredAt: input.occurredAt,
      streamId,
    }),
  );
  const parsed = preparedAuditAppendSchema.safeParse({
    artifact,
    streamId,
    idempotencyKey: input.idempotencyKey,
    requestFingerprint,
    expectedPreviousEventHash: input.expectedPreviousEventHash,
    occurredAt: input.occurredAt,
    packageLineage: {
      packageId: packageResult.data.packageId,
      storyId: packageResult.data.storyId,
      policyVersion: packageResult.data.policyVersion,
      admissionInputFingerprint: packageResult.data.admissionInputFingerprint,
      admissionDecisionFingerprint:
        packageResult.data.admissionDecisionFingerprint,
    },
  });
  if (!parsed.success)
    return { status: "error", reasonCode: "invalid_evidence_package" };
  return { status: "ok", command: deepFreeze(parsed.data) };
}

export function materializeAuditEvent(
  prepared: PreparedAuditAppend,
  sequence: string,
  previousEventHash: string,
): AuditEvent {
  const material = auditEventMaterialSchema.parse({
    schemaVersion: AUDIT_SCHEMA_VERSION.V1,
    streamId: prepared.streamId,
    sequence,
    previousEventHash,
    idempotencyKey: prepared.idempotencyKey,
    requestFingerprint: prepared.requestFingerprint,
    eventType: AUDIT_EVENT_TYPE.EVIDENCE_PACKAGE_PERSISTED,
    occurredAt: prepared.occurredAt,
    artifactId: prepared.artifact.artifactId,
    ...prepared.packageLineage,
  });
  return deepFreeze(
    auditEventSchema.parse({ ...material, eventHash: eventHash(material) }),
  );
}

function verificationFailure(
  reasonCode: AuditVerificationReason,
): AuditVerificationResult {
  return { status: "error", reasonCode };
}

async function verifyArtifact(
  event: AuditEvent,
  store: EvidencePackageAuditStore,
): Promise<
  | { status: "ok"; package: EvidencePackage }
  | { status: "error"; reasonCode: AuditVerificationReason }
> {
  let rawStored: unknown;
  try {
    rawStored = await store.readArtifact(event.artifactId);
  } catch {
    return { status: "error", reasonCode: "persistence_unavailable" };
  }
  const storedResult = storedArtifactResultSchema.safeParse(rawStored);
  if (!storedResult.success)
    return { status: "error", reasonCode: "invalid_store_result" };
  const stored = storedResult.data;
  if (stored.status === "not_found")
    return { status: "error", reasonCode: "missing_artifact" };
  if (stored.status === "error") {
    return {
      status: "error",
      reasonCode:
        stored.reasonCode === "persistence_unavailable"
          ? "persistence_unavailable"
          : "persistence_failure",
    };
  }
  const artifactResult = evidencePackageArtifactSchema.safeParse(
    stored.artifact,
  );
  if (!artifactResult.success)
    return { status: "error", reasonCode: "artifact_identity_mismatch" };
  const artifact = artifactResult.data;
  if (
    Buffer.byteLength(artifact.canonicalBytes) !== artifact.byteLength ||
    sha256(artifact.canonicalBytes) !== artifact.bytesFingerprint
  ) {
    return { status: "error", reasonCode: "artifact_bytes_mismatch" };
  }
  if (
    artifact.artifactId !== artifact.bytesFingerprint ||
    artifact.artifactId !== event.artifactId
  ) {
    return { status: "error", reasonCode: "artifact_identity_mismatch" };
  }
  let decoded: unknown;
  try {
    decoded = JSON.parse(artifact.canonicalBytes);
  } catch {
    return { status: "error", reasonCode: "artifact_bytes_mismatch" };
  }
  const packageResult = evidencePackageSchema.safeParse(decoded);
  if (!packageResult.success)
    return { status: "error", reasonCode: "artifact_identity_mismatch" };
  const serialized = serializeEvidencePackage(packageResult.data);
  if (serialized.status !== "ok")
    return { status: "error", reasonCode: "artifact_identity_mismatch" };
  if (
    serialized.bytes !== artifact.canonicalBytes ||
    packageResult.data.packageId !== artifact.packageId
  ) {
    return { status: "error", reasonCode: "artifact_identity_mismatch" };
  }
  const evidencePackage = packageResult.data;
  if (
    event.packageId !== evidencePackage.packageId ||
    event.storyId !== evidencePackage.storyId ||
    event.policyVersion !== evidencePackage.policyVersion ||
    event.admissionInputFingerprint !==
      evidencePackage.admissionInputFingerprint ||
    event.admissionDecisionFingerprint !==
      evidencePackage.admissionDecisionFingerprint
  ) {
    return { status: "error", reasonCode: "event_artifact_lineage_mismatch" };
  }
  return { status: "ok", package: evidencePackage };
}

export async function verifyAuditStream(
  streamId: string,
  expectedHeadHash: string,
  store: EvidencePackageAuditStore,
): Promise<AuditVerificationResult> {
  let rawStored: unknown;
  try {
    rawStored = await store.readStream(streamId);
  } catch {
    return verificationFailure(
      AUDIT_VERIFICATION_REASON.PERSISTENCE_UNAVAILABLE,
    );
  }
  const storedResult = storedAuditStreamResultSchema.safeParse(rawStored);
  if (!storedResult.success) {
    return verificationFailure(AUDIT_VERIFICATION_REASON.INVALID_STORE_RESULT);
  }
  const stored = storedResult.data;
  if (stored.status === "error") {
    return verificationFailure(
      stored.reasonCode === "persistence_unavailable"
        ? AUDIT_VERIFICATION_REASON.PERSISTENCE_UNAVAILABLE
        : AUDIT_VERIFICATION_REASON.PERSISTENCE_FAILURE,
    );
  }
  if (stored.events.length === 0) {
    return verificationFailure(AUDIT_VERIFICATION_REASON.STREAM_NOT_FOUND);
  }
  const events: AuditEvent[] = [];
  for (const raw of stored.events) {
    const parsed = auditEventSchema.safeParse(raw);
    if (!parsed.success || parsed.data.streamId !== streamId) {
      return verificationFailure(AUDIT_VERIFICATION_REASON.INVALID_AUDIT_EVENT);
    }
    events.push(parsed.data);
  }
  const successors = new Map<string, number>();
  for (const event of events) {
    successors.set(
      event.previousEventHash,
      (successors.get(event.previousEventHash) ?? 0) + 1,
    );
  }
  if ([...successors.values()].some((count) => count > 1)) {
    return verificationFailure(AUDIT_VERIFICATION_REASON.CHAIN_FORK);
  }
  events.sort((left, right) =>
    BigInt(left.sequence) < BigInt(right.sequence) ? -1 : 1,
  );
  let previousHash: string = AUDIT_GENESIS_HASH;
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index]!;
    if (BigInt(event.sequence) !== BigInt(index + 1)) {
      return verificationFailure(AUDIT_VERIFICATION_REASON.SEQUENCE_GAP);
    }
    if (event.previousEventHash !== previousHash) {
      return verificationFailure(AUDIT_VERIFICATION_REASON.CHAIN_HASH_MISMATCH);
    }
    const { eventHash: storedHash, ...material } = event;
    if (eventHash(auditEventMaterialSchema.parse(material)) !== storedHash) {
      return verificationFailure(AUDIT_VERIFICATION_REASON.CHAIN_HASH_MISMATCH);
    }
    const artifact = await verifyArtifact(event, store);
    if (artifact.status === "error")
      return verificationFailure(artifact.reasonCode);
    previousHash = event.eventHash;
  }
  if (previousHash !== expectedHeadHash) {
    return verificationFailure(AUDIT_VERIFICATION_REASON.TAIL_TRUNCATION);
  }
  return { status: "ok", events: deepFreeze(events), headHash: previousHash };
}

export async function reconstructEvidencePackage(
  streamId: string,
  sequence: string,
  expectedHeadHash: string,
  store: EvidencePackageAuditStore,
): Promise<EvidencePackageReconstructionResult> {
  const verification = await verifyAuditStream(
    streamId,
    expectedHeadHash,
    store,
  );
  if (verification.status === "error") return verification;
  const event = verification.events.find(
    (candidate) => candidate.sequence === sequence,
  );
  if (event === undefined)
    return { status: "error", reasonCode: "sequence_gap" };
  const artifact = await verifyArtifact(event, store);
  if (artifact.status === "error") return artifact;
  return { status: "ok", package: deepFreeze(artifact.package), event };
}

export type { EvidencePackage };
