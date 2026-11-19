# Documentation Template Library

## 1. What this is

This directory is a project-agnostic template library. Each template is a stub: copy it to its target folder, rename the copy, and replace every `\<...>` placeholder with real content. It covers architecture, API contracts, development, operations, and features in one house style.

- A template is never published as-is; a published document is a filled copy.
- Every copy follows the rules in [`CONVENTIONS.md`](CONVENTIONS.md).
- The standards the templates implement are listed below, followed by the full inventory and where each template goes.
- [`README.md`](README.md) (this page) and [`CONVENTIONS.md`](CONVENTIONS.md) are the library's own meta-documents; they are **not** copied into `docs/` as project content. When a family README is copied, the copy becomes the project-side index for its folder.

## 2. Standards it draws on

Each template implements a published standard or framework. The table below maps each standard to the template family that implements it.

| Standard         | What it contributes                                                                                        | Template family                                                                                                                                                                                                                                                                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| arc42            | The 12-section structure of an architecture document                                                       | `architecture/` — [`01-context-and-scope.md`](architecture/01-context-and-scope.md) through [`09-glossary.md`](architecture/09-glossary.md); see [§2.1](#21-arc42-sections-in-this-library) for the section-by-section mapping                                                                                                                                       |
| C4 model (L1–L4) | Context, container, component, and code zoom levels                                                        | `architecture/` — [`01-context-and-scope.md`](architecture/01-context-and-scope.md) (L1), [`02-container-view.md`](architecture/02-container-view.md) (L2), [`03-component-view.md`](architecture/03-component-view.md) (L3); L4 is deliberately untemplated — generate it from code when needed, and treat `03-component-view.md` as the deepest hand-written level |
| UML 2.x          | Sequence, state-machine, and class/object notation                                                         | sequence → `architecture/` — [`04-runtime-flows.md`](architecture/04-runtime-flows.md); state machine → `features/` — [`feature-doc.md`](features/feature-doc.md); class/object is deliberately untemplated — generate it from code, like C4 L4                                                                                                                      |
| OpenAPI          | Machine-readable REST contract: endpoints, schemas, and auth                                               | `api/` — [`openapi.yaml`](api/openapi.yaml)                                                                                                                                                                                                                                                                                                                          |
| AsyncAPI         | Machine-readable contract for event-driven and message-broker interfaces                                   | `api/` — [`asyncapi.yaml`](api/asyncapi.yaml)                                                                                                                                                                                                                                                                                                                        |
| GraphQL SDL      | Type system, queries, and mutations for a GraphQL surface                                                  | `api/` — [`schema.graphql`](api/schema.graphql)                                                                                                                                                                                                                                                                                                                      |
| Protobuf / gRPC  | Contract-first binary interface for internal services                                                      | `api/` — [`service`](api/grpc/service.proto)                                                                                                                                                                                                                                                                                                                         |
| RFC 9457         | `application/problem+json` as the error-response envelope every API contract shares                        | `api/` — [`error-codes.md`](api/error-codes.md)                                                                                                                                                                                                                                                                                                                      |
| MADR             | The context, decision, status, and consequences of a technical decision                                    | `adr/` — [`template.md`](adr/template.md), [`0001-record-architecture-decisions.md`](adr/0001-record-architecture-decisions.md)                                                                                                                                                                                                                                      |
| Docs-as-Code     | Docs in the same repository and change as the code; Markdown and diagrams-as-code; hook-checked formatting | `development/`, `operations/`, and [`CONVENTIONS.md`](CONVENTIONS.md)                                                                                                                                                                                                                                                                                                |

### 2.1 arc42 sections in this library

Where each arc42 section lives:

| arc42 § | Section                  | Where it lives in this library                                                                                        |
| ------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| 1       | Introduction and goals   | no stub — project-specific narrative                                                                                  |
| 2       | Architecture constraints | no stub — project-specific narrative                                                                                  |
| 3       | Context and scope        | [`01-context-and-scope`](architecture/01-context-and-scope.md)                                                        |
| 4       | Solution strategy        | no stub — project-specific narrative                                                                                  |
| 5       | Building block view      | [`02-container-view`](architecture/02-container-view.md) and [`03-component-view`](architecture/03-component-view.md) |
| 6       | Runtime view             | [`04-runtime-flows`](architecture/04-runtime-flows.md)                                                                |
| 7       | Deployment view          | [`05-deployment-view`](architecture/05-deployment-view.md)                                                            |
| 8       | Crosscutting concepts    | [`08-crosscutting-concepts`](architecture/08-crosscutting-concepts.md)                                                |
| 9       | Architecture decisions   | `adr/` — [`adr`](adr/README.md)                                                                                       |
| 10      | Quality requirements     | [`07-quality-requirements`](architecture/07-quality-requirements.md)                                                  |
| 12      | Glossary                 | [`09-glossary`](architecture/09-glossary.md)                                                                          |

## 3. How to use

1. Pick the template whose family matches the concern you are documenting — the standards table above and the inventory below say which family owns what.
1. Copy the template to its target folder, named in the inventory's **Target location** column.
1. Rename the copy per [`CONVENTIONS.md`](CONVENTIONS.md): family chapters are `NN-kebab-case.md`, ADRs are `NNNN-short-title.md`, and a runbook is named after the single symptom it addresses.
1. Replace every `\<...>` placeholder with real content. No placeholder may survive into review.
1. Delete the sections that do not apply to the document, rather than leaving them empty.
1. Ship the document in the same change as the code it describes (docs-as-code).
1. Keep each family README's Scope cell to an artefact the chapter actually contains; one chapter per standard or arc42 slot.

## 4. Inventory

The table lists stubs only. [`coding-rules`](development/coding-rules/) is a project-defined folder, not a template.

| Family       | Template                                                                          | Target location                                            |
| ------------ | --------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Architecture | [`architecture`](architecture/README.md)                                          | `docs/architecture/` (index)                               |
| Architecture | [`01-context-and-scope`](architecture/01-context-and-scope.md)                    | `docs/architecture/`                                       |
| Architecture | [`02-container-view`](architecture/02-container-view.md)                          | `docs/architecture/`                                       |
| Architecture | [`03-component-view`](architecture/03-component-view.md)                          | `docs/architecture/`                                       |
| Architecture | [`04-runtime-flows`](architecture/04-runtime-flows.md)                            | `docs/architecture/`                                       |
| Architecture | [`05-deployment-view`](architecture/05-deployment-view.md)                        | `docs/architecture/`                                       |
| Architecture | [`06-data-architecture`](architecture/06-data-architecture.md)                    | `docs/architecture/`                                       |
| Architecture | [`07-quality-requirements`](architecture/07-quality-requirements.md)              | `docs/architecture/`                                       |
| Architecture | [`08-crosscutting-concepts`](architecture/08-crosscutting-concepts.md)            | `docs/architecture/`                                       |
| Architecture | [`09-glossary`](architecture/09-glossary.md)                                      | `docs/architecture/`                                       |
| ADR          | [`adr`](adr/README.md)                                                            | `docs/adr/` (index)                                        |
| ADR          | [`template`](adr/template.md)                                                     | `docs/adr/`                                                |
| ADR          | [`0001-record-architecture-decisions`](adr/0001-record-architecture-decisions.md) | `docs/adr/`                                                |
| API          | [`api`](api/README.md)                                                            | `docs/api/` (index)                                        |
| API          | [`openapi`](api/openapi.yaml)                                                     | `docs/api/`                                                |
| API          | [`asyncapi`](api/asyncapi.yaml)                                                   | `docs/api/`                                                |
| API          | [`service`](api/grpc/service.proto)                                               | `docs/api/grpc/`                                           |
| API          | [`error-codes`](api/error-codes.md)                                               | `docs/api/`                                                |
| API          | [`schema`](api/schema.graphql)                                                    | `docs/api/`                                                |
| Development  | [`development`](development/README.md)                                            | `docs/development/` (index)                                |
| Development  | [`local-setup`](development/local-setup.md)                                       | `docs/development/`                                        |
| Development  | [`environment-variables`](development/environment-variables.md)                   | `docs/development/`                                        |
| Development  | [`testing-guide`](development/testing-guide.md)                                   | `docs/development/`                                        |
| Operations   | [`operations`](operations/README.md)                                              | `docs/operations/` (index)                                 |
| Operations   | [`ci-cd-pipeline`](operations/ci-cd-pipeline.md)                                  | `docs/operations/`                                         |
| Operations   | [`monitoring-and-alerts`](operations/monitoring-and-alerts.md)                    | `docs/operations/`                                         |
| Operations   | [`disaster-recovery`](operations/disaster-recovery.md)                            | `docs/operations/`                                         |
| Operations   | [`runbooks`](operations/runbooks/README.md)                                       | `docs/operations/runbooks/` (index)                        |
| Operations   | [`TEMPLATE-runbook`](operations/runbooks/TEMPLATE-runbook.md)                     | `docs/operations/runbooks/`                                |
| Features     | [`features`](features/README.md)                                                  | `docs/features/` (index)                                   |
| Features     | [`feature-doc`](features/feature-doc.md)                                          | `docs/features/<feature>.md` or `docs/features/<feature>/` |

## 5. Conventions

Every template here and every document written from one follows the rules in [`CONVENTIONS.md`](CONVENTIONS.md).
