# Architecture Decision Records

An Architecture Decision Record captures one decision and its rationale: the context that forced it, the option chosen, and the consequences accepted. This folder is the durable record — a decision not written here is not recoverable from the code alone, because the code shows the outcome and never the alternatives it beat. The format follows MADR.

The records below were reconstructed on 2026-11-19. The code has cited decision IDs (`D-013`, `D-036`, `D-040`, …) since the first phase, but the documents that assigned them — `SOLUTION.md`, `TOOLCHAIN-VERIFIED.md` — are not in the repository; the later plan packet lives under `phases/`. Each ADR therefore states what the implementation shows and marks its rationale as inferred; none invents a meeting, a participant, or an option that the code does not exclude.

## Index

Every ADR gets a row, kept sorted by ID and updated in the same change that adds the record.

| ID   | Title                                            | Status                 | Date       | Supersedes / Superseded by  |
| ---- | ------------------------------------------------ | ---------------------- | ---------- | --------------------------- |
| 0001 | Record architecture decisions                    | Accepted               | 2026-11-19 | —                           |
| 0002 | Monorepo with pnpm workspaces and Turborepo      | Accepted               | 2026-10-14 | —                           |
| 0003 | Astro static SSG with Vue islands                | Accepted               | 2026-10-14 | —                           |
| 0004 | Bilingual content with folder-per-locale posts   | Accepted               | 2026-10-14 | —                           |
| 0005 | Cloudflare Worker owns static assets and the API | Superseded by ADR-0012 | 2026-10-14 | Superseded by ADR-0012      |
| 0006 | Go Fiber API on Cloudflare Containers            | Superseded by ADR-0012 | 2026-10-14 | Superseded by ADR-0012      |
| 0007 | D1 as the system of record                       | Superseded by ADR-0012 | 2026-10-14 | Superseded by ADR-0012      |
| 0008 | Store-only contact messages                      | Superseded by ADR-0011 | 2026-10-14 | Superseded by ADR-0011      |
| 0009 | Affected CI with a content-quality gate          | Accepted               | 2026-10-14 | —                           |
| 0010 | Observability with Workers Logs and `slog`       | Accepted               | 2026-10-14 | —                           |
| 0011 | Remove the contact feature                       | Accepted               | 2026-11-19 | Supersedes ADR-0008         |
| 0012 | Static site with an assets-only Worker           | Accepted               | 2026-11-19 | Supersedes 0005, 0006, 0007 |

## Conventions

This index carries status; the rules themselves have a single home and are not restated here.

- File naming, the status lifecycle, and ADR immutability — [`templates/adr/README.md`](../../templates/adr/README.md) and [`templates/CONVENTIONS.md`](../../templates/CONVENTIONS.md) §2 and §3.
- Document formatting and section shape — [`templates/CONVENTIONS.md`](../../templates/CONVENTIONS.md) §6 and §11.
- One authority per rule or decision — [`templates/CONVENTIONS.md`](../../templates/CONVENTIONS.md) §12.

## Adding an ADR

1. Copy [`template.md`](template.md) to `NNNN-short-title.md`, taking the next free number.
2. Fill every section; delete the guidance lines and any section that does not apply.
3. Add a row to the [index](#index) with the record's ID, title, status, date, and supersession link (`Supersedes ADR-NNNN`, or a dash if none).
4. Ship the ADR in the same change as the code it describes.

An `Accepted` record is immutable in its body. A changed decision is a new ADR that names what it supersedes; the old record only has its status edited.
