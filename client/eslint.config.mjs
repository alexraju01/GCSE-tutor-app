import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tailwind from "eslint-plugin-tailwindcss";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...tailwind.configs["flat/recommended"],

  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),

  // 1. GLOBAL SETTINGS: Silences the Tailwind v4 config-path spam
  {
    settings: {
      tailwindcss: {
        callees: ["classnames", "clsx", "ctl"],
        config: {}, // Prevents plugin from looking for legacy v3 config files
      },
    },
  },

  // 2. META CONFIG FILES: Bypasses strict tsconfig requirements for build tools
  {
    files: ["*.config.js", "*.config.mjs", "*.config.ts"],
    languageOptions: {
      parserOptions: {
        project: null,
      },
    },
  },

  // 3. SOURCE CODE RULES: Type-aware linting for your components
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
      "no-console": ["warn", { allow: ["warn", "error"] }],
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

      // === Import Optimization ===
      "import/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          pathGroups: [
            {
              pattern: "next",
              group: "external",
              position: "before",
            },
            {
              pattern: "@constants/**",
              group: "internal",
              position: "before",
            },
          ],
          pathGroupsExcludedImportTypes: ["type"],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },
]);

export default eslintConfig;
