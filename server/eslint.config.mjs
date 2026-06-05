// server/eslint.config.mjs
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import perfectionist from "eslint-plugin-perfectionist";

export default tseslint.config(
  {
    ignores: ["prisma.config.ts", "dist/", "node_modules/", ".build/"],
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    plugins: {
      perfectionist,
    },
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // --- CODE QUALITY & BUG PREVENTION ---
      "no-console": ["warn", { allow: ["info", "warn", "error"] }],
      "no-return-await": "error",

      // --- STRICT TYPESCRIPT CHECKS ---
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",

      // --- DEAD CODE & FORMATTING ---
      "no-unused-expressions": "error",
      "no-self-compare": "error",
      "no-unreachable-loop": "error",
      "object-shorthand": ["error", "always"],

      // --- FUNCTION RULES ---
      "prefer-arrow-callback": ["error", { allowNamedFunctions: false }],
      "func-style": ["error", "expression"],

      // --- MAINTENANCE ---
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "prettier/prettier": ["error", { endOfLine: "auto" }],

      // --- NATIVE IMPORT SORTING ---
      "perfectionist/sort-imports": [
        "error",
        {
          type: "alphabetical",
          order: "asc",
          ignoreCase: true,
          groups: ["builtin", "external", "internal", ["parent", "sibling", "index"], "type"],
          newlinesBetween: "ignore",
        },
      ],
    },
  },
  {
    ignores: ["dist/", "node_modules/", ".build/", "eslint.config.mjs"],
  },
);
