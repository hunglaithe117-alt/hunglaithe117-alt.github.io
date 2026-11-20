# Coding Rules

The rule sets in this repository are configuration files, not prose. This page maps a concern to the one file that owns it, so a rule is read from its source instead of a copy that can drift. There is no second rule book.

## Where each rule lives

| Concern                           | Authority                                                                            | Notes                                                                                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JavaScript and TypeScript lint    | [`packages/config/eslint.config.mjs`](../../../packages/config/eslint.config.mjs)    | ESLint flat config. The root `eslint.config.mjs` re-exports this preset, so one file governs every workspace; there is no legacy `.eslintrc`.                        |
| TypeScript strictness             | [`packages/config/tsconfig.base.json`](../../../packages/config/tsconfig.base.json)  | The shared strict base. `apps/web` extends it alongside Astro's strict config and relaxes two guards for content collections; `apps/edge` extends the base directly. |
| Formatting                        | [`.prettierrc.json`](../../../.prettierrc.json)                                      | Prettier options and the Astro plugin; [`.prettierignore`](../../../.prettierignore) lists what it skips.                                                            |
| Editor defaults                   | [`.editorconfig`](../../../.editorconfig)                                            | Editor defaults: line endings, indent, charset, and per-language indent exceptions.                                                                                  |
| Pre-commit                        | `lint-staged` in [`package.json`](../../../package.json), run by `.husky/pre-commit` | The hook's file-to-formatter mapping; it applies these same configs to the staged subset.                                                                            |
| Markdown                          | [`.markdownlint-cli2.yaml`](../../../.markdownlint-cli2.yaml)                        | The markdownlint configuration; `pnpm lint:md` runs it over `*.md` and `*.mdx`.                                                                                      |
| Prose                             | [`.vale.ini`](../../../.vale.ini)                                                    | Vale's configuration, including the MDX format mapping.                                                                                                              |
| Tests                             | the suites themselves                                                                | No config encodes test naming. `e2e/*.spec.ts` is the reference; the run commands are in [`testing-guide.md`](../testing-guide.md).                                  |
| Documentation structure and links | [`CONVENTIONS.md`](../../../templates/CONVENTIONS.md)                                | Structure, links, and the one-authority rule (§12) for documentation.                                                                                                |

## Applying the rules

```bash
pnpm check          # turbo run lint typecheck test
pnpm format:check   # Prettier over the repository
pnpm lint:md        # markdownlint-cli2 over *.md and *.mdx
pnpm check:content  # format:check + lint:md + astro check
```

- The ignored paths are `.env*`, `.dev.vars*`, `secrets.env`, and key material; no check may depend on a value that lives in one of them.
- The pre-commit hook runs `lint-staged`, so a commit that touches a linted file is checked before it lands. CI then runs the task graph, plus Prettier, markdownlint, and Vale over the whole tree.

## Agent rules

[`AGENTS.md`](../../../AGENTS.md) at the repository root is the agent-specific home. It opens with the Turborepo managed guidance block, which tells an agent to resolve the installed `turbo` package and read its bundled docs before changing task configuration — configuration and CLI behaviour vary by installed version, so this repository's `turbo.json` is read against that version's documentation, not from memory. The block is committed with the work and re-added by `turbo` if it is removed.

Agent instruction files that live outside this repository (Python and FastAPI conventions, for example) do not govern this TypeScript and Astro codebase; the files in the table above do.

## Conventions

The format of this page and of the guides beside it is owned by [`CONVENTIONS.md`](../../../templates/CONVENTIONS.md): English body text, `-` bullets, pipe tables, fenced blocks with a language tag, relative links, one trailing newline. A rule with an owner is linked, never restated here.
