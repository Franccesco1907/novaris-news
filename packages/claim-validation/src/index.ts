import { createHash } from "node:crypto";

import {
  SCRIPT_DISCLOSURE,
  SCRIPT_SENTENCE_KIND,
  SCRIPT_VALIDATION_REASON,
  VALIDATED_SCRIPT_SCHEMA_VERSION,
  scriptCandidateSchema,
  scriptGenerationRequestSchema,
  validatedScriptVersionSchema,
  type ScriptEvidenceReference,
  type ScriptGenerationRequest,
  type ScriptSentence,
  type ScriptValidationReason,
  type ScriptValidationResult,
} from "@novaris/shared-contracts";

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

function failure(reasonCode: ScriptValidationReason): ScriptValidationResult {
  return { status: "error", reasonCode };
}

function evidenceKey(link: ScriptEvidenceReference): string {
  return canonicalJson(link);
}

function validateSentenceEvidence(
  request: ScriptGenerationRequest,
  sentence: Extract<ScriptSentence, { kind: "material" }>,
): ScriptValidationReason | undefined {
  const claim = request.claims.find(
    (candidate) => candidate.claimId === sentence.claimId,
  );
  if (claim === undefined)
    return SCRIPT_VALIDATION_REASON.UNKNOWN_CLAIM_REFERENCE;
  if (sentence.claimFingerprint !== claim.claimFingerprint)
    return SCRIPT_VALIDATION_REASON.CLAIM_FINGERPRINT_MISMATCH;
  if (sentence.text !== claim.text)
    return SCRIPT_VALIDATION_REASON.CLAIM_TEXT_MISMATCH;

  const globalEvidence = new Set(
    request.claims.flatMap(({ evidenceLinks }) =>
      evidenceLinks.map(evidenceKey),
    ),
  );
  const claimEvidence = new Set(claim.evidenceLinks.map(evidenceKey));
  const sentenceEvidence = new Set<string>();
  for (const link of sentence.evidenceLinks) {
    const key = evidenceKey(link);
    if (sentenceEvidence.has(key))
      return SCRIPT_VALIDATION_REASON.DUPLICATE_EVIDENCE_REFERENCE;
    sentenceEvidence.add(key);
    if (!globalEvidence.has(key))
      return SCRIPT_VALIDATION_REASON.UNKNOWN_EVIDENCE_REFERENCE;
    if (link.claimId !== sentence.claimId || !claimEvidence.has(key))
      return SCRIPT_VALIDATION_REASON.EVIDENCE_CLAIM_MISMATCH;
  }
  return undefined;
}

export function validateWholeScript(
  requestInput: unknown,
  candidateInput: unknown,
): ScriptValidationResult {
  const requestResult = scriptGenerationRequestSchema.safeParse(requestInput);
  if (!requestResult.success)
    return failure(SCRIPT_VALIDATION_REASON.INVALID_REQUEST_CONTEXT);
  const candidateResult = scriptCandidateSchema.safeParse(candidateInput);
  if (!candidateResult.success)
    return failure(SCRIPT_VALIDATION_REASON.INVALID_CANDIDATE_OUTPUT);

  const request = requestResult.data;
  const candidate = candidateResult.data;
  if (candidate.contextFingerprint !== request.contextFingerprint)
    return failure(SCRIPT_VALIDATION_REASON.CONTEXT_MISMATCH);

  const disclosures = candidate.sentences.filter(
    ({ kind }) => kind === SCRIPT_SENTENCE_KIND.DISCLOSURE,
  );
  if (disclosures.length === 0)
    return failure(SCRIPT_VALIDATION_REASON.MISSING_DISCLOSURE);
  if (candidate.sentences[0]?.kind !== SCRIPT_SENTENCE_KIND.DISCLOSURE)
    return failure(SCRIPT_VALIDATION_REASON.DISCLOSURE_NOT_FIRST);
  if (
    disclosures.length !== 1 ||
    disclosures[0]?.text !== SCRIPT_DISCLOSURE.V1
  ) {
    return failure(SCRIPT_VALIDATION_REASON.INVALID_DISCLOSURE);
  }

  const materialSentences = candidate.sentences.filter(
    (sentence): sentence is Extract<ScriptSentence, { kind: "material" }> =>
      sentence.kind === SCRIPT_SENTENCE_KIND.MATERIAL,
  );
  if (materialSentences.length === 0)
    return failure(SCRIPT_VALIDATION_REASON.MISSING_MATERIAL_SENTENCE);

  const sentenceIds = new Set(
    candidate.sentences.map(({ sentenceId }) => sentenceId),
  );
  if (sentenceIds.size !== candidate.sentences.length)
    return failure(SCRIPT_VALIDATION_REASON.DUPLICATE_SENTENCE_ID);
  if (
    candidate.sentences.some(
      (sentence, index) =>
        sentence.position !== index ||
        sentence.sentenceId !== `sentence-${index}`,
    )
  ) {
    return failure(SCRIPT_VALIDATION_REASON.INVALID_SENTENCE_ORDER);
  }

  for (const sentence of materialSentences) {
    const reasonCode = validateSentenceEvidence(request, sentence);
    if (reasonCode !== undefined) return failure(reasonCode);
  }

  const transcript = candidate.sentences.map(({ text }) => text).join(" ");
  if (candidate.transcript !== transcript)
    return failure(SCRIPT_VALIDATION_REASON.TRANSCRIPT_MISMATCH);

  const identityMaterial = {
    schemaVersion: VALIDATED_SCRIPT_SCHEMA_VERSION.V1,
    packageId: request.packageId,
    auditEventHash: request.auditEventHash,
    streamId: request.streamId,
    eventSequence: request.eventSequence,
    storyId: request.storyId,
    topic: request.topic,
    evidencePolicyVersion: request.evidencePolicyVersion,
    generationPolicyVersion: request.generationPolicyVersion,
    generatedAt: request.generatedAt,
    language: request.language,
    contextFingerprint: request.contextFingerprint,
    sentences: candidate.sentences,
    transcript,
  };
  const scriptResult = validatedScriptVersionSchema.safeParse({
    ...identityMaterial,
    scriptId: sha256(identityMaterial),
  });
  if (!scriptResult.success)
    return failure(SCRIPT_VALIDATION_REASON.INVALID_CANDIDATE_OUTPUT);
  return { status: "ok", script: deepFreeze(scriptResult.data) };
}
