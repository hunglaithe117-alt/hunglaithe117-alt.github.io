# API Contract Templates

> **When to use:** a service exposes or consumes a machine-readable interface (REST, an event stream, GraphQL, or an internal gRPC call) and the contract must live beside the code rather than in a separate document.
>
> **What it answers:** which standard describes each interface, who consumes each artifact, and the rules every contract file must hold.
>
> Delete this blockquote when filled.

These are the copy-and-fill contract skeletons for the system's interfaces. The workstream is **contract-first**: the specification is the source of truth, reference UIs and client SDKs are generated from it, and no interface is documented by hand in a Word or Excel file. The rationale and the full standard list are in the [library index](../README.md); a filled copy lands in the project's `docs/api/`.

## Artifacts

| File                               | Standard                            | Scope                                                              | Consumers                                                 |
| ---------------------------------- | ----------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------- |
| [`openapi.yaml`](openapi.yaml)     | OpenAPI 3.1                         | REST/HTTP endpoints, request and response schemas, bearer JWT auth | Web and mobile clients, API gateway, Swagger UI and Redoc |
| [`asyncapi.yaml`](asyncapi.yaml)   | AsyncAPI 3.1                        | Events and messages published and consumed on the broker           | Producers, consumers, AsyncAPI Studio                     |
| [`service`](grpc/service.proto)    | Protobuf 3 / gRPC                   | Internal service-to-service calls, unary and server-streaming      | Internal services, generated client and server stubs      |
| [`schema.graphql`](schema.graphql) | GraphQL SDL                         | GraphQL type system, queries, and mutations                        | GraphQL clients and the federation gateway                |
| [`error-codes.md`](error-codes.md) | RFC 9457 `application/problem+json` | The system-wide error codes and their HTTP status                  | Every surface; the single authority for codes             |

## Rules

- **Syntax is checked; protocol validity is not.** Every `.yaml` file parses via the pre-commit `check-yaml` hook, which checks YAML syntax only and passes an invalid spec. Protocol validity is checked manually with the protocol's own validator at review — `openapi-spec-validator` for OpenAPI, the AsyncAPI parser for AsyncAPI.
- **Spec before implementation.** Change the artifact first, so the diff is the review artifact and the generated client follows the spec, not the other way around.
- **A breaking change needs an ADR.** Removing a field, changing a type, or tightening a constraint is architectural; record it with [`adr`](../adr/README.md) before the change lands.
- **One authority for codes.** [`error-codes.md`](error-codes.md) is the single authority for error codes and their HTTP status, per [`CONVENTIONS`](../CONVENTIONS.md) §12. Other files reference a code; none restates the table.
- **A diagram-free family.** These files are machine-readable text. No Mermaid fence belongs here — the interaction and sequence views live in [`04-runtime-flows`](../architecture/04-runtime-flows.md).

## How to add a contract

1. Copy the skeleton that matches the protocol into `docs/api/`, keeping the fixed top-level filename for the family: `openapi.yaml`, `asyncapi.yaml`, or `error-codes.md`. The gRPC stub is `service.proto`; the copy goes to `docs/api/grpc/<service>.proto`, one file per service (for example `user_service.proto`).
1. Replace every fill-me-in slot. The placeholder form required for each position is defined in [`CONVENTIONS`](../CONVENTIONS.md) §1. No placeholder survives into review.
1. Validate before proposing the change: the YAML files must load, and the proto and SDL files must parse.
1. Register the artifact with the reference UI (Swagger UI, Redoc, or AsyncAPI Studio) if the team runs one; the UI renders the file, so nothing is transcribed by hand.
1. Ship the contract in the same change as the code it describes.

## Conventions

Every template here and every document written from one follows [`CONVENTIONS`](../CONVENTIONS.md).
