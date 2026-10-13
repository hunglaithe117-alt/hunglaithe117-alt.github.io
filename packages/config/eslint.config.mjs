// Shared ESLint flat config (@blog/config).
// Pin one style repo-wide: ESLint flat config, no legacy `.eslintrc` (T1.3 risk note).
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/bin/**",
      "**/coverage/**",
      "**/.astro/**",
      "**/.cloudflare/**",
      "**/.turbo/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Node globals for tooling config files (astro.config.mjs, eslint.config.mjs, ...).
    files: ["**/*.config.{js,mjs,cjs,ts}", "**/*.config.*"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        module: "readonly",
        require: "readonly",
      },
    },
  },
  {
    rules: {
      // Underscore-prefixed identifiers are intentional placeholders.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
);
