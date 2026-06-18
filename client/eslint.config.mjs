import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tailwind from "eslint-plugin-tailwindcss";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...tailwind.configs["flat/recommended"],

  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),

  {
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
      "@typescript-eslint/no-any": "error",
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

      // New Async Defenses
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
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },
]);

export default eslintConfig;
