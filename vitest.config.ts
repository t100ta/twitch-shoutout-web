import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: [
        "src/utils/**/*.{ts,tsx}",
        "src/store/**/*.{ts,tsx}",
        "src/hooks/**/*.{ts,tsx}",
      ],
      exclude: ["src/types/**", "src/libs/**"],
    },
  },
});
