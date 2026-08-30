import { z } from "zod";

import { TOPIC } from "./admission.js";
import {
  AUDIT_VERIFICATION_REASON,
  auditSequenceSchema,
} from "./audit-lineage.js";

export const SCRIPT_LANGUAGE = { SPANISH: "es" } as const;
export const SCRIPT_GENERATION_POLICY_VERSION = {
  V1: "script-generation-v1",
} as const;
export const SCRIPT_GENERATION_REQUEST_SCHEMA_VERSION = {
  V1: "script-generation-request-v1",
} as const;
export const SCRIPT_CANDIDATE_SCHEMA_VERSION = {
  V1: "script-candidate-v1",
} as const;
export const VALIDATED_SCRIPT_SCHEMA_VERSION = {
  V1: "validated-script-v1",
} as const;
export const SCRIPT_SENTENCE_KIND = {
  DISCLOSURE: "disclosure",
  MATERIAL: "material",
} as const;
export const SCRIPT_DISCLOSURE = {
  V1: "Este boletín fue generado con inteligencia artificial.",
} as const;
const MAX_SCRIPT_CLAIMS = 50;
export const SCRIPT_LIMITS = {
  MAX_ID_LENGTH: 200,
  MAX_CLAIM_TEXT_LENGTH: 1_000,
  MAX_LOCATOR_LENGTH: 500,
  MAX_EVIDENCE_LINKS_PER_CLAIM: 20,
  MAX_CLAIMS: MAX_SCRIPT_CLAIMS,
  MAX_SENTENCES: MAX_SCRIPT_CLAIMS + 1,
  MAX_TRANSCRIPT_LENGTH: 10_000,
} as const;

export const SCRIPT_VALIDATION_REASON = {
  INVALID_REQUEST_CONTEXT: "invalid_request_context",
  INVALID_CANDIDATE_OUTPUT: "invalid_candidate_output",
  MISSING_DISCLOSURE: "missing_disclosure",
  DISCLOSURE_NOT_FIRST: "disclosure_not_first",
  INVALID_DISCLOSURE: "invalid_disclosure",
  MISSING_MATERIAL_SENTENCE: "missing_material_sentence",
  DUPLICATE_SENTENCE_ID: "duplicate_sentence_id",
  INVALID_SENTENCE_ORDER: "invalid_sentence_order",
  UNKNOWN_CLAIM_REFERENCE: "unknown_claim_reference",
  UNKNOWN_EVIDENCE_REFERENCE: "unknown_evidence_reference",
  DUPLICATE_EVIDENCE_REFERENCE: "duplicate_evidence_reference",
  EVIDENCE_CLAIM_MISMATCH: "evidence_claim_mismatch",
  CLAIM_TEXT_MISMATCH: "claim_text_mismatch",
  CLAIM_FINGERPRINT_MISMATCH: "claim_fingerprint_mismatch",
  CONTEXT_MISMATCH: "context_mismatch",
  TRANSCRIPT_MISMATCH: "transcript_mismatch",
} as const;

export const SCRIPT_GENERATION_REASON = {
  INVALID_REQUEST: "invalid_request",
  AUDIT_RECONSTRUCTION_FAILED: "audit_reconstruction_failed",
  GENERATOR_FAILURE: "generator_failure",
  REQUEST_TRANSCRIPT_LIMIT_EXCEEDED: "request_transcript_limit_exceeded",
  SCRIPT_VALIDATION_FAILED: "script_validation_failed",
} as const;

const boundedIdSchema = z.string().min(1).max(SCRIPT_LIMITS.MAX_ID_LENGTH);
const sha256Schema = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const timestampSchema = z.iso.datetime();

export const generateVerifiedScriptInputSchema = z
  .object({
    streamId: boundedIdSchema,
    sequence: auditSequenceSchema,
    expectedHeadHash: sha256Schema,
    generatedAt: timestampSchema,
    language: z.literal(SCRIPT_LANGUAGE.SPANISH),
    generationPolicyVersion: z.literal(SCRIPT_GENERATION_POLICY_VERSION.V1),
  })
  .strict();

export const scriptEvidenceReferenceSchema = z
  .object({
    claimId: boundedIdSchema,
    documentId: boundedIdSchema,
    evidenceFragmentFingerprint: sha256Schema,
    locator: z.string().min(1).max(SCRIPT_LIMITS.MAX_LOCATOR_LENGTH),
  })
  .strict();

export const scriptGenerationClaimSchema = z
  .object({
    claimId: boundedIdSchema,
    text: z.string().min(1).max(SCRIPT_LIMITS.MAX_CLAIM_TEXT_LENGTH),
    claimFingerprint: sha256Schema,
    evidenceLinks: z
      .array(scriptEvidenceReferenceSchema)
      .min(1)
      .max(SCRIPT_LIMITS.MAX_EVIDENCE_LINKS_PER_CLAIM),
  })
  .strict();

export const scriptGenerationRequestSchema = z
  .object({
    schemaVersion: z.literal(SCRIPT_GENERATION_REQUEST_SCHEMA_VERSION.V1),
    packageId: sha256Schema,
    auditEventHash: sha256Schema,
    streamId: boundedIdSchema,
    eventSequence: auditSequenceSchema,
    storyId: boundedIdSchema,
    topic: z.enum(TOPIC),
    evidencePolicyVersion: z.literal("phase1-v1"),
    generationPolicyVersion: z.literal(SCRIPT_GENERATION_POLICY_VERSION.V1),
    generatedAt: timestampSchema,
    language: z.literal(SCRIPT_LANGUAGE.SPANISH),
    disclosure: z.literal(SCRIPT_DISCLOSURE.V1),
    contextFingerprint: sha256Schema,
    claims: z
      .array(scriptGenerationClaimSchema)
      .min(1)
      .max(SCRIPT_LIMITS.MAX_CLAIMS),
  })
  .strict()
  .refine(
    ({ claims }) =>
      calculateScriptTranscriptLength(claims) <=
      SCRIPT_LIMITS.MAX_TRANSCRIPT_LENGTH,
    { error: "Derived transcript exceeds the configured limit" },
  );

export const disclosureSentenceSchema = z
  .object({
    sentenceId: boundedIdSchema,
    position: z
      .number()
      .int()
      .nonnegative()
      .max(SCRIPT_LIMITS.MAX_SENTENCES - 1),
    kind: z.literal(SCRIPT_SENTENCE_KIND.DISCLOSURE),
    text: z.string().min(1).max(200),
  })
  .strict();

export const materialSentenceSchema = z
  .object({
    sentenceId: boundedIdSchema,
    position: z
      .number()
      .int()
      .nonnegative()
      .max(SCRIPT_LIMITS.MAX_SENTENCES - 1),
    kind: z.literal(SCRIPT_SENTENCE_KIND.MATERIAL),
    text: z.string().min(1).max(SCRIPT_LIMITS.MAX_CLAIM_TEXT_LENGTH),
    claimId: boundedIdSchema,
    claimFingerprint: sha256Schema,
    evidenceLinks: z
      .array(scriptEvidenceReferenceSchema)
      .min(1)
      .max(SCRIPT_LIMITS.MAX_EVIDENCE_LINKS_PER_CLAIM),
  })
  .strict();

export const scriptSentenceSchema = z.discriminatedUnion("kind", [
  disclosureSentenceSchema,
  materialSentenceSchema,
]);

export const scriptCandidateSchema = z
  .object({
    schemaVersion: z.literal(SCRIPT_CANDIDATE_SCHEMA_VERSION.V1),
    contextFingerprint: sha256Schema,
    sentences: z
      .array(scriptSentenceSchema)
      .min(1)
      .max(SCRIPT_LIMITS.MAX_SENTENCES),
    transcript: z.string().min(1).max(SCRIPT_LIMITS.MAX_TRANSCRIPT_LENGTH),
  })
  .strict();

export const validatedScriptVersionSchema = z
  .object({
    schemaVersion: z.literal(VALIDATED_SCRIPT_SCHEMA_VERSION.V1),
    scriptId: sha256Schema,
    packageId: sha256Schema,
    auditEventHash: sha256Schema,
    streamId: boundedIdSchema,
    eventSequence: auditSequenceSchema,
    storyId: boundedIdSchema,
    topic: z.enum(TOPIC),
    evidencePolicyVersion: z.literal("phase1-v1"),
    generationPolicyVersion: z.literal(SCRIPT_GENERATION_POLICY_VERSION.V1),
    generatedAt: timestampSchema,
    language: z.literal(SCRIPT_LANGUAGE.SPANISH),
    contextFingerprint: sha256Schema,
    sentences: z
      .array(scriptSentenceSchema)
      .min(2)
      .max(SCRIPT_LIMITS.MAX_SENTENCES),
    transcript: z.string().min(1).max(SCRIPT_LIMITS.MAX_TRANSCRIPT_LENGTH),
  })
  .strict();

export const scriptValidationFailureSchema = z
  .object({
    status: z.literal("error"),
    reasonCode: z.enum(SCRIPT_VALIDATION_REASON),
  })
  .strict();

export const scriptValidationResultSchema = z.discriminatedUnion("status", [
  z
    .object({
      status: z.literal("ok"),
      script: validatedScriptVersionSchema,
    })
    .strict(),
  scriptValidationFailureSchema,
]);

export const generateVerifiedScriptResultSchema = z.union([
  z
    .object({
      status: z.literal("ok"),
      script: validatedScriptVersionSchema,
    })
    .strict(),
  z
    .object({
      status: z.literal("error"),
      reasonCode: z.literal(SCRIPT_GENERATION_REASON.INVALID_REQUEST),
    })
    .strict(),
  z
    .object({
      status: z.literal("error"),
      reasonCode: z.literal(
        SCRIPT_GENERATION_REASON.AUDIT_RECONSTRUCTION_FAILED,
      ),
      detailCode: z.enum(AUDIT_VERIFICATION_REASON),
    })
    .strict(),
  z
    .object({
      status: z.literal("error"),
      reasonCode: z.literal(SCRIPT_GENERATION_REASON.GENERATOR_FAILURE),
    })
    .strict(),
  z
    .object({
      status: z.literal("error"),
      reasonCode: z.literal(
        SCRIPT_GENERATION_REASON.REQUEST_TRANSCRIPT_LIMIT_EXCEEDED,
      ),
    })
    .strict(),
  z
    .object({
      status: z.literal("error"),
      reasonCode: z.literal(SCRIPT_GENERATION_REASON.SCRIPT_VALIDATION_FAILED),
      detailCode: z.enum(SCRIPT_VALIDATION_REASON),
    })
    .strict(),
]);

export type GenerateVerifiedScriptInput = z.infer<
  typeof generateVerifiedScriptInputSchema
>;
export type ScriptEvidenceReference = z.infer<
  typeof scriptEvidenceReferenceSchema
>;
export type ScriptGenerationClaim = z.infer<typeof scriptGenerationClaimSchema>;
export type ScriptGenerationRequest = z.infer<
  typeof scriptGenerationRequestSchema
>;
export type ScriptCandidate = z.infer<typeof scriptCandidateSchema>;
export type ScriptSentence = z.infer<typeof scriptSentenceSchema>;
export type ValidatedScriptVersion = z.infer<
  typeof validatedScriptVersionSchema
>;
export type ScriptValidationReason =
  (typeof SCRIPT_VALIDATION_REASON)[keyof typeof SCRIPT_VALIDATION_REASON];
export type ScriptValidationResult = z.infer<
  typeof scriptValidationResultSchema
>;
export type GenerateVerifiedScriptResult = z.infer<
  typeof generateVerifiedScriptResultSchema
>;

export function calculateScriptTranscriptLength(
  claims: readonly { text: string }[],
): number {
  return claims.reduce(
    (length, claim) => length + 1 + claim.text.length,
    SCRIPT_DISCLOSURE.V1.length,
  );
}
