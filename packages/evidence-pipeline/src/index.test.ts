import { describe, expect, it } from "vitest";

import {
  ADMISSION_OUTCOME,
  ADMISSION_REASON,
  EVIDENCE_PACKAGE_ASSEMBLY_REASON,
  type EvidenceAdmissionDecision,
  type EvidencePackageAssemblyInput,
} from "@novaris/shared-contracts";

import {
  assembleEvidencePackage,
  serializeEvidencePackage,
  type EvidenceAdmissionEvaluator,
} from "./index.js";

const HASH_A = `sha256:${"a".repeat(64)}`;
const HASH_B = `sha256:${"b".repeat(64)}`;
const HASH_C = `sha256:${"c".repeat(64)}`;
const HASH_D = `sha256:${"d".repeat(64)}`;
const DECIDED_AT = "2026-08-28T12:00:00.000Z";
const ASSEMBLED_AT = "2026-08-28T12:01:00.000Z";

const eligibleDecision: EvidenceAdmissionDecision = {
  outcome: ADMISSION_OUTCOME.ELIGIBLE,
  reasonCodes: [ADMISSION_REASON.ELIGIBLE_EVIDENCE],
  independentOriginCount: 1,
};

function evaluatorReturning(
  decision: EvidenceAdmissionDecision,
): EvidenceAdmissionEvaluator {
  return { evaluate: () => structuredClone(decision) };
}

function validInput(): EvidencePackageAssemblyInput {
  return {
    schemaVersion: "evidence-package-v1",
    admission: {
      input: {
        storyId: "story-ep01",
        policyVersion: "phase1-v1",
        topic: "technology_science",
        policyServiceAvailable: true,
        provenanceStoreAvailable: true,
        containsDiscoveryContent: false,
        financialRecommendation: "none",
        excludedCategory: "none",
        evidence: [
          {
            documentId: "doc-authority",
            tier: "E1",
            originGroup: "origin-authority",
            rightsStatus: "approved",
            provenanceStatus: "complete",
            inRemit: true,
            current: true,
            materiallyContradicted: false,
          },
        ],
      },
      suppliedDecision: structuredClone(eligibleDecision),
      decidedAt: DECIDED_AT,
    },
    assembledAt: ASSEMBLED_AT,
    documents: [
      {
        documentId: "doc-authority",
        sourceId: "source-authority",
        tier: "E1",
        originGroup: "origin-authority",
        originNodeId: "origin-authority",
        sourceFingerprint: HASH_A,
        documentFingerprint: HASH_B,
        rightsSnapshot: {
          snapshotId: "rights-authority",
          snapshotHash: HASH_C,
          status: "approved",
          capturedAt: DECIDED_AT,
          allowedUse: "publication_summary",
        },
        provenanceSnapshot: {
          snapshotId: "provenance-authority",
          snapshotHash: HASH_D,
          status: "complete",
          capturedAt: DECIDED_AT,
        },
        inRemit: true,
        current: true,
        materiallyContradicted: false,
      },
    ],
    originGraph: {
      nodes: [{ originId: "origin-authority", fingerprint: HASH_A }],
      edges: [],
    },
    claims: [
      { claimId: "claim-1", text: "The authority published an update." },
    ],
    claimEvidenceLinks: [
      {
        claimId: "claim-1",
        documentId: "doc-authority",
        evidenceFragmentFingerprint: HASH_B,
        locator: "paragraph:1",
      },
    ],
  };
}

function expectError(
  input: unknown,
  evaluator: EvidenceAdmissionEvaluator,
  reasonCode: string,
): void {
  expect(assembleEvidencePackage(input, evaluator)).toEqual({
    status: "error",
    reasonCode,
  });
}

describe("assembleEvidencePackage", () => {
  it("EP01 assembles eligible authority evidence", () => {
    const result = assembleEvidencePackage(
      validInput(),
      evaluatorReturning(eligibleDecision),
    );

    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.package.packageId).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(result.package.claims[0]?.claimFingerprint).toMatch(
      /^sha256:[a-f0-9]{64}$/,
    );
    expect(serializeEvidencePackage(result.package)).toMatchObject({
      status: "ok",
    });
  });

  it.each([
    [ADMISSION_OUTCOME.HOLD, ADMISSION_REASON.INSUFFICIENT_INDEPENDENT_ORIGINS],
    [
      ADMISSION_OUTCOME.REJECT,
      ADMISSION_REASON.DISCOVERY_CONTENT_CONTAMINATION,
    ],
    [ADMISSION_OUTCOME.STOP, ADMISSION_REASON.CRITICAL_RIGHTS_FAILURE],
  ] as const)(
    "EP02 refuses to assemble %s decisions",
    (outcome, reasonCode) => {
      const decision: EvidenceAdmissionDecision = {
        outcome,
        reasonCodes: [reasonCode],
        independentOriginCount: 1,
      };
      const input = validInput();
      input.admission.suppliedDecision = decision;

      expectError(
        input,
        evaluatorReturning(decision),
        EVIDENCE_PACKAGE_ASSEMBLY_REASON.ADMISSION_NOT_ELIGIBLE,
      );
    },
  );

  it("EP03 rejects a supplied decision that differs from reevaluation", () => {
    const reevaluated: EvidenceAdmissionDecision = {
      outcome: "hold",
      reasonCodes: ["insufficient_independent_origins"],
      independentOriginCount: 1,
    };

    expectError(
      validInput(),
      evaluatorReturning(reevaluated),
      EVIDENCE_PACKAGE_ASSEMBLY_REASON.ADMISSION_DECISION_MISMATCH,
    );
  });

  it("treats equivalent reason-code sets as equal regardless of order", () => {
    const supplied: EvidenceAdmissionDecision = {
      ...eligibleDecision,
      reasonCodes: ["eligible_evidence", "material_contradiction"],
    };
    const reevaluated: EvidenceAdmissionDecision = {
      ...supplied,
      reasonCodes: [...supplied.reasonCodes].reverse(),
    };
    const input = validInput();
    input.admission.suppliedDecision = supplied;

    expect(
      assembleEvidencePackage(input, evaluatorReturning(reevaluated)).status,
    ).toBe("ok");
  });

  it.each([
    { ...eligibleDecision, reasonCodes: [undefined] },
    { ...eligibleDecision, independentOriginCount: undefined },
  ])(
    "returns a typed failure for malformed evaluator output %#",
    (malformed) => {
      const evaluator: EvidenceAdmissionEvaluator = {
        evaluate: () => malformed as unknown as EvidenceAdmissionDecision,
      };

      expect(() =>
        assembleEvidencePackage(validInput(), evaluator),
      ).not.toThrow();
      expect(assembleEvidencePackage(validInput(), evaluator)).toEqual({
        status: "error",
        reasonCode:
          EVIDENCE_PACKAGE_ASSEMBLY_REASON.INVALID_ADMISSION_EVALUATOR_OUTPUT,
      });
    },
  );

  it("EP04 forbids discovery-tier evidence despite a forged eligible evaluator", () => {
    const input = validInput();
    input.admission.input.evidence[0]!.tier = "D";
    input.documents[0]!.tier = "D";

    expectError(
      input,
      evaluatorReturning(eligibleDecision),
      EVIDENCE_PACKAGE_ASSEMBLY_REASON.DISCOVERY_EVIDENCE_FORBIDDEN,
    );
  });

  it("EP05 rejects a claim without an evidence link", () => {
    const input = validInput();
    input.claimEvidenceLinks = [];

    expectError(
      input,
      evaluatorReturning(eligibleDecision),
      EVIDENCE_PACKAGE_ASSEMBLY_REASON.MISSING_CLAIM_EVIDENCE_LINK,
    );
  });

  it.each([
    [
      "claimId",
      "unknown-claim",
      EVIDENCE_PACKAGE_ASSEMBLY_REASON.UNKNOWN_CLAIM_REFERENCE,
    ],
    [
      "documentId",
      "unknown-document",
      EVIDENCE_PACKAGE_ASSEMBLY_REASON.UNKNOWN_DOCUMENT_REFERENCE,
    ],
  ] as const)("EP06 rejects an unknown %s", (field, value, reasonCode) => {
    const input = validInput();
    input.claimEvidenceLinks[0]![field] = value;

    expectError(input, evaluatorReturning(eligibleDecision), reasonCode);
  });

  it.each([
    ["document", EVIDENCE_PACKAGE_ASSEMBLY_REASON.DUPLICATE_DOCUMENT_ID],
    ["claim", EVIDENCE_PACKAGE_ASSEMBLY_REASON.DUPLICATE_CLAIM_ID],
    ["origin", EVIDENCE_PACKAGE_ASSEMBLY_REASON.DUPLICATE_ORIGIN_ID],
    ["edge", EVIDENCE_PACKAGE_ASSEMBLY_REASON.DUPLICATE_ORIGIN_EDGE],
    ["link", EVIDENCE_PACKAGE_ASSEMBLY_REASON.DUPLICATE_EVIDENCE_LINK],
  ] as const)(
    "EP07 rejects duplicate %s identities before sorting",
    (kind, reasonCode) => {
      const input = validInput();
      if (kind === "document")
        input.documents.push(structuredClone(input.documents[0]!));
      if (kind === "claim")
        input.claims.push(structuredClone(input.claims[0]!));
      if (kind === "origin") {
        input.originGraph.nodes.push(
          structuredClone(input.originGraph.nodes[0]!),
        );
      }
      if (kind === "edge") {
        input.originGraph.nodes.push({ originId: "root", fingerprint: HASH_D });
        input.originGraph.edges.push(
          { fromOriginId: "origin-authority", derivesFromOriginId: "root" },
          { fromOriginId: "origin-authority", derivesFromOriginId: "root" },
        );
      }
      if (kind === "link") {
        input.claimEvidenceLinks.push(
          structuredClone(input.claimEvidenceLinks[0]!),
        );
      }

      expectError(input, evaluatorReturning(eligibleDecision), reasonCode);
    },
  );

  it("EP08 rejects current-affairs E1/E2 evidence with one terminal origin", () => {
    const input = validInput();
    input.admission.input.topic = "current_affairs";
    input.admission.input.evidence = [
      { ...input.admission.input.evidence[0]!, originGroup: "shared-root" },
      {
        ...input.admission.input.evidence[0]!,
        documentId: "doc-corroborator",
        tier: "E2",
        originGroup: "shared-root",
      },
    ];
    input.documents = [
      {
        ...input.documents[0]!,
        originGroup: "shared-root",
        originNodeId: "node-e1",
      },
      {
        ...input.documents[0]!,
        documentId: "doc-corroborator",
        sourceId: "source-corroborator",
        tier: "E2",
        originGroup: "shared-root",
        originNodeId: "node-e2",
      },
    ];
    input.originGraph = {
      nodes: [
        { originId: "node-e1", fingerprint: HASH_A },
        { originId: "node-e2", fingerprint: HASH_B },
        { originId: "shared-root", fingerprint: HASH_C },
      ],
      edges: [
        { fromOriginId: "node-e1", derivesFromOriginId: "shared-root" },
        { fromOriginId: "node-e2", derivesFromOriginId: "shared-root" },
      ],
    };

    expectError(
      input,
      evaluatorReturning(eligibleDecision),
      EVIDENCE_PACKAGE_ASSEMBLY_REASON.NON_INDEPENDENT_REQUIRED_CORROBORATION,
    );
  });

  it("EP09 produces identical bytes and IDs for equivalent input permutations", () => {
    const first = validInput();
    first.admission.input.evidence.push({
      ...first.admission.input.evidence[0]!,
      documentId: "doc-second",
      tier: "E2",
      originGroup: "origin-second",
    });
    first.documents.push({
      ...first.documents[0]!,
      documentId: "doc-second",
      sourceId: "source-second",
      tier: "E2",
      originGroup: "origin-second",
      originNodeId: "origin-second",
    });
    first.originGraph.nodes.push({
      originId: "origin-second",
      fingerprint: HASH_D,
    });
    first.claims.push({
      claimId: "claim-2",
      text: "A corroborator published a record.",
    });
    first.claimEvidenceLinks.push({
      claimId: "claim-2",
      documentId: "doc-second",
      evidenceFragmentFingerprint: HASH_C,
      locator: "paragraph:2",
    });
    const twoOriginDecision: EvidenceAdmissionDecision = {
      ...eligibleDecision,
      independentOriginCount: 2,
    };
    first.admission.suppliedDecision = twoOriginDecision;
    const second = structuredClone(first);
    second.admission.input.evidence.reverse();
    second.documents.reverse();
    second.originGraph.nodes.reverse();
    second.claims.reverse();
    second.claimEvidenceLinks.reverse();

    const resultA = assembleEvidencePackage(
      first,
      evaluatorReturning(twoOriginDecision),
    );
    const resultB = assembleEvidencePackage(
      second,
      evaluatorReturning(twoOriginDecision),
    );
    expect(resultA.status).toBe("ok");
    expect(resultB.status).toBe("ok");
    if (resultA.status !== "ok" || resultB.status !== "ok") return;

    const bytesA = serializeEvidencePackage(resultA.package);
    const bytesB = serializeEvidencePackage(resultB.package);
    expect(bytesA).toEqual(bytesB);
    expect(resultA.package.packageId).toBe(resultB.package.packageId);
  });

  it("EP10 returns a deeply frozen package detached from caller input", () => {
    const input = validInput();
    const result = assembleEvidencePackage(
      input,
      evaluatorReturning(eligibleDecision),
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;

    input.documents[0]!.sourceId = "mutated-caller-source";
    expect(result.package.documents[0]?.sourceId).toBe("source-authority");
    expect(Object.isFrozen(result.package)).toBe(true);
    expect(Object.isFrozen(result.package.documents)).toBe(true);
    expect(Object.isFrozen(result.package.documents[0]?.rightsSnapshot)).toBe(
      true,
    );
    expect(() => {
      result.package.documents[0]!.sourceId = "mutated-package";
    }).toThrow(TypeError);
  });

  it("returns a typed failure for malformed snapshot fingerprints", () => {
    const input = validInput();
    input.documents[0]!.documentFingerprint = "not-a-sha256";

    expectError(
      input,
      evaluatorReturning(eligibleDecision),
      EVIDENCE_PACKAGE_ASSEMBLY_REASON.CANONICALIZATION_FAILURE,
    );
  });

  it("detects package identity changes during serialization", () => {
    const result = assembleEvidencePackage(
      validInput(),
      evaluatorReturning(eligibleDecision),
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    const alteredPackage = structuredClone(result.package);
    alteredPackage.documents[0]!.sourceId = "altered-source";

    expect(serializeEvidencePackage(alteredPackage)).toEqual({
      status: "error",
      reasonCode: EVIDENCE_PACKAGE_ASSEMBLY_REASON.PACKAGE_IDENTITY_MISMATCH,
    });
  });

  it.each([
    ["rights", EVIDENCE_PACKAGE_ASSEMBLY_REASON.INVALID_RIGHTS_SNAPSHOT],
    ["document", EVIDENCE_PACKAGE_ASSEMBLY_REASON.ADMISSION_EVIDENCE_MISMATCH],
  ] as const)("EP11 rejects a mismatched %s snapshot", (kind, reasonCode) => {
    const input = validInput();
    if (kind === "rights")
      input.documents[0]!.rightsSnapshot.status = "missing";
    if (kind === "document")
      input.documents[0]!.originGroup = "different-origin";

    expectError(input, evaluatorReturning(eligibleDecision), reasonCode);
  });

  it.each(["missing-node", "cycle", "ambiguous-root"] as const)(
    "EP12 rejects an invalid origin graph: %s",
    (kind) => {
      const input = validInput();
      if (kind === "missing-node") {
        input.originGraph.edges.push({
          fromOriginId: "origin-authority",
          derivesFromOriginId: "missing-root",
        });
      }
      if (kind === "cycle") {
        input.originGraph.edges.push({
          fromOriginId: "origin-authority",
          derivesFromOriginId: "origin-authority",
        });
      }
      if (kind === "ambiguous-root") {
        input.originGraph.nodes.push(
          { originId: "root-a", fingerprint: HASH_C },
          { originId: "root-b", fingerprint: HASH_D },
        );
        input.originGraph.edges.push(
          { fromOriginId: "origin-authority", derivesFromOriginId: "root-a" },
          { fromOriginId: "origin-authority", derivesFromOriginId: "root-b" },
        );
      }

      expectError(
        input,
        evaluatorReturning(eligibleDecision),
        EVIDENCE_PACKAGE_ASSEMBLY_REASON.INVALID_ORIGIN_GRAPH,
      );
    },
  );
});
