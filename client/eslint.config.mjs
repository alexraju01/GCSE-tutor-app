import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tailwind from "eslint-plugin-tailwindcss";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...tailwind.configs["flat/recommended"],

  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),

  {
    settings: {
      tailwindcss: {
        callees: ["classnames", "clsx", "ctl"],
        config: {},
        whitelist: [
          "border-custom-accent", // Matches this specific class
          "custom-.*",
        ],
      },
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
      "tailwindcss/classnames-order": "off",
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

      // === Import Optimization ===
      "import/order": [
        "error",
        {
          groups: [
            "builtin", // Built-in types are first
            "external", // External libraries
            "internal", // Internal modules
            ["parent", "sibling"], // Parent and sibling types can be mingled together
            "index", // Then the index file
            "object", // Object imports
          ],
          "newlines-between": "always",
          pathGroups: [
            {
              pattern: "@app/**",
              group: "external",
              position: "after",
            },
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
    },
  },
]);

export default eslintConfig;
