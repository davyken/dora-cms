import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: "./test/global-setup.ts",
    testTimeout: 20000,
    hookTimeout: 60000,
    // All test files share one in-memory MongoDB started in globalSetup —
    // keep them in a single process so the cached connection (see src/db.ts)
    // and generated env vars stay consistent across files.
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
