import { describe, expect, it, vi } from "vitest";

import {
  materializeAuditEvent,
  prepareEvidencePackageAuditAppend,
  type EvidencePackageAuditStore,
} from "@novaris/audit-lineage";
import { assembleEvidencePackage } from "@novaris/evidence-pipeline";
import {
  AUDIT_GENESIS_HASH,
  SCRIPT_CANDIDATE_SCHEMA_VERSION,
  SCRIPT_DISCLOSURE,
  SCRIPT_GENERATION_POLICY_VERSION,
  SCRIPT_LANGUAGE,
  SCRIPT_SENTENCE_KIND,
  type AuditAppendResult,
  type AuditEvent,
  type EvidencePackageArtifact,
  type PreparedAuditAppend,
  type ScriptGenerationRequest,
  type StoredArtifactResult,
  type StoredAuditStreamResult,
} from "@novaris/shared-contracts";

import {
  DeterministicScriptGenerator,
  generateVerifiedScript,
  type ScriptGeneratorPort,
} from "./index.js";

const HASH_A = `sha256:${"a".repeat(64)}` as const;
const HASH_B = `sha256:${"b".repeat(64)}` as const;
const HASH_C = `sha256:${"c".repeat(64)}` as const;
const HASH_D = `sha256:${"d".repeat(64)}` as const;
const NOW = "2026-08-29T15:00:00.000Z";

class MemoryAuditStore implements EvidencePackageAuditStore {
  events: AuditEvent[] = [];
  artifacts = new Map<string, EvidencePackageArtifact>();

  async append(command: PreparedAuditAppend): Promise<AuditAppendResult> {
    const event = materializeAuditEvent(command, "1", AUDIT_GENESIS_HASH);
    this.events = [event];
    this.artifacts.set(command.artifact.artifactId, command.artifact);
    return { status: "ok", event, artifact: command.artifact, replayed: false };
  }

  async readStream(): Promise<StoredAuditStreamResult> {
    return { status: "ok", events: structuredClone(this.events) };
  }

  async readArtifact(artifactId: string): Promise<StoredArtifactResult> {
    const artifact = this.artifacts.get(artifactId);
    return artifact === undefined
      ? { status: "not_found" }
      : { status: "ok", artifact: structuredClone(artifact) };
  }
}

function makePackage(
  claimCount = 1,
  claimText: (index: number) => string = () =>
    "La autoridad publicó una actualización.",
) {
  const decision = {
    outcome: "eligible" as const,
    reasonCodes: ["eligible_evidence" as const],
    independentOriginCount: 1,
  };
  const result = assembleEvidencePackage(
    {
      schemaVersion: "evidence-package-v1",
      admission: {
        input: {
          storyId: "script-story",
          policyVersion: "phase1-v1",
          topic: "technology_science",
          policyServiceAvailable: true,
          provenanceStoreAvailable: true,
          containsDiscoveryContent: false,
          financialRecommendation: "none",
          excludedCategory: "none",
          evidence: [
            {
              documentId: "doc-1",
              tier: "E1",
              originGroup: "origin-1",
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
          documentId: "doc-1",
          sourceId: "source-1",
          tier: "E1",
          originGroup: "origin-1",
          originNodeId: "origin-1",
          sourceFingerprint: HASH_A,
          documentFingerprint: HASH_B,
          rightsSnapshot: {
            snapshotId: "rights-1",
            snapshotHash: HASH_C,
            status: "approved",
            capturedAt: NOW,
            allowedUse: "publication_summary",
          },
          provenanceSnapshot: {
            snapshotId: "provenance-1",
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
        nodes: [{ originId: "origin-1", fingerprint: HASH_A }],
        edges: [],
      },
      claims: Array.from({ length: claimCount }, (_, index) => ({
        claimId: `claim-${index + 1}`,
        text: claimText(index),
      })),
      claimEvidenceLinks: Array.from({ length: claimCount }, (_, index) => ({
        claimId: `claim-${index + 1}`,
        documentId: "doc-1",
        evidenceFragmentFingerprint: HASH_B,
        locator: `paragraph:${index + 1}`,
      })),
    },
    { evaluate: () => decision },
  );
  if (result.status !== "ok") throw new Error(result.reasonCode);
  return result.package;
}

async function auditedFixture(
  claimCount = 1,
  claimText?: (index: number) => string,
) {
  const store = new MemoryAuditStore();
  const prepared = prepareEvidencePackageAuditAppend({
    package: makePackage(claimCount, claimText),
    idempotencyKey: "script-test",
    occurredAt: NOW,
    expectedPreviousEventHash: AUDIT_GENESIS_HASH,
  });
  if (prepared.status !== "ok") throw new Error(prepared.reasonCode);
  const receipt = await store.append(prepared.command);
  if (receipt.status !== "ok") throw new Error(receipt.reasonCode);
  return { store, event: receipt.event };
}

function input(event: AuditEvent) {
  return {
    streamId: event.streamId,
    sequence: event.sequence,
    expectedHeadHash: event.eventHash,
    generatedAt: NOW,
    language: SCRIPT_LANGUAGE.SPANISH,
    generationPolicyVersion: SCRIPT_GENERATION_POLICY_VERSION.V1,
  } as const;
}

function validCandidate(request: ScriptGenerationRequest): unknown {
  const material = request.claims[0]!;
  const sentences = [
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
      text: material.text,
      claimId: material.claimId,
      claimFingerprint: material.claimFingerprint,
      evidenceLinks: material.evidenceLinks,
    },
  ];
  return {
    schemaVersion: SCRIPT_CANDIDATE_SCHEMA_VERSION.V1,
    contextFingerprint: request.contextFingerprint,
    sentences,
    transcript: sentences.map(({ text }) => text).join(" "),
  };
}

describe("verified script generation", () => {
  it("SG01 reconstructs verified evidence before producing a frozen script", async () => {
    const { store, event } = await auditedFixture();
    const result = await generateVerifiedScript(input(event), {
      auditStore: store,
      generator: new DeterministicScriptGenerator(),
    });
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.script.transcript).toContain(SCRIPT_DISCLOSURE.V1);
    expect(Object.isFrozen(result.script)).toBe(true);
  });

  it("SG02 rejects a raw-package public input path", async () => {
    const { store, event } = await auditedFixture();
    const generator = { generate: vi.fn() };
    const result = await generateVerifiedScript(
      { ...input(event), package: makePackage() },
      { auditStore: store, generator },
    );
    expect(result).toEqual({ status: "error", reasonCode: "invalid_request" });
    expect(generator.generate).not.toHaveBeenCalled();
  });

  it("SG03 prevents generator invocation after audit failure", async () => {
    const { store, event } = await auditedFixture();
    const generator = { generate: vi.fn() };
    const result = await generateVerifiedScript(
      { ...input(event), expectedHeadHash: HASH_A },
      { auditStore: store, generator },
    );
    expect(result).toEqual({
      status: "error",
      reasonCode: "audit_reconstruction_failed",
      detailCode: "tail_truncation",
    });
    expect(generator.generate).not.toHaveBeenCalled();
  });

  it("SG04 sends only bounded evidence context to the generator", async () => {
    const { store, event } = await auditedFixture();
    let captured: ScriptGenerationRequest | undefined;
    const generator: ScriptGeneratorPort = {
      generate: async (request) => {
        captured = structuredClone(request);
        return validCandidate(request);
      },
    };
    expect(
      (
        await generateVerifiedScript(input(event), {
          auditStore: store,
          generator,
        })
      ).status,
    ).toBe("ok");
    expect(Object.keys(captured ?? {}).sort()).toEqual(
      [
        "auditEventHash",
        "claims",
        "contextFingerprint",
        "disclosure",
        "eventSequence",
        "evidencePolicyVersion",
        "generatedAt",
        "generationPolicyVersion",
        "language",
        "packageId",
        "schemaVersion",
        "storyId",
        "streamId",
        "topic",
      ].sort(),
    );
    expect(JSON.stringify(captured)).not.toContain("documents");
    expect(JSON.stringify(captured)).not.toContain("sourceId");
  });

  it("SG05 rejects malformed, oversized, and extra provider fields", async () => {
    const { store, event } = await auditedFixture();
    const outputs: unknown[] = [
      null,
      {
        schemaVersion: SCRIPT_CANDIDATE_SCHEMA_VERSION.V1,
        contextFingerprint: HASH_A,
        sentences: [],
        transcript: "x",
        extra: true,
      },
      {
        schemaVersion: SCRIPT_CANDIDATE_SCHEMA_VERSION.V1,
        contextFingerprint: HASH_A,
        sentences: [
          {
            sentenceId: "sentence-0",
            position: 0,
            kind: SCRIPT_SENTENCE_KIND.DISCLOSURE,
            text: "x".repeat(201),
          },
        ],
        transcript: "x",
      },
    ];
    for (const output of outputs) {
      const result = await generateVerifiedScript(input(event), {
        auditStore: store,
        generator: { generate: async () => output },
      });
      expect(result).toEqual({
        status: "error",
        reasonCode: "script_validation_failed",
        detailCode: "invalid_candidate_output",
      });
    }
  });

  it("SG06 rejects provider context mismatch", async () => {
    const { store, event } = await auditedFixture();
    const result = await generateVerifiedScript(input(event), {
      auditStore: store,
      generator: {
        generate: async (request) => ({
          ...(validCandidate(request) as Record<string, unknown>),
          contextFingerprint: HASH_A,
        }),
      },
    });
    expect(result).toEqual({
      status: "error",
      reasonCode: "script_validation_failed",
      detailCode: "context_mismatch",
    });
  });

  it("SG07 produces deterministic output identity", async () => {
    const { store, event } = await auditedFixture();
    const dependencies = {
      auditStore: store,
      generator: new DeterministicScriptGenerator(),
    };
    const first = await generateVerifiedScript(input(event), dependencies);
    const second = await generateVerifiedScript(input(event), dependencies);
    expect(first).toEqual(second);
  });

  it("SG08 converts provider exceptions to a typed failure", async () => {
    const { store, event } = await auditedFixture();
    const result = await generateVerifiedScript(input(event), {
      auditStore: store,
      generator: {
        generate: async () => Promise.reject(new Error("provider failed")),
      },
    });
    expect(result).toEqual({
      status: "error",
      reasonCode: "generator_failure",
    });
  });

  it("SG09 supports the maximum claim count plus disclosure", async () => {
    const { store, event } = await auditedFixture(
      50,
      (index) => `Afirmación admitida ${index + 1}.`,
    );
    const result = await generateVerifiedScript(input(event), {
      auditStore: store,
      generator: new DeterministicScriptGenerator(),
    });
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.script.sentences).toHaveLength(51);
  });

  it("SG10 rejects infeasible aggregate transcript before generation", async () => {
    const { store, event } = await auditedFixture(11, () => "x".repeat(1_000));
    const generator = { generate: vi.fn() };
    const result = await generateVerifiedScript(input(event), {
      auditStore: store,
      generator,
    });
    expect(result).toEqual({
      status: "error",
      reasonCode: "request_transcript_limit_exceeded",
    });
    expect(generator.generate).not.toHaveBeenCalled();
  });
});
