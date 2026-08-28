import { syntheticCases } from "./cases.js";
import { runCases } from "./run-cases.js";

const result = runCases(syntheticCases);

for (const failure of result.failures) {
  console.error(
    `FAIL ${failure.id}: expected ${failure.expected}, received ${failure.received}`,
  );
}

console.log(
  `Phase 1 slice: ${result.passed}/${syntheticCases.length} synthetic cases passed.`,
);

if (result.failures.length > 0) {
  process.exitCode = 1;
}
