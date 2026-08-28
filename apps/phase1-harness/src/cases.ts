import {
  EXCLUDED_CATEGORY,
  type AdmissionOutcome,
  type AdmissionReason,
  type EvidenceAdmissionInput,
} from "@novaris/shared-contracts";

export interface SyntheticCase {
  id: string;
  description: string;
  input: EvidenceAdmissionInput;
  expectedOutcome: AdmissionOutcome;
  expectedReasonCode: AdmissionReason;
}

const validAuthority = {
  documentId: "doc-authority",
  tier: "E1",
  originGroup: "authority-origin",
  rightsStatus: "approved",
  provenanceStatus: "complete",
  inRemit: true,
  current: true,
  materiallyContradicted: false,
} as const;

const validInput = {
  storyId: "story-valid-authority",
  policyVersion: "phase1-v1",
  topic: "technology_science",
  policyServiceAvailable: true,
  provenanceStoreAvailable: true,
  containsDiscoveryContent: false,
  financialRecommendation: "none",
  excludedCategory: "none",
  evidence: [validAuthority],
} as const satisfies EvidenceAdmissionInput;

function caseInput(
  overrides: Partial<EvidenceAdmissionInput>,
): EvidenceAdmissionInput {
  return { ...validInput, ...overrides };
}

export const syntheticCases: readonly SyntheticCase[] = [
  {
    id: "slice-eligible-authority",
    description: "current in-remit authority evidence",
    input: validInput,
    expectedOutcome: "eligible",
    expectedReasonCode: "eligible_evidence",
  },
  {
    id: "slice-stop-rights",
    description: "missing rights snapshot",
    input: caseInput({
      evidence: [{ ...validAuthority, rightsStatus: "missing" }],
    }),
    expectedOutcome: "stop",
    expectedReasonCode: "critical_rights_failure",
  },
  {
    id: "slice-stop-provenance",
    description: "invalid evidence provenance",
    input: caseInput({
      evidence: [{ ...validAuthority, provenanceStatus: "invalid" }],
    }),
    expectedOutcome: "stop",
    expectedReasonCode: "critical_provenance_failure",
  },
  {
    id: "slice-stop-policy-dependency",
    description: "policy dependency unavailable",
    input: caseInput({ policyServiceAvailable: false }),
    expectedOutcome: "stop",
    expectedReasonCode: "critical_policy_dependency_unavailable",
  },
  {
    id: "slice-stop-provenance-dependency",
    description: "provenance store unavailable",
    input: caseInput({ provenanceStoreAvailable: false }),
    expectedOutcome: "stop",
    expectedReasonCode: "critical_provenance_dependency_unavailable",
  },
  {
    id: "slice-hold-common-origin",
    description: "current affairs reports share one upstream origin",
    input: caseInput({
      topic: "current_affairs",
      evidence: [
        {
          ...validAuthority,
          documentId: "doc-a",
          originGroup: "shared-origin",
        },
        {
          ...validAuthority,
          documentId: "doc-b",
          tier: "E2",
          originGroup: "shared-origin",
        },
      ],
    }),
    expectedOutcome: "hold",
    expectedReasonCode: "insufficient_independent_origins",
  },
  {
    id: "slice-hold-missing-corroborator",
    description:
      "current affairs has independent authorities but no E2 corroborator",
    input: caseInput({
      topic: "current_affairs",
      evidence: [
        {
          ...validAuthority,
          documentId: "doc-authority-a",
          originGroup: "authority-origin-a",
        },
        {
          ...validAuthority,
          documentId: "doc-authority-b",
          originGroup: "authority-origin-b",
        },
      ],
    }),
    expectedOutcome: "hold",
    expectedReasonCode: "missing_independent_corroborator",
  },
  {
    id: "slice-reject-discovery",
    description: "discovery text entered publication evidence",
    input: caseInput({ containsDiscoveryContent: true }),
    expectedOutcome: "reject",
    expectedReasonCode: "discovery_content_contamination",
  },
  {
    id: "slice-reject-financial-advice",
    description: "buy recommendation from valid statistics",
    input: caseInput({
      topic: "general_economics",
      financialRecommendation: "buy",
    }),
    expectedOutcome: "reject",
    expectedReasonCode: "financial_recommendation_prohibited",
  },
  ...[
    EXCLUDED_CATEGORY.UNCONFIRMED_CRIME,
    EXCLUDED_CATEGORY.MEDICAL_ADVICE,
    EXCLUDED_CATEGORY.ELECTION_POLL,
    EXCLUDED_CATEGORY.EMERGENCY_INSTRUCTION,
    EXCLUDED_CATEGORY.LIVE_CONFLICT_CASUALTY,
  ].map<SyntheticCase>((excludedCategory) => ({
    id: `slice-reject-${excludedCategory}`,
    description: `excluded category: ${excludedCategory}`,
    input: caseInput({
      excludedCategory,
    }),
    expectedOutcome: "reject",
    expectedReasonCode: "excluded_high_risk_category",
  })),
];
