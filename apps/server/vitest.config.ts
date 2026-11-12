import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [swc.vite({ module: { type: "es6" } })],
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      include: [
        "src/modules/product/**/*.ts",
        "src/modules/customer/**/*.ts",
        "src/modules/dev/**/*.ts",
        "src/conf/configuration.ts",
        "src/database/database.module.ts",
      ],
      exclude: ["src/**/*.spec.ts", "src/modules/product/product.module.ts"],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
