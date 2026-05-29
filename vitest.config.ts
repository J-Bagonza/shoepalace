import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"],
    globals: true,
    pool: "forks",
    testTimeout: 30000,
    coverage: {
      reporter: ["text", "lcov"],
      exclude: ["node_modules", ".next", "src/tests"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});