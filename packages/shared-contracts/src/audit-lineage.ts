import { z } from "zod";

import { evidencePackageSchema } from "./evidence-package.js";

export const AUDIT_SCHEMA_VERSION = { V1: "audit-event-v1" } as const;
export const AUDIT_ARTIFACT_TYPE = {
  EVIDENCE_PACKAGE: "evidence_package",
} as const;
export const AUDIT_EVENT_TYPE = {
  EVIDENCE_PACKAGE_PERSISTED: "evidence_package_persisted",
} as const;
export const AUDIT_MEDIA_TYPE = {
  EVIDENCE_PACKAGE: "application/vnd.novaris.evidence-package+json",
} as const;
export const AUDIT_GENESIS_HASH = `sha256:${"0".repeat(64)}` as const;

export const AUDIT_APPEND_REASON = {
  INVALID_EVIDENCE_PACKAGE: "invalid_evidence_package",
  PACKAGE_IDENTITY_MISMATCH: "package_identity_mismatch",
  ARTIFACT_HASH_COLLISION: "artifact_hash_collision",
  ARTIFACT_ALREADY_RECORDED: "artifact_already_recorded",
  IDEMPOTENCY_CONFLICT: "idempotency_conflict",
  STREAM_CONCURRENCY_CONFLICT: "stream_concurrency_conflict",
  APPEND_ONLY_VIOLATION: "append_only_violation",
  PERSISTENCE_UNAVAILABLE: "persistence_unavailable",
  PERSISTENCE_FAILURE: "persistence_failure",
  INVALID_STORE_RESULT: "invalid_store_result",
} as const;

export const AUDIT_VERIFICATION_REASON = {
  INVALID_STORE_RESULT: "invalid_store_result",
  PERSISTENCE_UNAVAILABLE: "persistence_unavailable",
  PERSISTENCE_FAILURE: "persistence_failure",
  STREAM_NOT_FOUND: "stream_not_found",
  INVALID_AUDIT_EVENT: "invalid_audit_event",
  SEQUENCE_GAP: "sequence_gap",
  CHAIN_HASH_MISMATCH: "chain_hash_mismatch",
  CHAIN_FORK: "chain_fork",
  TAIL_TRUNCATION: "tail_truncation",
  MISSING_ARTIFACT: "missing_artifact",
  ARTIFACT_BYTES_MISMATCH: "artifact_bytes_mismatch",
  ARTIFACT_IDENTITY_MISMATCH: "artifact_identity_mismatch",
  EVENT_ARTIFACT_LINEAGE_MISMATCH: "event_artifact_lineage_mismatch",
} as const;

export const auditSha256Schema = z.string().regex(/^sha256:[a-f0-9]{64}$/);
export const auditSequenceSchema = z.string().regex(/^[1-9][0-9]*$/);

export const evidencePackageArtifactSchema = z.object({
  artifactId: auditSha256Schema,
  packageId: auditSha256Schema,
  artifactType: z.literal(AUDIT_ARTIFACT_TYPE.EVIDENCE_PACKAGE),
  mediaType: z.literal(AUDIT_MEDIA_TYPE.EVIDENCE_PACKAGE),
  canonicalBytes: z.string().min(1),
  byteLength: z.number().int().nonnegative(),
  bytesFingerprint: auditSha256Schema,
});

export const auditEventMaterialSchema = z.object({
  schemaVersion: z.literal(AUDIT_SCHEMA_VERSION.V1),
  streamId: z.string().min(1),
  sequence: auditSequenceSchema,
  previousEventHash: auditSha256Schema,
  idempotencyKey: z.string().min(1),
  requestFingerprint: auditSha256Schema,
  eventType: z.literal(AUDIT_EVENT_TYPE.EVIDENCE_PACKAGE_PERSISTED),
  occurredAt: z.iso.datetime(),
  artifactId: auditSha256Schema,
  packageId: auditSha256Schema,
  storyId: z.string().min(1),
  policyVersion: z.literal("phase1-v1"),
  admissionInputFingerprint: auditSha256Schema,
  admissionDecisionFingerprint: auditSha256Schema,
});

export const auditEventSchema = auditEventMaterialSchema.extend({
  eventHash: auditSha256Schema,
});

export const preparedAuditAppendSchema = z.object({
  artifact: evidencePackageArtifactSchema,
  streamId: z.string().min(1),
  idempotencyKey: z.string().min(1),
  requestFingerprint: auditSha256Schema,
  expectedPreviousEventHash: auditSha256Schema,
  occurredAt: z.iso.datetime(),
  packageLineage: evidencePackageSchema.pick({
    packageId: true,
    storyId: true,
    policyVersion: true,
    admissionInputFingerprint: true,
    admissionDecisionFingerprint: true,
  }),
});

export const auditAppendResultSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("ok"),
    event: auditEventSchema,
    artifact: evidencePackageArtifactSchema,
    replayed: z.boolean(),
  }),
  z.object({
    status: z.literal("error"),
    reasonCode: z.enum(AUDIT_APPEND_REASON),
  }),
]);

export const storedAuditStreamResultSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("ok"), events: z.array(z.unknown()) }),
  z.object({
    status: z.literal("error"),
    reasonCode: z.enum(AUDIT_APPEND_REASON),
  }),
]);

export const storedArtifactResultSchema = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("ok"),
    artifact: evidencePackageArtifactSchema,
  }),
  z.object({ status: z.literal("not_found") }),
  z.object({
    status: z.literal("error"),
    reasonCode: z.enum(AUDIT_APPEND_REASON),
  }),
]);

export type EvidencePackageArtifact = z.infer<
  typeof evidencePackageArtifactSchema
>;
export type AuditEventMaterial = z.infer<typeof auditEventMaterialSchema>;
export type AuditEvent = z.infer<typeof auditEventSchema>;
export type PreparedAuditAppend = z.infer<typeof preparedAuditAppendSchema>;
export type AuditAppendResult = z.infer<typeof auditAppendResultSchema>;
export type StoredAuditStreamResult = z.infer<
  typeof storedAuditStreamResultSchema
>;
export type StoredArtifactResult = z.infer<typeof storedArtifactResultSchema>;
export type AuditAppendReason =
  (typeof AUDIT_APPEND_REASON)[keyof typeof AUDIT_APPEND_REASON];
export type AuditVerificationReason =
  (typeof AUDIT_VERIFICATION_REASON)[keyof typeof AUDIT_VERIFICATION_REASON];
