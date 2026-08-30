import { describe, expect, it } from "vitest";

import {
  SCRIPT_CANDIDATE_SCHEMA_VERSION,
  SCRIPT_DISCLOSURE,
  SCRIPT_GENERATION_POLICY_VERSION,
  SCRIPT_GENERATION_REQUEST_SCHEMA_VERSION,
  SCRIPT_LANGUAGE,
  SCRIPT_SENTENCE_KIND,
  type ScriptCandidate,
  type ScriptGenerationRequest,
} from "@novaris/shared-contracts";

import { validateWholeScript } from "./index.js";

const HASH_A = `sha256:${"a".repeat(64)}` as const;
const HASH_B = `sha256:${"b".repeat(64)}` as const;
const HASH_C = `sha256:${"c".repeat(64)}` as const;
const HASH_D = `sha256:${"d".repeat(64)}` as const;

const linkOne = {
  claimId: "claim-1",
  documentId: "doc-1",
  evidenceFragmentFingerprint: HASH_B,
  locator: "paragraph:1",
};
const linkTwo = {
  claimId: "claim-2",
  documentId: "doc-2",
  evidenceFragmentFingerprint: HASH_D,
  locator: "paragraph:2",
};

const request: ScriptGenerationRequest = {
  schemaVersion: SCRIPT_GENERATION_REQUEST_SCHEMA_VERSION.V1,
  packageId: HASH_A,
  auditEventHash: HASH_B,
  streamId: "story:script-story",
  eventSequence: "1",
  storyId: "script-story",
  topic: "technology_science",
  evidencePolicyVersion: "phase1-v1",
  generationPolicyVersion: SCRIPT_GENERATION_POLICY_VERSION.V1,
  generatedAt: "2026-08-29T15:00:00.000Z",
  language: SCRIPT_LANGUAGE.SPANISH,
  disclosure: SCRIPT_DISCLOSURE.V1,
  contextFingerprint: HASH_C,
  claims: [
    {
      claimId: "claim-1",
      text: "La autoridad publicó una actualización.",
      claimFingerprint: HASH_A,
      evidenceLinks: [linkOne],
    },
    {
      claimId: "claim-2",
      text: "La actualización entró en vigor hoy.",
      claimFingerprint: HASH_C,
      evidenceLinks: [linkTwo],
    },
  ],
};

function candidate(): ScriptCandidate {
  return {
    schemaVersion: SCRIPT_CANDIDATE_SCHEMA_VERSION.V1,
    contextFingerprint: HASH_C,
    sentences: [
      {
        sentenceId: "sentence-0",
        position: 0,
        kind: SCRIPT_SENTENCE_KIND.DISCLOSURE,
        text: SCRIPT_DISCLOSURE.V1,
      },
      {
        sentenceId: "sentence-1",
        position: 1,
        kind: SCRIPT_SENTENCE_KIND.MATERIAL,
        text: request.claims[0]!.text,
        claimId: "claim-1",
        claimFingerprint: HASH_A,
        evidenceLinks: [linkOne],
      },
    ],
    transcript: `${SCRIPT_DISCLOSURE.V1} ${request.claims[0]!.text}`,
  };
}

function reason(output: unknown): string | undefined {
  const result = validateWholeScript(request, output);
  return result.status === "error" ? result.reasonCode : undefined;
}

describe("whole-script claim validation", () => {
  it("CV01 accepts exact supported material and creates a frozen identity", () => {
    const result = validateWholeScript(request, candidate());
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.script.scriptId).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(Object.isFrozen(result.script)).toBe(true);
    expect(Object.isFrozen(result.script.sentences)).toBe(true);
  });

  it("CV02 rejects a missing disclosure", () => {
    const output = candidate();
    output.sentences = [output.sentences[1]!];
    output.sentences[0]!.position = 0;
    output.sentences[0]!.sentenceId = "sentence-0";
    output.transcript = output.sentences[0]!.text;
    expect(reason(output)).toBe("missing_disclosure");

    const altered = candidate();
    altered.sentences[0]!.text = "Divulgación diferente.";
    altered.transcript = altered.sentences.map(({ text }) => text).join(" ");
    expect(reason(altered)).toBe("invalid_disclosure");
  });

  it("CV03 rejects disclosure outside sentence zero", () => {
    const output = candidate();
    output.sentences.reverse();
    output.sentences.forEach((sentence, position) => {
      sentence.position = position;
      sentence.sentenceId = `sentence-${position}`;
    });
    output.transcript = output.sentences.map(({ text }) => text).join(" ");
    expect(reason(output)).toBe("disclosure_not_first");
  });

  it("CV04 rejects an unknown claim", () => {
    const output = candidate();
    const material = output.sentences[1]!;
    if (material.kind !== "material") throw new Error("fixture invariant");
    material.claimId = "claim-unknown";
    expect(reason(output)).toBe("unknown_claim_reference");
  });

  it("CV05 rejects an unknown evidence reference", () => {
    const output = candidate();
    const material = output.sentences[1]!;
    if (material.kind !== "material") throw new Error("fixture invariant");
    material.evidenceLinks[0] = {
      ...material.evidenceLinks[0]!,
      evidenceFragmentFingerprint: HASH_D,
    };
    expect(reason(output)).toBe("unknown_evidence_reference");
  });

  it("CV06 rejects evidence owned by a different claim", () => {
    const output = candidate();
    const material = output.sentences[1]!;
    if (material.kind !== "material") throw new Error("fixture invariant");
    material.evidenceLinks = [linkTwo];
    expect(reason(output)).toBe("evidence_claim_mismatch");

    const duplicate = candidate();
    const duplicateMaterial = duplicate.sentences[1]!;
    if (duplicateMaterial.kind !== "material")
      throw new Error("fixture invariant");
    duplicateMaterial.evidenceLinks = [linkOne, linkOne];
    expect(reason(duplicate)).toBe("duplicate_evidence_reference");
  });

  it("CV07 rejects paraphrase and unsupported causation", () => {
    const output = candidate();
    const material = output.sentences[1]!;
    if (material.kind !== "material") throw new Error("fixture invariant");
    material.text = `${material.text} Esto causó un cambio económico.`;
    output.transcript = output.sentences.map(({ text }) => text).join(" ");
    expect(reason(output)).toBe("claim_text_mismatch");
  });

  it("CV08 rejects the whole script when one sentence is invalid", () => {
    const output = candidate();
    output.sentences.push({
      sentenceId: "sentence-2",
      position: 2,
      kind: SCRIPT_SENTENCE_KIND.MATERIAL,
      text: "Texto no admitido.",
      claimId: "claim-2",
      claimFingerprint: HASH_C,
      evidenceLinks: [linkTwo],
    });
    output.transcript = output.sentences.map(({ text }) => text).join(" ");
    expect(validateWholeScript(request, output)).toEqual({
      status: "error",
      reasonCode: "claim_text_mismatch",
    });
  });

  it("CV09 rejects duplicate IDs and noncontiguous positions", () => {
    const duplicate = candidate();
    duplicate.sentences[1]!.sentenceId = "sentence-0";
    expect(reason(duplicate)).toBe("duplicate_sentence_id");

    const gap = candidate();
    gap.sentences[1]!.position = 2;
    gap.sentences[1]!.sentenceId = "sentence-2";
    expect(reason(gap)).toBe("invalid_sentence_order");
  });

  it("CV10 rejects transcript drift", () => {
    expect(reason({ ...candidate(), transcript: "Texto diferente." })).toBe(
      "transcript_mismatch",
    );
  });
});
