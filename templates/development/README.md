# Development Guide Templates

> **When to use:** you are writing the developer-facing material (how to set up, configure, migrate, test, and contribute) rather than architecture or operations.
>
> **What it answers:** which development guides a project needs, what each one owns, and which document type each belongs to.
>
> Delete this blockquote when filled.

These are the copy-and-fill stubs for a contributor's guides. Links are library-relative; a filled copy becomes the project-side `docs/development/README.md`, named `lower-case-hyphenated.md` per [`CONVENTIONS.md`](../CONVENTIONS.md) §2.

## Pages

| File                                                   | Answers                                                                             | Read it when                                                         |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [`local-setup.md`](local-setup.md)                     | How do I take a workstation from zero to a running system?                          | You have a fresh machine, or an existing setup has broken.           |
| [`environment-variables.md`](environment-variables.md) | Which variables exist, what each means, which are required, and where secrets live? | A component needs configuring, or start-up fails on a missing value. |
| [`testing-guide.md`](testing-guide.md)                 | How are the suites run, and what must each layer assert?                            | You are writing or running tests.                                    |

## Coding rules

[`coding-rules`](coding-rules/) is project-defined: each project writes its own rule files there. The template ships no rule set of its own.

## What belongs here

- Task-oriented how-to and factual reference for people writing code: setup, configuration, tests, and conventions.
- The exact commands and values a contributor copies and pastes.
- Tables a reader consults rather than reads end to end: the prerequisites, the variable catalogue, the test pyramid.

## What does not belong here

- Architecture rationale and crosscutting concepts - [`architecture`](../architecture/README.md).
- Interface contracts and the error-code catalogue - [`api`](../api/README.md).
- Decisions and the consequences they accepted - [`adr`](../adr/README.md).
- Feature narrative and requirements - [`features`](../features/README.md).
- Build, release, and incident procedures - [`operations`](../operations/README.md).
- A restatement of a rule that already has an owner. Link to the owning file instead; see [`CONVENTIONS.md`](../CONVENTIONS.md) §12.

## Where each guide sits

This family is **tutorial and how-to** work, with **reference** tables inside those pages. A filled copy lands in `docs/development/`; the four quadrants are defined in [`CONVENTIONS`](../CONVENTIONS.md) §8.

| Quadrant        | Lives here?                                                                      | This family's page                                                                             |
| --------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Tutorial**    | Yes - the learning path that ends in a running system.                           | [`local-setup.md`](local-setup.md)                                                             |
| **How-to**      | Yes - a recipe that assumes competence and completes one job.                    | Each page's numbered steps.                                                                    |
| **Reference**   | Partly - the catalogues and tables a reader looks up.                            | [`environment-variables.md`](environment-variables.md), [`testing-guide.md`](testing-guide.md) |
| **Explanation** | No - the *why* behind the system's shape belongs with the architecture chapters. | [`architecture`](../architecture/README.md)                                                    |

## Conventions

Every template here and every document written from one follows [`CONVENTIONS.md`](../CONVENTIONS.md). Copy the stub you need, rename the copy per §2, and replace every \<placeholder> per §1 before review.
