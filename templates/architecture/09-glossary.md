# Glossary

> **When to use:** you need the single authority for the terminology used across the architecture description.
>
> **What it answers:** what each term means here and which source-language term it translates.
>
> Delete this blockquote when filled.

Define a term once, here, and link to it rather than re-explaining it elsewhere. Where a term originates in a language other than English, keep the original term recognisable next to the English so code, tickets, and conversations stay aligned. This chapter covers terminology only; conventions are not repeated here.

## 1. Terms

Delete this note when filled. Framework terms are given so the architecture chapters read consistently; replace the placeholder rows with this system's own terms and delete any framework term the documentation does not use.

| Term             | Definition                                                                       |
| ---------------- | -------------------------------------------------------------------------------- |
| Stakeholder      | A person, role, or organisation with an interest in the system.                  |
| Concern          | An interest a stakeholder wants the architecture to address.                     |
| Building block   | A component the system is decomposed into, from the container level down.        |
| Runtime scenario | A concrete end-to-end sequence that exercises the system under a given stimulus. |
| \<term>          | \<definition, with the code or module it maps to>                                |

## 2. Domain terms requiring translation

List every term that reaches the code from another language. The English term is canonical in code and on the wire; the original term is kept so it stays recognisable to the people who use it.

| Term            | Original term            | Definition                                                       |
| --------------- | ------------------------ | ---------------------------------------------------------------- |
| \<English term> | \<original term, italic> | \<definition, and the code name it maps to>                      |
| \<e.g. Order>   | *\<original term>*       | \<the object a customer purchases, and the code name it maps to> |

## 3. Conventions

Terminology, and nothing else, lives here. Naming, database, logging, and commit conventions have a single authority (the project's [`coding-rules`](../development/coding-rules/) folder) and the wire and API conventions are stated in [the crosscutting concepts chapter](08-crosscutting-concepts.md). Follow them there rather than restating them in a glossary.

## 4. References

- Related docs: [`08-crosscutting-concepts.md`](08-crosscutting-concepts.md), the project's [`coding-rules`](../development/coding-rules/) folder
- Conventions: [`CONVENTIONS`](../CONVENTIONS.md)
