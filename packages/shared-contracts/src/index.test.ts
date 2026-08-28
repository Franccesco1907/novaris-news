import { describe, expect, it } from "vitest";

import {
  evidenceAdmissionDecisionSchema,
  evidenceAdmissionInputSchema,
} from "./index.js";

describe("evidence admission contracts", () => {
  it("rejects an unknown evidence tier at the input boundary", () => {
    const parsed = evidenceAdmissionInputSchema.safeParse({
      storyId: "story-invalid",
      policyVersion: "phase1-v1",
      topic: "technology_science",
      policyServiceAvailable: true,
      provenanceStoreAvailable: true,
      containsDiscoveryContent: false,
      financialRecommendation: "none",
      excludedCategory: "none",
      evidence: [
        {
          documentId: "doc-invalid",
          tier: "UNKNOWN",
          originGroup: "origin",
          rightsStatus: "approved",
          provenanceStatus: "complete",
          inRemit: true,
          current: true,
        },
      ],
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects an empty reason list at the output boundary", () => {
    expect(
      evidenceAdmissionDecisionSchema.safeParse({
        outcome: "eligible",
        reasonCodes: [],
        independentOriginCount: 1,
      }).success,
    ).toBe(false);
  });
});
