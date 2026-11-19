---
phase: 4
name: launch
domain: devops
depth: L2
status: blocked_on_owner_config
depends_on: [phase-3-static-deploy]
plan_review: approved
plan_revision_approved: 3
approved_by: "repository owner (chat: continue with phase 3 and 4)"
approved_at: "2026-11-19"
exit_criteria_met: false
blocked_by: "Q9 — Cloudflare account id, production domain, and API token are owner-supplied"
---

# Phase 4 — Preview, production, rollback drill

## 1. Goal

Deploy the static build to a preview origin, prove the reading surface, then put it on the production
domain and prove a rollback. No data is written, so the only risk is serving the wrong files.

## 2. Rollout

```text
build -> deploy preview (workers.dev) -> pages/feeds/sitemap/search/headers/404
      -> deploy production domain -> same checks -> 30 min watch -> close
Decision: any failed check stops the rollout.
```

## 3. Tasks

| ID   | Task                                                | Blocking | Touches                             |
| ---- | --------------------------------------------------- | -------- | ----------------------------------- |
| T4.1 | Deploy preview and run the smoke set                | YES      | preview Worker                      |
| T4.2 | Deploy production, drill rollback, close the record | YES      | production Worker, `docs/status.md` |

## 4. Exit criteria

- Preview and production serve `/vi/`, `/en/`, posts, tags, about, search, both feeds, and the sitemap.
- Canonical URLs name the environment's own origin.
- Security headers are present on a page response.
- Unknown paths return the 404 page with status 404.
- A rollback to the previous commit's build completes within 10 minutes and serves again.
- `docs/status.md` matches the deployed state; no P0 row is closed without an observation.

## 5. Verification budget

| Claim                | Check                                               | Cap    |
| -------------------- | --------------------------------------------------- | ------ |
| The site is complete | `curl -I` on each route class + feed/sitemap bodies | 30 min |
| Search works         | browser query on the preview/production origin      | 15 min |
| Headers are on       | `curl -sI` shows HSTS and `X-Content-Type-Options`  | 10 min |
| Rollback works       | timed redeploy of the previous build                | 30 min |

## 6. Risks and rollback

- A stale DNS cache can show the previous version after a correct deploy; verify by response body, not by
  memory.
- Rolling back assets is a redeploy; no schema or data is involved.
- A preview that accidentally claims the production domain blocks the production deploy; fix config, not DNS.

## 7. Review questions

1. Which hostname should the preview use, and should it be public? — **Answered: the Worker's
   `workers.dev` origin, public.** The build is the same artefact; a non-production mode claims no custom
   domain, so preview cannot shadow production.
2. Who approves the production window? — **Answered: the repository owner**, through the
   `production-edge` environment's required reviewer. The workflow cannot deploy without that approval.

## 8. Status — blocked, with the launch kit ready

Both tasks are blocked on one input the owner deferred (Q9): the Cloudflare account id, the production
domain, and an API token. Nothing in this phase can be executed without them, so the phase stops here
instead of reporting a launch that did not happen.

Ready and verified locally:

| Item                                    | Where                                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------------------- |
| Smoke set (routes, feeds, headers, 404) | [`../../scripts/smoke-static.sh`](../../scripts/smoke-static.sh)                            |
| Smoke run against the real Worker       | `cf dev` on `:8788`, 22/22 checks passed (task memory T4.1)                                 |
| Preview and production commands         | [`../../docs/operations/ci-cd-pipeline.md`](../../docs/operations/ci-cd-pipeline.md) §3, §5 |
| Rollback command and budget             | same page §3.4; 10-minute budget                                                            |
| Fill-in checklist for the four values   | same page §4                                                                                |

To unblock, in order:

1. Set the four values (commands in `ci-cd-pipeline.md` §4).
2. Deploy `--mode staging`, run the smoke set against the `workers.dev` origin.
3. Run the workflow on `main`, run the smoke set against the domain.
4. Drill the rollback, then update `docs/status.md` §2–§4 from the observations.

## 9. References

- Plan: [`../README.md`](../README.md). Pipeline: [`../../docs/operations/ci-cd-pipeline.md`](../../docs/operations/ci-cd-pipeline.md).
