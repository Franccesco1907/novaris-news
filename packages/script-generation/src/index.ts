import { createHash } from "node:crypto";

import {
  reconstructEvidencePackage,
  type EvidencePackageAuditStore,
} from "@novaris/audit-lineage";
import { validateWholeScript } from "@novaris/claim-validation";
import {
  SCRIPT_CANDIDATE_SCHEMA_VERSION,
  SCRIPT_DISCLOSURE,
  SCRIPT_GENERATION_REQUEST_SCHEMA_VERSION,
  SCRIPT_LIMITS,
  SCRIPT_SENTENCE_KIND,
  calculateScriptTranscriptLength,
  generateVerifiedScriptInputSchema,
  scriptGenerationRequestSchema,
  type GenerateVerifiedScriptResult,
  type ScriptGenerationRequest,
} from "@novaris/shared-contracts";

export interface ScriptGeneratorPort {
  generate(request: ScriptGenerationRequest): Promise<unknown>;
}

export interface GenerateVerifiedScriptDependencies {
  auditStore: EvidencePackageAuditStore;
  generator: ScriptGeneratorPort;
}

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

function sha256(value: unknown): string {
  return `sha256:${createHash("sha256").update(canonicalJson(value)).digest("hex")}`;
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value))
    return value;
  for (const nested of Object.values(value as Record<string, unknown>))
    deepFreeze(nested);
  return Object.freeze(value);
}

export async function generateVerifiedScript(
  input: unknown,
  dependencies: GenerateVerifiedScriptDependencies,
): Promise<GenerateVerifiedScriptResult> {
  const inputResult = generateVerifiedScriptInputSchema.safeParse(input);
  if (!inputResult.success)
    return { status: "error", reasonCode: "invalid_request" };
  const parsedInput = inputResult.data;
  const reconstruction = await reconstructEvidencePackage(
    parsedInput.streamId,
    parsedInput.sequence,
    parsedInput.expectedHeadHash,
    dependencies.auditStore,
  );
  if (reconstruction.status === "error") {
    return {
      status: "error",
      reasonCode: "audit_reconstruction_failed",
      detailCode: reconstruction.reasonCode,
    };
  }

  const evidencePackage = reconstruction.package;
  const claims = evidencePackage.claims.map((claim) => ({
    claimId: claim.claimId,
    text: claim.text,
    claimFingerprint: claim.claimFingerprint,
    evidenceLinks: evidencePackage.claimEvidenceLinks
      .filter(({ claimId }) => claimId === claim.claimId)
      .map((link) => ({ ...link })),
  }));
  const context = {
    packageId: evidencePackage.packageId,
    auditEventHash: reconstruction.event.eventHash,
    streamId: reconstruction.event.streamId,
    eventSequence: reconstruction.event.sequence,
    storyId: evidencePackage.storyId,
    topic: evidencePackage.topic,
    evidencePolicyVersion: evidencePackage.policyVersion,
    generationPolicyVersion: parsedInput.generationPolicyVersion,
    generatedAt: parsedInput.generatedAt,
    language: parsedInput.language,
    disclosure: SCRIPT_DISCLOSURE.V1,
    claims,
  };
  if (
    calculateScriptTranscriptLength(claims) >
    SCRIPT_LIMITS.MAX_TRANSCRIPT_LENGTH
  ) {
    return {
      status: "error",
      reasonCode: "request_transcript_limit_exceeded",
    };
  }
  const requestResult = scriptGenerationRequestSchema.safeParse({
    schemaVersion: SCRIPT_GENERATION_REQUEST_SCHEMA_VERSION.V1,
    ...context,
    contextFingerprint: sha256(context),
  });
  if (!requestResult.success)
    return { status: "error", reasonCode: "invalid_request" };
  const request = deepFreeze(requestResult.data);

  let candidate: unknown;
  try {
    candidate = await dependencies.generator.generate(request);
  } catch {
    return { status: "error", reasonCode: "generator_failure" };
  }
  const validation = validateWholeScript(request, candidate);
  if (validation.status === "error") {
    return {
      status: "error",
      reasonCode: "script_validation_failed",
      detailCode: validation.reasonCode,
    };
  }
  return { status: "ok", script: validation.script };
}

export class DeterministicScriptGenerator implements ScriptGeneratorPort {
  async generate(request: ScriptGenerationRequest): Promise<unknown> {
    const sentences = [
      {
        sentenceId: "sentence-0",
        position: 0,
        kind: SCRIPT_SENTENCE_KIND.DISCLOSURE,
        text: SCRIPT_DISCLOSURE.V1,
      },
      ...request.claims.map((claim, index) => ({
        sentenceId: `sentence-${index + 1}`,
        position: index + 1,
        kind: SCRIPT_SENTENCE_KIND.MATERIAL,
        text: claim.text,
        claimId: claim.claimId,
        claimFingerprint: claim.claimFingerprint,
        evidenceLinks: claim.evidenceLinks.map((link) => ({ ...link })),
      })),
    ];
    return deepFreeze({
      schemaVersion: SCRIPT_CANDIDATE_SCHEMA_VERSION.V1,
      contextFingerprint: request.contextFingerprint,
      sentences,
      transcript: sentences.map(({ text }) => text).join(" "),
    });
  }
}
