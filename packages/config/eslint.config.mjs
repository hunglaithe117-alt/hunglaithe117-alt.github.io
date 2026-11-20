// Shared ESLint flat config (@blog/config). No legacy `.eslintrc`.
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
    // Node globals for tooling scripts + config files (astro.config.mjs, e2e/*.mjs, scripts, ...).
    files: [
      "**/*.{mjs,cjs}",
      "**/*.config.{js,mjs,cjs,ts}",
      "**/scripts/**/*.{js,mjs,ts}",
      "**/e2e/**/*.{js,mjs,ts}",
    ],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        URL: "readonly",
        fetch: "readonly",
        Buffer: "readonly",
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
