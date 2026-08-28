import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      include: ["apps/*/src/**/*.ts", "packages/*/src/**/*.ts"],
      exclude: ["**/*.test.ts"],
      reporter: ["text"],
    },
    exclude: ["**/dist/**", "**/node_modules/**"],
  },
});
