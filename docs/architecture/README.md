# Architecture

System description for `blog_personal`: a bilingual personal blog and digital garden built as a pnpm +
Turborepo monorepo, rendered to static HTML, and served by a thin Cloudflare Worker. The chapters follow
the C4 model and the arc42 section structure.

## Chapters

| Chapter                                                      | C4 level       | arc42 | Scope                                                   |
| ------------------------------------------------------------ | -------------- | ----- | ------------------------------------------------------- |
| [`01-context-and-scope.md`](01-context-and-scope.md)         | 1 — Context    | §3    | Boundary, actors, external systems, stakeholders        |
| [`02-container-view.md`](02-container-view.md)               | 2 — Containers | §5    | The static build, the asset Worker, and the edge        |
| [`04-runtime-flows.md`](04-runtime-flows.md)                 | —              | §6    | Page delivery and asset misses                          |
| [`05-deployment-view.md`](05-deployment-view.md)             | —              | §7    | Environments, Cloudflare topology, VPS portability      |
| [`07-quality-requirements.md`](07-quality-requirements.md)   | —              | §10   | Quality scenarios and the unmet-requirement register    |
| [`08-crosscutting-concepts.md`](08-crosscutting-concepts.md) | —              | §8    | Security headers, logging, configuration, i18n, caching |
| [`09-glossary.md`](09-glossary.md)                           | —              | §12   | Terminology for this system                             |

## Reading order

1. [`01-context-and-scope.md`](01-context-and-scope.md) establishes what the system is and is not.
1. [`02-container-view.md`](02-container-view.md) describes the static shape.
1. [`04-runtime-flows.md`](04-runtime-flows.md) describes what happens on a request.
1. [`05-deployment-view.md`](05-deployment-view.md) describes where it runs.
1. [`07-quality-requirements.md`](07-quality-requirements.md) and
   [`08-crosscutting-concepts.md`](08-crosscutting-concepts.md) state the rules the code must hold.
1. [`09-glossary.md`](09-glossary.md) fixes the vocabulary.

## Where the other documentation lives

- Decisions: [`../adr/README.md`](../adr/README.md).
- Setup, configuration, and tests: [`../development/README.md`](../development/README.md).
- Build, deploy, monitoring, and recovery: [`../operations/README.md`](../operations/README.md).
- Feature narrative: [`../features/README.md`](../features/README.md).
- Current delivery state and known defects: [`../status.md`](../status.md).

## Conventions

Chapters follow [`../../templates/CONVENTIONS.md`](../../templates/CONVENTIONS.md): numbered content
sections, a final References section, Mermaid diagrams as text, relative links, and English prose. A
chapter is updated in the same change as the code it describes.
