import { evaluateEvidenceAdmission } from "@novaris/editorial-policy";

import type { SyntheticCase } from "./cases.js";

export interface CaseFailure {
  id: string;
  expected: string;
  received: string;
}

export interface HarnessResult {
  passed: number;
  failures: CaseFailure[];
}

export function runCases(cases: readonly SyntheticCase[]): HarnessResult {
  const failures: CaseFailure[] = [];

  for (const syntheticCase of cases) {
    const decision = evaluateEvidenceAdmission(syntheticCase.input);
    const received = `${decision.outcome}:${decision.reasonCodes.join(",")}`;
    const expected = `${syntheticCase.expectedOutcome}:${syntheticCase.expectedReasonCode}`;

    if (received !== expected) {
      failures.push({ id: syntheticCase.id, expected, received });
    }
  }

  return { passed: cases.length - failures.length, failures };
}
