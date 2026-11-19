# Development

The contributor-facing guides for this monorepo: bring the stack up, configure it, and run the checks. Every command and value on these pages is taken from the repository itself — the config files it names are the authority, and these pages only route you to them.

## Pages

| File                                                   | Answers                                                                | Read it when                                                         |
| ------------------------------------------------------ | ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [`local-setup.md`](local-setup.md)                     | How do I take a workstation from zero to a running stack?              | You have a fresh machine, or an existing setup has broken.           |
| [`environment-variables.md`](environment-variables.md) | Which variables exist, what each means, which are required, and where? | A component needs configuring, or start-up fails on a missing value. |
| [`testing-guide.md`](testing-guide.md)                 | Which suites exist, how are they run, and what is real versus stubbed? | You are writing, running, or triaging tests.                         |
| [`coding-rules/README.md`](coding-rules/README.md)     | Which config file owns which code rule?                                | You want the rule itself rather than prose about it.                 |

## Coding rules

[`coding-rules`](coding-rules/README.md) is an index, not a rule book. Each row names the one file that owns the rule — the ESLint flat config, the strict TypeScript base, Prettier, EditorConfig, lint-staged, markdownlint, or Vale — and the page stops there rather than restating what those files already say.

`AGENTS.md` at the repository root carries the working rules for AI agents: it opens with the managed Turborepo agent-guidance block, which tells an agent to read the installed `turbo` package's bundled docs before changing task configuration.

## What belongs here

- Task-oriented how-to and factual reference for people writing code: setup, configuration, tests, and the pointer index to the rule files.
- The exact commands and values a contributor copies and pastes, checked against the scripts that run them.
- Tables a reader consults rather than reads end to end: the prerequisites, the variable catalogue, the suite inventory.

## What does not belong here

- Architecture rationale and crosscutting concepts — those live with the architecture chapters, not with a setup recipe.
- The HTTP contract and its error catalogue — no such family exists. Behaviour is described in `docs/features/`; architecture belongs in `docs/architecture/`.
- Decisions and the consequences they accepted — an ADR record owns the "why"; these pages own the "how".
- Build, release, and incident procedures — the operations family (`docs/operations/`) and the GitHub workflows own those. `local-setup.md` stops at a workstation that works.
- A second copy of a rule that already has an owner. Point at the owning file; the reason is in [`CONVENTIONS.md`](../../templates/CONVENTIONS.md) §12.

## Conventions

These pages follow the template library's [`CONVENTIONS.md`](../../templates/CONVENTIONS.md): English body text, `-` bullets, pipe tables, fenced blocks with a language tag, relative links, and one trailing newline. Content pages use numbered sections and close with `References`; this index does not. A rule has one home, and every other file links to it.
