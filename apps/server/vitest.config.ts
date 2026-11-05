import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [swc.vite({ module: { type: "es6" } })],
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      include: ["src/modules/product/**/*.ts"],
      exclude: ["src/modules/product/*.module.ts"],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
