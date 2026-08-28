import { z } from "zod";

import {
  ADMISSION_OUTCOME,
  EVIDENCE_TIER,
  PROVENANCE_STATUS,
  RIGHTS_STATUS,
  TOPIC,
  evidenceAdmissionDecisionSchema,
  evidenceAdmissionInputSchema,
} from "./admission.js";

export const EVIDENCE_PACKAGE_SCHEMA_VERSION = {
  V1: "evidence-package-v1",
} as const;

export const RIGHTS_ALLOWED_USE = {
  PUBLICATION_SUMMARY: "publication_summary",
} as const;

export const EVIDENCE_PACKAGE_ASSEMBLY_REASON = {
  ADMISSION_NOT_ELIGIBLE: "admission_not_eligible",
  ADMISSION_DECISION_MISMATCH: "admission_decision_mismatch",
  INVALID_ADMISSION_EVALUATOR_OUTPUT: "invalid_admission_evaluator_output",
  ADMISSION_EVIDENCE_MISMATCH: "admission_evidence_mismatch",
  DISCOVERY_EVIDENCE_FORBIDDEN: "discovery_evidence_forbidden",
  INVALID_RIGHTS_SNAPSHOT: "invalid_rights_snapshot",
  INVALID_PROVENANCE_SNAPSHOT: "invalid_provenance_snapshot",
  MISSING_CLAIM_EVIDENCE_LINK: "missing_claim_evidence_link",
  UNKNOWN_CLAIM_REFERENCE: "unknown_claim_reference",
  UNKNOWN_DOCUMENT_REFERENCE: "unknown_document_reference",
  DUPLICATE_DOCUMENT_ID: "duplicate_document_id",
  DUPLICATE_CLAIM_ID: "duplicate_claim_id",
  DUPLICATE_ORIGIN_ID: "duplicate_origin_id",
  DUPLICATE_ORIGIN_EDGE: "duplicate_origin_edge",
  DUPLICATE_EVIDENCE_LINK: "duplicate_evidence_link",
  INVALID_ORIGIN_GRAPH: "invalid_origin_graph",
  NON_INDEPENDENT_REQUIRED_CORROBORATION:
    "non_independent_required_corroboration",
  CANONICALIZATION_FAILURE: "canonicalization_failure",
  PACKAGE_IDENTITY_MISMATCH: "package_identity_mismatch",
} as const;

const sha256Schema = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const timestampSchema = z.iso.datetime();

export const rightsSnapshotSchema = z.object({
  snapshotId: z.string().min(1),
  snapshotHash: sha256Schema,
  status: z.enum(RIGHTS_STATUS),
  capturedAt: timestampSchema,
  allowedUse: z.enum(RIGHTS_ALLOWED_USE),
});

export const provenanceSnapshotSchema = z.object({
  snapshotId: z.string().min(1),
  snapshotHash: sha256Schema,
  status: z.enum(PROVENANCE_STATUS),
  capturedAt: timestampSchema,
});

export const evidenceDocumentSnapshotSchema = z.object({
  documentId: z.string().min(1),
  sourceId: z.string().min(1),
  tier: z.enum(EVIDENCE_TIER),
  originGroup: z.string().min(1),
  originNodeId: z.string().min(1),
  sourceFingerprint: sha256Schema,
  documentFingerprint: sha256Schema,
  rightsSnapshot: rightsSnapshotSchema,
  provenanceSnapshot: provenanceSnapshotSchema,
  inRemit: z.boolean(),
  current: z.boolean(),
  materiallyContradicted: z.boolean(),
});

export const originNodeSchema = z.object({
  originId: z.string().min(1),
  fingerprint: sha256Schema,
});

export const originEdgeSchema = z.object({
  fromOriginId: z.string().min(1),
  derivesFromOriginId: z.string().min(1),
});

export const originGraphSchema = z.object({
  nodes: z.array(originNodeSchema),
  edges: z.array(originEdgeSchema),
});

export const atomicClaimSchema = z.object({
  claimId: z.string().min(1),
  text: z.string().min(1),
});

export const packagedAtomicClaimSchema = atomicClaimSchema.extend({
  claimFingerprint: sha256Schema,
});

export const claimEvidenceLinkSchema = z.object({
  claimId: z.string().min(1),
  documentId: z.string().min(1),
  evidenceFragmentFingerprint: sha256Schema,
  locator: z.string().min(1),
});

export const evidencePackageAssemblyInputSchema = z.object({
  schemaVersion: z.literal(EVIDENCE_PACKAGE_SCHEMA_VERSION.V1),
  admission: z.object({
    input: evidenceAdmissionInputSchema,
    suppliedDecision: evidenceAdmissionDecisionSchema,
    decidedAt: timestampSchema,
  }),
  assembledAt: timestampSchema,
  documents: z.array(evidenceDocumentSnapshotSchema),
  originGraph: originGraphSchema,
  claims: z.array(atomicClaimSchema),
  claimEvidenceLinks: z.array(claimEvidenceLinkSchema),
});

export const evidencePackageSchema = z.object({
  schemaVersion: z.literal(EVIDENCE_PACKAGE_SCHEMA_VERSION.V1),
  packageId: sha256Schema,
  storyId: z.string().min(1),
  topic: z.enum(TOPIC),
  policyVersion: z.literal("phase1-v1"),
  decidedAt: timestampSchema,
  assembledAt: timestampSchema,
  admissionInputFingerprint: sha256Schema,
  admissionDecisionFingerprint: sha256Schema,
  admissionDecision: evidenceAdmissionDecisionSchema.extend({
    outcome: z.literal(ADMISSION_OUTCOME.ELIGIBLE),
  }),
  documents: z.array(evidenceDocumentSnapshotSchema),
  originGraph: originGraphSchema,
  claims: z.array(packagedAtomicClaimSchema),
  claimEvidenceLinks: z.array(claimEvidenceLinkSchema),
});

export const evidencePackageAssemblyFailureSchema = z.object({
  status: z.literal("error"),
  reasonCode: z.enum(EVIDENCE_PACKAGE_ASSEMBLY_REASON),
});

export const evidencePackageAssemblyResultSchema = z.discriminatedUnion(
  "status",
  [
    z.object({ status: z.literal("ok"), package: evidencePackageSchema }),
    evidencePackageAssemblyFailureSchema,
  ],
);

export const evidencePackageSerializationResultSchema = z.discriminatedUnion(
  "status",
  [
    z.object({ status: z.literal("ok"), bytes: z.string() }),
    evidencePackageAssemblyFailureSchema,
  ],
);

export type RightsSnapshot = z.infer<typeof rightsSnapshotSchema>;
export type ProvenanceSnapshot = z.infer<typeof provenanceSnapshotSchema>;
export type EvidenceDocumentSnapshot = z.infer<
  typeof evidenceDocumentSnapshotSchema
>;
export type OriginNode = z.infer<typeof originNodeSchema>;
export type OriginEdge = z.infer<typeof originEdgeSchema>;
export type OriginGraph = z.infer<typeof originGraphSchema>;
export type AtomicClaim = z.infer<typeof atomicClaimSchema>;
export type PackagedAtomicClaim = z.infer<typeof packagedAtomicClaimSchema>;
export type ClaimEvidenceLink = z.infer<typeof claimEvidenceLinkSchema>;
export type EvidencePackageAssemblyInput = z.infer<
  typeof evidencePackageAssemblyInputSchema
>;
export type EvidencePackage = z.infer<typeof evidencePackageSchema>;
export type EvidencePackageAssemblyResult = z.infer<
  typeof evidencePackageAssemblyResultSchema
>;
export type EvidencePackageSerializationResult = z.infer<
  typeof evidencePackageSerializationResultSchema
>;
export type EvidencePackageAssemblyReason =
  (typeof EVIDENCE_PACKAGE_ASSEMBLY_REASON)[keyof typeof EVIDENCE_PACKAGE_ASSEMBLY_REASON];
