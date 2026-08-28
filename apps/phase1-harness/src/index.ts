import { syntheticCases } from "./cases.js";
import { evidencePackageCases } from "./package-cases.js";
import { runCases } from "./run-cases.js";
import { runEvidencePackageCases } from "./run-package-cases.js";

const admissionResult = runCases(syntheticCases);
const packageResult = runEvidencePackageCases(evidencePackageCases);
const failures = [...admissionResult.failures, ...packageResult.failures];

for (const failure of failures) {
  console.error(
    `FAIL ${failure.id}: expected ${failure.expected}, received ${failure.received}`,
  );
}

console.log(
  `Phase 1 slice: ${admissionResult.passed + packageResult.passed}/${
    syntheticCases.length + evidencePackageCases.length
  } synthetic cases passed.`,
);

if (failures.length > 0) {
  process.exitCode = 1;
}
