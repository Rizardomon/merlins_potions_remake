import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: [
        "src/app/providers.tsx",
        "src/lib/theme.ts",
        "src/test/local-storage-mock.ts",
        "src/app/api/products/route.ts",
        "src/lib/api/product-repository.ts",
        "src/hooks/use-app.ts",
        "src/lib/bag/reducer.ts",
        "src/lib/bag/selectors.ts",
        "src/lib/bag/storage.ts",
        "src/lib/bag/provider.tsx",
        "src/components/storefront/newsletter-block.tsx",
        "src/components/storefront/category-nav.tsx",
        "src/components/storefront/header.tsx",
        "src/components/storefront/footer.tsx",
        "src/components/storefront/announcement-bar.tsx",
        "src/lib/catalog/filter-sort.ts",
        "src/components/storefront/potion-card.tsx",
        "src/components/storefront/catalog-section.tsx",
        "src/components/storefront/drawer-base.tsx",
        "src/components/storefront/bag-drawer.tsx",
        "src/components/storefront/add-to-bag-toast.tsx",
      ],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
