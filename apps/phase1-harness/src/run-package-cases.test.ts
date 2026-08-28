import { describe, expect, it } from "vitest";

import { evidencePackageCases } from "./package-cases.js";
import { runEvidencePackageCases } from "./run-package-cases.js";

describe("runEvidencePackageCases", () => {
  it("reports an evidence-package mismatch", () => {
    const mismatchedCase = {
      ...evidencePackageCases[0]!,
      expected: "admission_not_eligible" as const,
    };

    expect(runEvidencePackageCases([mismatchedCase])).toEqual({
      passed: 0,
      failures: [
        {
          id: "package-eligible",
          expected: "admission_not_eligible",
          received: "ok",
        },
      ],
    });
  });
});
