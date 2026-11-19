# Feature Templates

> **When to use:** one change to the product has to be described (a capability being added, a rule being tightened, or an interface being replaced) and the change does not warrant an architecture chapter of its own.
>
> **What it answers:** what the feature document owns, where the copy lands, and how it relates to the ADR and architecture families.
>
> Delete this blockquote when filled.

A **feature** is one change to the product: a capability added, a rule tightened, an interface replaced. [`feature-doc.md`](feature-doc.md) is the living document: written with the code, it states what the feature does now, and a maintainer edits it in place for as long as the feature exists. Plans and specifications belong in the project's own backlog or PRD, not in this library.

The standards behind this family are the structure templates and the docs-as-code practice; a filled set shows how a filled document reads. Every copy follows [`CONVENTIONS`](../CONVENTIONS.md).

## What to write

| Situation                                                                                       | Write                                                  | Because                                              |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------- |
| A capability that has shipped and now has to be changed, operated, or explained by someone else | [`feature-doc.md`](feature-doc.md)                     | The reader needs the current behaviour, not the plan |
| A structural change (a new container, a new store, a new cross-cutting rule)                    | an [`architecture`](../architecture/README.md) chapter | See below                                            |
| One technical decision whose consequences outlive this feature                                  | an [ADR](../adr/README.md)                             | A decision is recorded once, by the ADR family       |

## When an architecture chapter is warranted instead

Write or extend a chapter in [`architecture`](../architecture/README.md) rather than a feature document when the change:

- introduces or removes a deployable container, a datastore, or a broker;
- moves the system boundary, or changes the actors or an external interface;
- establishes a concern other building blocks must then follow - an error envelope, an authentication model, a caching rule;
- alters the deployment topology or the data architecture as a whole.

Those are the concerns of the C4- and arc42-shaped family: a feature document describes one change, an architecture chapter describes the system. When both are needed, the feature document links the chapter instead of restating it ([`CONVENTIONS`](../CONVENTIONS.md) §12).

## Where the document lives

A feature's document lives under `docs/features/`, created by the first feature that needs it. Links are library-relative; a copy becomes the project-side `docs/features/README.md`. Two shapes are valid:

| Shape      | Use it when                             | Paths                                                                       |
| ---------- | --------------------------------------- | --------------------------------------------------------------------------- |
| One file   | The feature owns one document           | `docs/features/<feature>.md`                                                |
| One folder | The feature owns more than one document | `docs/features/<feature>/<feature>.md`, with any supporting files beside it |

A single-file feature that later grows a second document moves to a folder: create `docs/features/<feature>/`, move the file to `docs/features/<feature>/<feature>.md`, and add the new document beside it.

The **stub** in this library keeps its canonical filename, `feature-doc.md` ([`CONVENTIONS`](../CONVENTIONS.md) §2), while a **copy** is renamed after the feature in kebab-case. Set a document's title to the feature's name so a reader arriving from a search result knows which feature they have.

## Rules

- **Numbered content, unnumbered index.** A filled feature document uses numbered `## N.` sections and closes with `## N. References`; an index such as this one stays unnumbered ([`CONVENTIONS`](../CONVENTIONS.md) §11).
- **One concern per file.** The living document is not a runbook ([`CONVENTIONS`](../CONVENTIONS.md) §8). A recovery procedure the feature refers to belongs in [`runbooks`](../operations/runbooks/README.md).
- **One authority per rule.** Error codes and their HTTP status live only in [`error-codes`](../api/error-codes.md); naming, formatting, and commit conventions live only in the project's [`coding-rules`](../development/coding-rules/) folder. A feature document names the codes its operations raise and links the catalogue ([`CONVENTIONS`](../CONVENTIONS.md) §12).
- **Ship it with the code.** A behaviour change and its document change are one change ([`CONVENTIONS`](../CONVENTIONS.md) §9).
- **Diagrams are Mermaid.** A flow or state diagram is a `mermaid` fenced block, never an exported image, and its labels carry placeholders as guillemets ([`CONVENTIONS`](../CONVENTIONS.md) §1, §4).

## How to start

1. Decide whether the work needs a feature document, an architecture chapter, or an ADR, using the table above.
1. Copy `feature-doc.md` into `docs/features/` in the shape the second table gives, naming the copy as "Where the document lives" describes.
1. Replace every fill-me-in slot. The form required in each position (prose, code span, or `mermaid` fence) is defined in [`CONVENTIONS`](../CONVENTIONS.md) §1.
1. Delete the sections the stub marks "Delete this section when filled.", and delete any other section the feature does not have rather than leaving it empty — except the sections the stub says are stated in one line.
1. Link, do not restate: cite the ADR that decided, the architecture chapter that describes, and the catalogue that lists the code.
1. Ship the document in the same change as the code it describes.

## Conventions

Every template here and every document written from one follows [`CONVENTIONS`](../CONVENTIONS.md).
