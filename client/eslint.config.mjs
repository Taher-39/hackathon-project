import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // These rules are useful with React Compiler-managed data fetching, but
      // this app deliberately initializes client state from async API calls
      // and persisted Zustand hydration inside effects.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
