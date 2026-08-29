import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/audit-postgres/src/**/*.integration.test.ts"],
    testTimeout: 20_000,
    hookTimeout: 20_000,
    fileParallelism: false,
  },
});
