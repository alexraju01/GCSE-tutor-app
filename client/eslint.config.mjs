import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import betterTailwind from "eslint-plugin-better-tailwindcss";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),

  {
    extends: [betterTailwind.configs.recommended],
    settings: {
      "better-tailwindcss": {
        entryPoint: "src/app/globals.css",
      },
    },
    rules: {
      // Prettier (prettier-plugin-tailwindcss) owns class order and wrapping
      "better-tailwindcss/enforce-consistent-class-order": "off",
      "better-tailwindcss/enforce-consistent-line-wrapping": "off",
      // Slowest rule by far (~60% of lint time)
      "better-tailwindcss/enforce-canonical-classes": "off",
      "better-tailwindcss/no-unknown-classes": [
        "error",
        { ignore: ["^custom-.*", "^toaster$"] },
      ],
    },
  },

  {
    files: ["*.config.js", "*.config.mjs", "*.config.ts"],
    languageOptions: {
      parserOptions: {
        project: null,
      },
    },
  },

  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // === React Component Structure ===
      "react/function-component-definition": [
        "error",
        {
          namedComponents: "arrow-function",
          unnamedComponents: "arrow-function",
        },
      ],

      // === TypeScript & Code Quality ===
      "@typescript-eslint/no-explicit-any": "error",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      "object-shorthand": ["warn", "always"],
      eqeqeq: ["error", "always"],

      // === Async Defenses ===
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-floating-promises": "error",

      // === React & Next.js App Router Best Practices ===
      "react/self-closing-comp": "error",
      "react/jsx-no-useless-fragment": "warn",
      "react/jsx-no-target-blank": "error",
      "react-hooks/exhaustive-deps": "warn",

      // === Maintainability & Layout Rules ===
      "no-nested-ternary": "error",
      "no-else-return": ["warn", { allowElseIf: false }],
    },
  },
]);

export default eslintConfig;
