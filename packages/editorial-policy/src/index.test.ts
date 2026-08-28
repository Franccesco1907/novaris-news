import { describe, expect, it } from "vitest";

import { evaluateEvidenceAdmission } from "./index.js";

function authorityEvidence(overrides: Record<string, unknown> = {}) {
  return {
    documentId: "doc-authority",
    tier: "E1",
    originGroup: "authority-origin",
    rightsStatus: "approved",
    provenanceStatus: "complete",
    inRemit: true,
    current: true,
    materiallyContradicted: false,
    ...overrides,
  };
}

function admissionInput(overrides: Record<string, unknown> = {}) {
  return {
    storyId: "story-1",
    policyVersion: "phase1-v1",
    topic: "technology_science",
    policyServiceAvailable: true,
    provenanceStoreAvailable: true,
    containsDiscoveryContent: false,
    financialRecommendation: "none",
    excludedCategory: "none",
    evidence: [authorityEvidence()],
    ...overrides,
  };
}

describe("evaluateEvidenceAdmission", () => {
  it("admits current in-remit authority evidence with complete rights and provenance", () => {
    expect(evaluateEvidenceAdmission(admissionInput())).toEqual({
      outcome: "eligible",
      reasonCodes: ["eligible_evidence"],
      independentOriginCount: 1,
    });
  });

  it.each(["missing", "invalid"])(
    "stops when rights are %s",
    (rightsStatus) => {
      expect(
        evaluateEvidenceAdmission(
          admissionInput({ evidence: [authorityEvidence({ rightsStatus })] }),
        ),
      ).toMatchObject({
        outcome: "stop",
        reasonCodes: ["critical_rights_failure"],
      });
    },
  );

  it.each(["missing", "invalid"])(
    "stops when evidence provenance is %s",
    (provenanceStatus) => {
      expect(
        evaluateEvidenceAdmission(
          admissionInput({
            evidence: [authorityEvidence({ provenanceStatus })],
          }),
        ),
      ).toMatchObject({
        outcome: "stop",
        reasonCodes: ["critical_provenance_failure"],
      });
    },
  );

  it.each([
    ["policyServiceAvailable", "critical_policy_dependency_unavailable"],
    ["provenanceStoreAvailable", "critical_provenance_dependency_unavailable"],
  ])("stops when %s is unavailable", (dependency, reasonCode) => {
    expect(
      evaluateEvidenceAdmission(admissionInput({ [dependency]: false })),
    ).toMatchObject({
      outcome: "stop",
      reasonCodes: [reasonCode],
    });
  });

  it("holds current affairs with only one independent origin", () => {
    const evidence = [
      authorityEvidence({ documentId: "doc-1", originGroup: "shared-origin" }),
      authorityEvidence({
        documentId: "doc-2",
        tier: "E2",
        originGroup: "shared-origin",
      }),
    ];

    expect(
      evaluateEvidenceAdmission(
        admissionInput({ topic: "current_affairs", evidence }),
      ),
    ).toMatchObject({
      outcome: "hold",
      reasonCodes: ["insufficient_independent_origins"],
      independentOriginCount: 1,
    });
  });

  it("holds current affairs with two independent authorities but no corroborator", () => {
    const evidence = [
      authorityEvidence({
        documentId: "doc-authority-a",
        originGroup: "authority-origin-a",
      }),
      authorityEvidence({
        documentId: "doc-authority-b",
        originGroup: "authority-origin-b",
      }),
    ];

    expect(
      evaluateEvidenceAdmission(
        admissionInput({ topic: "current_affairs", evidence }),
      ),
    ).toMatchObject({
      outcome: "hold",
      reasonCodes: ["missing_independent_corroborator"],
      independentOriginCount: 2,
    });
  });

  it("admits current affairs only when authority and corroborator have distinct origins", () => {
    const evidence = [
      authorityEvidence({
        documentId: "doc-authority",
        originGroup: "authority-origin",
      }),
      authorityEvidence({
        documentId: "doc-corroborator",
        tier: "E2",
        originGroup: "corroborator-origin",
      }),
    ];

    expect(
      evaluateEvidenceAdmission(
        admissionInput({ topic: "current_affairs", evidence }),
      ),
    ).toEqual({
      outcome: "eligible",
      reasonCodes: ["eligible_evidence"],
      independentOriginCount: 2,
    });
  });

  it("rejects discovery content contamination", () => {
    expect(
      evaluateEvidenceAdmission(
        admissionInput({ containsDiscoveryContent: true }),
      ),
    ).toMatchObject({
      outcome: "reject",
      reasonCodes: ["discovery_content_contamination"],
    });
  });

  it("rejects discovery-tier evidence even when the contamination flag is false", () => {
    expect(
      evaluateEvidenceAdmission(
        admissionInput({ evidence: [authorityEvidence({ tier: "D" })] }),
      ),
    ).toMatchObject({
      outcome: "reject",
      reasonCodes: ["discovery_content_contamination"],
    });
  });

  it("rejects financial recommendations even when evidence is valid", () => {
    expect(
      evaluateEvidenceAdmission(
        admissionInput({
          topic: "general_economics",
          financialRecommendation: "buy",
        }),
      ),
    ).toMatchObject({
      outcome: "reject",
      reasonCodes: ["financial_recommendation_prohibited"],
    });
  });

  it.each([
    "unconfirmed_crime",
    "medical_advice",
    "election_poll",
    "emergency_instruction",
    "live_conflict_casualty",
  ])("rejects excluded category %s", (excludedCategory) => {
    expect(
      evaluateEvidenceAdmission(admissionInput({ excludedCategory })),
    ).toMatchObject({
      outcome: "reject",
      reasonCodes: ["excluded_high_risk_category"],
    });
  });

  it("rejects stale evidence", () => {
    expect(
      evaluateEvidenceAdmission(
        admissionInput({ evidence: [authorityEvidence({ current: false })] }),
      ),
    ).toMatchObject({ outcome: "reject", reasonCodes: ["stale_evidence"] });
  });

  it("rejects evidence outside the authority's remit", () => {
    expect(
      evaluateEvidenceAdmission(
        admissionInput({ evidence: [authorityEvidence({ inRemit: false })] }),
      ),
    ).toMatchObject({
      outcome: "reject",
      reasonCodes: ["outside_source_remit"],
    });
  });

  it("holds materially contradicted evidence", () => {
    expect(
      evaluateEvidenceAdmission(
        admissionInput({
          evidence: [authorityEvidence({ materiallyContradicted: true })],
        }),
      ),
    ).toMatchObject({
      outcome: "hold",
      reasonCodes: ["material_contradiction"],
    });
  });

  it("holds evidence without an authority-tier record", () => {
    expect(
      evaluateEvidenceAdmission(
        admissionInput({ evidence: [authorityEvidence({ tier: "E2" })] }),
      ),
    ).toMatchObject({
      outcome: "hold",
      reasonCodes: ["missing_authority_evidence"],
    });
  });
});
