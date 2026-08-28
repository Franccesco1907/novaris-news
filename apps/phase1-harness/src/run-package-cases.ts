import { evaluateEvidenceAdmission } from "@novaris/editorial-policy";
import {
  assembleEvidencePackage,
  type EvidenceAdmissionEvaluator,
} from "@novaris/evidence-pipeline";

import type { EvidencePackageCase } from "./package-cases.js";
import type { CaseFailure, HarnessResult } from "./run-cases.js";

const evaluator: EvidenceAdmissionEvaluator = {
  evaluate: evaluateEvidenceAdmission,
};

export function runEvidencePackageCases(
  cases: readonly EvidencePackageCase[],
): HarnessResult {
  const failures: CaseFailure[] = [];

  for (const evidencePackageCase of cases) {
    const result = assembleEvidencePackage(
      evidencePackageCase.input,
      evaluator,
    );
    const received = result.status === "ok" ? "ok" : result.reasonCode;
    if (received !== evidencePackageCase.expected) {
      failures.push({
        id: evidencePackageCase.id,
        expected: evidencePackageCase.expected,
        received,
      });
    }
  }

  return { passed: cases.length - failures.length, failures };
}
