# Open questions

## Answered

### Q1 — Remove email only, or the contact feature? (2026-11-19: option B)

Removed the whole contact feature. Implemented and accepted in Phase 1 (ADR-0011).

### Q2 — Remove the view counter and retire the backend? (2026-11-19: yes)

The site becomes fully static. `apps/api`, the container, D1 usage, and Go tooling are removed.

### Q3 — Where does the static site deploy? (2026-11-19: Cloudflare Workers assets)

Keep `apps/edge` as a thin asset Worker; no container, no Durable Object.

### Q6 — Was a real D1 database ever provisioned? (2026-11-19: no)

No database is needed and none was provisioned. Nothing is exported; the local migrations were deleted
with `apps/api`. The repository has no D1 binding, no migration, and no `/api/*` route left.

### Q7 — Old `/api/*` paths (2026-11-19: accepted)

Every `/api/*` URL returns 404. No client calls them: the built HTML contains no `/api/` reference, and the
smoke set asserts the 404.

### Q8 — Thin Worker or pure assets? (2026-11-19: thin Worker)

The Worker stays so the security headers remain in code (`apps/edge/src/index.ts`). Assets are still served
from the asset binding; the Worker adds the headers on the way through.

### Q9 — Account id and domain (2026-11-19: owner supplies later)

Deferred by the owner: "anything about config I will fill later". No value is committed. Both are read from
the environment (`CLOUDFLARE_ACCOUNT_ID`, `SITE_DOMAIN`), and `PUBLIC_SITE_URL` must equal
`https://` + `SITE_DOMAIN`. Phase 3 is complete without them; Phase 4 is blocked until they exist.
Fill-in commands: [`../docs/operations/ci-cd-pipeline.md`](../docs/operations/ci-cd-pipeline.md) §4.

## Open

None. The next question is the owner's first-deploy window, which Phase 4 records when it happens.
