import { describe, expect, it } from "vitest";

import { runVerifiedScriptCase } from "./run-script-case.js";

describe("runVerifiedScriptCase", () => {
  it("reports a verified-script mismatch", async () => {
    expect(await runVerifiedScriptCase("script_validation_failed")).toEqual({
      passed: 0,
      failures: [
        {
          id: "script-verified",
          expected: "script_validation_failed",
          received: "ok",
        },
      ],
    });
  });
});
