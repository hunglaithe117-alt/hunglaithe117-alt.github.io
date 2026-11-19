# Features

The feature documents describe what each shipped capability does now: the behaviour a caller or
maintainer can rely on, the data and interfaces it owns, and the places it breaks. They are living
documents — edited in the same change as the code they describe.

A feature document is written when a capability has to be changed, operated, or explained by
someone other than its author. Structural changes belong in [`../architecture/README.md`](../architecture/README.md);
a decision whose consequences outlive the feature belongs in [`../adr/README.md`](../adr/README.md).

## Documents

| Document                                     | Scope                                                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [`content-pipeline.md`](content-pipeline.md) | One `posts` collection: frontmatter contract, drafts, locale folders, routes, feeds, sitemap and the Pagefind index |

## Related families

- **System shape** — [`../architecture/README.md`](../architecture/README.md); the runtime flows are in [`04-runtime-flows.md`](../architecture/04-runtime-flows.md).
- **Decisions** — [`../adr/README.md`](../adr/README.md).
- **Setup and tests** — [`../development/README.md`](../development/README.md).
- **Deploy, monitor, recover** — [`../operations/README.md`](../operations/README.md).

## Conventions

Feature documents follow [`../../templates/CONVENTIONS.md`](../../templates/CONVENTIONS.md): numbered
content sections, a final References section, English prose, relative links, and Mermaid diagrams as
text. An index such as this page stays unnumbered.
