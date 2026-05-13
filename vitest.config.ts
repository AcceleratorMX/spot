import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: [
        "node_modules/",
        "app/generated/",
        ".next/",
        "*.config.*",
        "vitest.setup.ts",
      ],
    },
    server: {
      deps: {
        inline: ["next-intl"],
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "next/server": path.resolve(
        __dirname,
        "./node_modules/next/dist/server/web/exports/index.js"
      ),
      "next/navigation": path.resolve(
        __dirname,
        "./node_modules/next/dist/client/components/navigation.js"
      ),
    },
  },
});
