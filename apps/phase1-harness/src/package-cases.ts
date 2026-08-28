import type {
  EvidencePackageAssemblyInput,
  EvidencePackageAssemblyReason,
} from "@novaris/shared-contracts";

export interface EvidencePackageCase {
  id: string;
  description: string;
  input: EvidencePackageAssemblyInput;
  expected: "ok" | EvidencePackageAssemblyReason;
}

const HASH_A = `sha256:${"a".repeat(64)}`;
const HASH_B = `sha256:${"b".repeat(64)}`;
const HASH_C = `sha256:${"c".repeat(64)}`;
const HASH_D = `sha256:${"d".repeat(64)}`;
const DECIDED_AT = "2026-08-28T12:00:00.000Z";

const eligibleInput: EvidencePackageAssemblyInput = {
  schemaVersion: "evidence-package-v1",
  admission: {
    input: {
      storyId: "package-eligible-authority",
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
    suppliedDecision: {
      outcome: "eligible",
      reasonCodes: ["eligible_evidence"],
      independentOriginCount: 1,
    },
    decidedAt: DECIDED_AT,
  },
  assembledAt: "2026-08-28T12:01:00.000Z",
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
  claims: [{ claimId: "claim-1", text: "The authority published an update." }],
  claimEvidenceLinks: [
    {
      claimId: "claim-1",
      documentId: "doc-authority",
      evidenceFragmentFingerprint: HASH_B,
      locator: "paragraph:1",
    },
  ],
};

const heldInput = structuredClone(eligibleInput);
heldInput.admission.input.storyId = "package-held-current-affairs";
heldInput.admission.input.topic = "current_affairs";
heldInput.admission.suppliedDecision = {
  outcome: "hold",
  reasonCodes: ["insufficient_independent_origins"],
  independentOriginCount: 1,
};

export const evidencePackageCases: readonly EvidencePackageCase[] = [
  {
    id: "package-eligible",
    description: "eligible authority evidence assembles deterministically",
    input: eligibleInput,
    expected: "ok",
  },
  {
    id: "package-held",
    description: "held evidence cannot assemble",
    input: heldInput,
    expected: "admission_not_eligible",
  },
];
