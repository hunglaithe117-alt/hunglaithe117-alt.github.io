# Architecture Templates (C4 · arc42)

> **When to use:** you are bootstrapping a new service, documenting a new major subsystem, or rewriting an existing one, and need a full architecture description rather than a feature note.
>
> **What it answers:** which architecture chapters a system needs, and which chapter owns each architectural concern.
>
> Delete this blockquote when filled.

This family is the C4- and arc42-shaped set of stubs for describing one system: boundary and stakeholders, deployable containers, one container's internals, runtime flows, deployment topology, and data. Links are library-relative; a copy becomes the project-side `docs/architecture/README.md`, where chapters land named `NN-kebab-case.md` per [`CONVENTIONS.md`](../CONVENTIONS.md).

## Chapters

| Chapter                                                      | C4 level       | arc42 | Scope                                                     |
| ------------------------------------------------------------ | -------------- | ----- | --------------------------------------------------------- |
| [`01-context-and-scope.md`](01-context-and-scope.md)         | 1 — Context    | §3    | Boundary, actors, external systems, stakeholders          |
| [`02-container-view.md`](02-container-view.md)               | 2 — Containers | §5    | Deployable processes, ports, shared stores                |
| [`03-component-view.md`](03-component-view.md)               | 3 — Components | §5    | One container's components and layering                   |
| [`04-runtime-flows.md`](04-runtime-flows.md)                 | —              | §6    | Architecturally relevant sequence flows                   |
| [`05-deployment-view.md`](05-deployment-view.md)             | —              | §7    | Environments and infrastructure topology                  |
| [`06-data-architecture.md`](06-data-architecture.md)         | —              | —     | Entities, indexing, retention, caching                    |
| [`07-quality-requirements.md`](07-quality-requirements.md)   | —              | §10   | Quality categories, scenarios, unmet-requirement register |
| [`08-crosscutting-concepts.md`](08-crosscutting-concepts.md) | —              | §8    | Security, logging, caching, errors, configuration         |
| [`09-glossary.md`](09-glossary.md)                           | —              | §12   | Domain and technical terminology                          |

## When to use this family

- A new standalone service or microservice in the ecosystem.
- A new major subsystem that warrants its own multi-chapter description.
- A full architectural rewrite of an existing system.

## When not to

Ordinary feature work does not need this family. Use the `features/` family of this library instead: the feature-doc template (target `docs/features/<feature>.md` for a single-document feature, or `docs/features/<feature>/` when a feature owns more than one document) is a living feature narrative. This family describes a *system*; the feature family describes one *change*.

## How to fill

1. Copy into `docs/architecture/` only the chapters the system needs; delete the rest.
1. Replace every `\<...>` placeholder per [`CONVENTIONS`](../CONVENTIONS.md) §1.
1. Keep diagrams as Mermaid fenced blocks; never commit a binary image without its checked-in source.
1. Ship the document in the same change as the code it describes.

## Conventions

Every template here and every document written from one follows [`CONVENTIONS`](../CONVENTIONS.md).
