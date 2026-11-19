# Documentation

Project documentation for `blog_personal`, written from the code after the backend retirement
(ADR-0012). Start with the status page if you are resuming work; start with the architecture index if
you need to understand the design.

## Where to look

| Document                                           | Answers                                                                    | Read it when                                            |
| -------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------- |
| [`status.md`](status.md)                           | What is built, what is broken, what to do next                             | You are picking the project back up                     |
| [`architecture/README.md`](architecture/README.md) | How the site is shaped: context, containers, flows, deployment, quality    | You are changing a boundary or adding a runtime surface |
| [`adr/README.md`](adr/README.md)                   | Which decisions are recorded, and what each one accepted                   | You want to know why something is the way it is         |
| [`development/README.md`](development/README.md)   | Setup, environment variables, tests, and the rule index                    | You have a fresh machine or are writing tests           |
| [`operations/README.md`](operations/README.md)     | CI/CD, monitoring, recovery, and the symptom-based runbooks                | You are deploying, on call, or recovering               |
| [`features/README.md`](features/README.md)         | How the content pipeline behaves, what it touches, and what it does not do | You are changing the content pipeline                   |

## The documentation set

- **Architecture** — seven chapters following C4 and arc42: context, containers, runtime flows, deployment, quality scenarios, crosscutting concepts, glossary.
- **ADRs** — one record per durable decision, reconstructed from the implementation and commit history because the original plan documents are no longer in the repository. Every ADR says so.
- **Development** — local setup, the complete variable catalogue, the testing guide, and a pointer-only coding-rule index.
- **Operations** — the pipeline, the observability contract, disaster recovery, and runbooks named after the symptom they address.
- **Features** — the content pipeline.

## Conventions

The set follows [`../templates/CONVENTIONS.md`](../templates/CONVENTIONS.md) and nothing in this page restates it. Two consequences a reader will notice here:

- Content documents are numbered and close with a References section; index pages such as this one are unnumbered.
- Rules and definitions have one home elsewhere: format and placeholders in the conventions file, and terminology in [`architecture/09-glossary.md`](architecture/09-glossary.md). There is no failure-status catalogue to point at.

## Keeping it current

| Change                                                | Update                                                                                                                                       |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| A route, frontmatter field, or content limit changes  | The owning feature doc and the schema it names                                                                                               |
| A container, store, or boundary changes               | The relevant architecture chapter, plus a new ADR if the decision is durable                                                                 |
| A dependency, script, or environment variable changes | [`development/local-setup.md`](development/local-setup.md) or [`development/environment-variables.md`](development/environment-variables.md) |
| A pipeline stage or deploy step changes               | [`operations/ci-cd-pipeline.md`](operations/ci-cd-pipeline.md) and a runbook if a new failure mode appears                                   |
| A phase closes or a known defect is fixed             | [`status.md`](status.md)                                                                                                                     |

## References

- Repository entry point: [`../README.md`](../README.md).
- Template library and conventions: [`../templates/README.md`](../templates/README.md).
- Security review: [`../SECURITY.md`](../SECURITY.md).
