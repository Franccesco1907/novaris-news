import { describe, expect, it } from "vitest";

import type { SyntheticCase } from "./cases.js";
import { runCases } from "./run-cases.js";

const validCase: SyntheticCase = {
  id: "valid",
  description: "valid authority evidence",
  input: {
    storyId: "story-valid",
    policyVersion: "phase1-v1",
    topic: "technology_science",
    policyServiceAvailable: true,
    provenanceStoreAvailable: true,
    containsDiscoveryContent: false,
    financialRecommendation: "none",
    excludedCategory: "none",
    evidence: [
      {
        documentId: "doc-valid",
        tier: "E1",
        originGroup: "authority-origin",
        rightsStatus: "approved",
        provenanceStatus: "complete",
        inRemit: true,
        current: true,
        materiallyContradicted: false,
      },
    ],
  },
  expectedOutcome: "eligible",
  expectedReasonCode: "eligible_evidence",
};

describe("runCases", () => {
  it("reports a mismatch instead of hiding it", () => {
    const mismatchedCase: SyntheticCase = {
      ...validCase,
      expectedOutcome: "reject",
    };

    expect(runCases([mismatchedCase])).toEqual({
      passed: 0,
      failures: [
        {
          id: "valid",
          expected: "reject:eligible_evidence",
          received: "eligible:eligible_evidence",
        },
      ],
    });
  });
});
