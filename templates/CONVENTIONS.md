# Template & Documentation Conventions

> The binding rules for every template in this library and for every document written from one. A document that breaks a rule here is a defect, not a style preference.

These conventions apply to the copy-and-fill stubs under [`templates`](README.md) and to the documents produced from them. They are what makes a filled document reviewable, diffable, and machine-checkable.

## 1. Placeholder syntax

A fill-me-in slot is written one of four ways, according to where it sits. The rule is not cosmetic: each renderer treats angle brackets differently, so the same `<Placeholder>` can render in one context and vanish in another.

- **Prose, headings, tables, and lists** — write `\<Placeholder>`, a backslash-escaped `<`. A GFM renderer or an MDX build otherwise reads the angle brackets as the start of an HTML or JSX tag, so the placeholder is dropped or the page breaks. Example: replace \<System Name> with the product's name.
- **Inside a code span** (backticks): write `<Placeholder>` with **no backslash**. CommonMark processes no backslash escapes inside a code span, so `` `\<System Name>` `` renders with a visible backslash, while the brackets themselves are inert there. Example: `` `<System Name>` ``, a proper noun the reader must substitute.
- **Inside a `mermaid` code fence**: write `«Placeholder»` using guillemets, **never angular** `<Placeholder>`. Mermaid v11 parses `<...>` inside a flowchart or graph label (node text, subgraph titles, edge labels, and `accDescr`) as an HTML tag and silently discards it, leaving an empty label under both `securityLevel: strict` and `loose`. Sequence-diagram text survives, but the rule is uniform across every mermaid diagram. Keep a literal `<br/>` as-is: it is a real tag Mermaid renders. Example: `Client->>API: «Service Name»`.
- **Non-Markdown files** (YAML, proto, GraphQL SDL, JSON) need no backslash escaping — nothing renders them as HTML, and they sit outside the §1.1 guard and `mdformat`. **But** a placeholder in a **spec-constrained position** (a map key, component name, operation id, channel key, enum value, identifier, or URI) must be written as the **valid identifier or value it will become**, marked with a `# TODO: replace` comment (or the file's own comment syntax). Free-text values such as descriptions and titles may keep `<...>`. The in-family precedent is [`service`](api/grpc/service.proto) and [`schema`](api/schema.graphql): both use real identifiers plus a header comment asking the reader to rename them.

The escape is a rendering concern, not a Markdown-formatting one: `mdformat` passes `\<X>`, `<X>`, and even `<Unescaped Name>` through unchanged, so it can never flag a missing backslash.

A placeholder must never be left in a published document. Before review, every `\<...>` is either replaced with real content or the section around it is deleted.

### 1.1 Enforcement guard

`mdformat` cannot enforce the escape, so a grep check is the guard. **The guard covers `*.md` files only:** a non-Markdown template is never rendered as HTML and is never processed by `mdformat`, so it is governed by the fourth bullet of §1 rather than by this check. In `*.md` files the guard flags all three of:

- `[^\\]<[A-Za-z][^>]*>` — an unescaped angle-bracket placeholder **outside** code spans and code fences;
- `<[A-Za-z][^>]*>` — an angular placeholder **inside** a `mermaid` fence, where guillemets are required instead;
- a backslash immediately inside a code span (`` `\< ``) — the escape that would render literally in that context.

**One sanctioned false positive.** This document and [`README.md`](README.md) must be able to *show* the prose form (`\<Placeholder>`) and the guard pattern itself (`` `\< ``), so the third check always reports a handful of hits in those two files. Every such hit there is documentation of the rule, not a violation — exclude `CONVENTIONS.md` and `README.md` from the third check, or ignore them explicitly when triaging.

**This guard is not wired into pre-commit or CI by default.** Run the check manually until the project wires it in; do not assume it is enforced.

## 2. File naming

- **Family chapters** use `NN-kebab-case.md`: a two-digit, zero-padded ordinal, ordered within the family — `01-context-and-scope.md`, `07-quality-requirements.md`.
- **Replicated chapters** use `NN<letter>-<slug>.md`: the ordinal of the chapter they sit beside, a lowercase letter, and a kebab-case slug — `03b-orders-component-view.md` is a second component view beside `03-component-view.md`. The letter suffix lets a unit that repeats a chapter (a second component view, a second runtime flow) keep the ordinal without renumbering the family, and without breaking the single `NN-kebab-case.md` rule.
- **ADRs** use `NNNN-short-title.md`: a four-digit, zero-padded sequence and a short kebab-case title that names the decision — `0001-record-architecture-decisions.md`, `0007-adopt-nats-jetstream.md`.
- **Runbooks** are named after the single symptom they address, in kebab-case — `database-connection-pool-exhausted.md`, not after the fix.
- The template's own filename is the canonical stub name: this library's index links each template by exactly that name (for example [`feature-doc.md`](features/feature-doc.md)). Do not invent aliases or synonyms for a stub. When you copy one, rename the copy per the rules above and leave the template in place.
- The runbook stub keeps a deliberate `TEMPLATE-` prefix (`TEMPLATE-runbook.md`): runbooks are otherwise named after the symptom they address, so the prefix is what marks this file as the stub rather than an incident playbook.

## 3. Immutability

- An accepted ADR is never edited in its body. A change of decision creates a new ADR; the only edit allowed to the old record is its status line, which becomes `Superseded by ADR-NNNN`. The new ADR is `Accepted` and its body names `Supersedes ADR-NNNN`.
- Every other document is a living document: edit it in place as the system changes.

## 4. Diagrams as code

- Diagrams are Mermaid fenced code blocks, tagged `mermaid`, and nothing else. A diagram is text in the diff so a change to it is reviewable like any other change.
- A binary screenshot or exported image may be committed only when its editable source is checked in beside it:
  - editable diagram sources live in `docs/assets/diagrams/` (`.mmd`, `.drawio`, `.excalidraw`, `.puml`, `.dsl`);
  - rendered diagram exports (`.svg`, `.png`) stay beside their source in `docs/assets/diagrams/`;
  - screenshots and logos live in `docs/assets/images/`.
- Prefer Mermaid to an image. An image with no checked-in source is not accepted in review.

## 5. Language

- The body text is English.
- Keep a translated domain term recognisable where it maps to code — the original term and its code name, for example *\<original term>* → `\<CodeName>`.
- Terminology has one authority, named in §12 — the project's own glossary. Do not coin a second name for a term it already defines.

## 6. Formatting

- Every `.md` file must survive `mdformat` with the GFM and frontmatter extensions (the pre-commit hook):
  - ATX headings (`#`, `##`), never Setext underlines;
  - `-` for bullets, never `*` or `+`;
  - pipe tables with a header separator row;
  - fenced code blocks with an explicit language tag;
  - exactly one trailing newline, and no trailing whitespace.
- Every `.yaml` file must be valid YAML; the pre-commit `check-yaml` hook enforces this.
- A reference to code names the file, in a code span — `backend/src/module/service.py`. Add no line number and no range: the line moves with every edit, and the claim is about the file, not about where it happens to sit.
- Keep a YAML frontmatter block, when a document has one, in the form `mdformat-frontmatter` expects, so the hook formats the body and leaves the block intact.

## 7. Links

- Use relative links only. Do not use absolute URLs or repository-root paths for in-repository targets.
- A link to a heading must match the generated slug: lowercase the heading, drop every character that is not a letter, digit, space, or hyphen, then turn each space into a hyphen. `## 1. Placeholder syntax` becomes `#1-placeholder-syntax`, and `## Version — Overview` becomes `#version--overview`; the em dash is dropped and its two neighbouring spaces become two hyphens. When in doubt, copy the anchor from the rendered page rather than reconstructing it.
- Every link must resolve. The library index links templates that may not exist yet; each link must resolve before it is published.

## 8. One concern per file

- Each file answers exactly one need; keep the four quadrants apart in one file:
  - **tutorial** — learning-oriented: a lesson that takes a newcomer to a working result;
  - **how-to** — task-oriented: a recipe that assumes competence and completes one job;
  - **reference** — information-oriented: the interfaces and facts, consulted rather than read;
  - **explanation** — understanding-oriented: the why behind the shape of the system.
- Feature narrative belongs in a feature doc; step-by-step recovery belongs in a runbook; the machine-readable contract belongs in the schema file. When a document starts answering a second concern, split it.

## 9. Docs-as-code

- Documentation changes ship in the same change as the code they describe. A behaviour change without its documentation change is an incomplete change.
- Docs live beside the source in the project repository, are reviewed as Markdown, and are never maintained in a separate system.

## 10. Template structure

A template opens with exactly one guidance blockquote. Its standard shape is multi-line:

> **When to use:** the situation that calls for this document.
>
> **What it answers:** the questions the document resolves.
>
> Delete this blockquote when filled.

Use this shape in every template. It replaces the single-line "Use this template for arc42 §N…" form the arc42 chapters currently carry.

- **Only the top blockquote is guidance.** Everything below it is content to fill; a filled copy drops the top blockquote and keeps the rest.
- **A non-Markdown template opens with a comment block, not a blockquote.** YAML, proto, GraphQL SDL, and JSON templates carry their single top guidance header in the file's own comment syntax — `#` for YAML and GraphQL SDL, `//` for proto. There is still exactly one guidance header, at the top; the syntax differs because those files have no blockquote.
- **In-section guidance is marked so a filled copy carries none.** Guidance that sits inside a content section rather than the top blockquote opens with one of two markers, chosen by whether the surrounding section survives a filled copy:
  - **"Delete this note when filled."** — the guidance is a note *inside* a section that stays; a filled copy drops the note and keeps the section. Use it above a mandatory runbook section or a variable catalogue.
  - **"Delete this section when filled."** — the guidance *is* a disposable section; a filled copy drops the whole section.
- The test is one question: would a filled document still need this section? If yes, the guidance is a **note**; if no, it is a **section**. Both markers mark guidance for removal alike, whether it is section-level prose or a row-level note above a catalogue or table.

## 11. Section shape

- **Scope.** The numbered-heading shape below applies to **content documents**: the chapters and guides written from these templates. A **project** index or README page is unnumbered, carrying plain headings such as `## Chapters`: [`architecture`](architecture/README.md) is unnumbered while every chapter it indexes is numbered. The library's own meta-documents ([`templates`](README.md) and [`CONVENTIONS.md`](CONVENTIONS.md)) are not project content and may use numbered sections.
- A content document uses numbered `## N.` headings, one-based and in order.
- A content document closes with a final `## N. References` section. The one exception is an **ADR record**: it closes with `## N. Links`, MADR's own section name, not `References`.

The convention binds every content document even where an existing chapter has neither, so the library converges on one shape rather than inheriting each chapter's original layout.

## 12. One authority per rule

A rule has exactly one authoritative home. Every other file links to that home (or points at it) and never restates the rule: a restated rule drifts out of sync, and a reader cannot tell which copy wins. Family pages and READMEs carry **pointers** to a home, not restatements of it.

The known homes:

- **Runbook naming** — §2 of this file.
- **ADR immutability** — §3 of this file.
- **Markdown and documentation formatting** — §6 of this file. Source-code formatting belongs to the project's [`coding-rules`](development/coding-rules/) folder.
- **Terminology** — the project's glossary chapter. The project names its own file; this library does not.
- **The error-code catalogue** — [`error-codes`](api/error-codes.md).

Files such as [`08-crosscutting-concepts`](architecture/08-crosscutting-concepts.md) link to the authority instead of restating it.
