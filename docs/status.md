# Project Status

Snapshot taken **2026-11-19** on branch `main`. This page answers what is built, what is broken, and what
to do next. The architecture chapters describe the design; this page describes delivery.

## 1. What the project is

A bilingual personal blog and digital garden (`vi` default, `en` secondary). Astro renders every page, feed,
sitemap and the Pagefind index at build time; a thin Cloudflare Worker serves the files and adds security
headers. The site is served entirely from pre-built files; nothing is written at runtime.

## 2. Delivery status

Rows are the delivery sequence, not the phase numbering in [`../phases/`](../phases/README.md).

| Commit(s)                                  | Delivered                                                                     | State                                                               |
| ------------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `7c728a2`                                  | pnpm + Turborepo monorepo, workspace skeletons, shared packages               | Complete                                                            |
| `364fae4`                                  | Affected CI, fork-safe dry run, gitleaks/audit, content-quality gate          | Complete                                                            |
| `dc311a2`                                  | Astro site, bilingual content, feeds, sitemap, Pagefind, pages, design tokens | Complete                                                            |
| `d4d70ce`, `fef41fb`, `ef5484a`, `7eeb877` | Playwright suite, security review, observability runbook                      | Complete                                                            |
| current working tree                       | Mode-matched static deploy, smoke script, simplified reading design, docs     | Pipeline correct; first deploy pending owner config                 |
| —                                          | Preview deploy, production deploy, rollback drill                             | **Blocked** — account id, domain, and token are owner-supplied (Q9) |

## 3. Feature status

| Surface                  | Status                     | Evidence                                                                          |
| ------------------------ | -------------------------- | --------------------------------------------------------------------------------- |
| Static pages (`vi`/`en`) | Works                      | Astro build; e2e root redirect, home, post, language switch                       |
| Content model            | Works                      | Zod schema; 6 MDX files, 3 per locale, 2 published per locale                     |
| Feeds and sitemap        | Works                      | Per-locale RSS 2.0, JSON Feed 1.1, per-tag RSS, root aliases, sitemap             |
| Client-side search       | Works                      | Pagefind postbuild; e2e home → search → post                                      |
| Security headers         | Works in code              | `apps/edge/src/index.ts`; asserted by `scripts/smoke-static.sh` against `cf dev`  |
| Static deploy            | Pipeline correct, not live | Mode-matched build and dry-run exit 0; no placeholder in config; nothing deployed |

## 4. Known defects and gaps

### P0 — blocks a correct production deploy

| ID   | Defect                                                                        | Where               | Effect                                       |
| ---- | ----------------------------------------------------------------------------- | ------------------- | -------------------------------------------- |
| P0-4 | The `production-edge` environment, its variables, and its reviewer must exist | repository settings | The deploy job has no credentials or no gate |

### P1 — hardening and operability

| ID   | Item                                                                             | Where                                      | Effect                                        |
| ---- | -------------------------------------------------------------------------------- | ------------------------------------------ | --------------------------------------------- |
| P1-1 | No alert channel is chosen (`Q-4`)                                               | `docs/operations/monitoring-and-alerts.md` | An outage is noticed by a reader, not a page  |
| P1-2 | Playwright is not run in CI                                                      | `.github/workflows/ci.yml`                 | The static journeys can regress unnoticed     |
| P1-3 | No CSP and no `robots.txt`                                                       | `apps/web/public/`                         | Hardening and crawler guidance are incomplete |
| P1-4 | `lint`/`test` are `echo` stubs in `apps/edge`, `packages/ui`, `packages/content` | those manifests                            | `pnpm check` does not check those workspaces  |
| P1-5 | Branch protection may name checks that never report                              | `.github/BRANCH_PROTECTION.md`             | Merges blocked, or a gate silently absent     |

## 5. First static deploy checklist

1. **Set the `production-edge` environment:** secret `CLOUDFLARE_API_TOKEN`; variables
   `CLOUDFLARE_ACCOUNT_ID`, `SITE_DOMAIN`, `PUBLIC_SITE_URL` (`https://` + `SITE_DOMAIN`); require a reviewer
   and restrict to `main`. Commands: [`./operations/ci-cd-pipeline.md`](./operations/ci-cd-pipeline.md) §4.
2. **Prove the artefact locally:** `PUBLIC_SITE_URL=https://<domain> pnpm turbo run build --filter=@blog/web`,
   then `cd apps/edge && pnpm exec cf build --mode production`, then
   `pnpm exec cf deploy --prebuilt --mode production --dry-run`.
3. **Preview:** deploy `--mode staging` and run `scripts/smoke-static.sh https://<preview-origin>`.
4. **Production:** run the `deploy-edge` workflow (merge or `gh workflow run`), then
   `scripts/smoke-static.sh https://<domain>`.
5. **Rollback drill:** re-run the workflow on the previous good commit and time it against the 10-minute
   budget.
6. **Then** add the uptime check and decide the alert destination.

## 6. VPS option

The build is portable: serve `apps/web/dist` with Nginx or Caddy, preserving the locale, feed, and sitemap
paths, and add the headers in the proxy.
[`./architecture/05-deployment-view.md`](./architecture/05-deployment-view.md) §7 describes it.

## 7. Recommended next steps

1. Phase 4: set the `production-edge` values, deploy preview, then production, then drill the rollback.
2. Add Playwright and the static smoke script to CI.
3. Choose an alert channel; add `robots.txt` and a CSP.

## 8. How to keep this page true

- Update §2 and §3 when a phase closes or a feature changes.
- Remove a P0 row in the same change that fixes it, with the evidence attached; do not renumber.
- Keep the snapshot line current.

## 9. References

- Documentation index: [`./README.md`](./README.md).
- Architecture: [`./architecture/README.md`](./architecture/README.md).
- Deploy and recovery: [`./operations/ci-cd-pipeline.md`](./operations/ci-cd-pipeline.md),
  [`./operations/disaster-recovery.md`](./operations/disaster-recovery.md).
- Decisions: [`./adr/0012-static-site-with-assets-only-worker.md`](./adr/0012-static-site-with-assets-only-worker.md).
