# Runbook: Edge deploy fails or serves a stale build

| Field           | Value                                                                                                     |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| Service         | `blog-edge-production` — the `apps/edge` Worker and the static assets it serves                           |
| Owner           | Repository owner                                                                                          |
| Last reviewed   | 2026-11-19                                                                                                |
| Escalation path | None yet — no pager or on-call rotation; see [`../monitoring-and-alerts.md`](../monitoring-and-alerts.md) |

## 1. Alert

| Field                | Value                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| Alert name           | Not yet defined; the signal is a failed run or a site serving an older build                      |
| Metric and threshold | `deploy-edge` workflow conclusion, or the deployed version timestamp not advancing after a merge  |
| Appears in           | GitHub → Actions → `deploy-edge`; Cloudflare dashboard → Workers & Pages → `blog-edge-production` |
| Typical error text   | A build failure, `mode` mismatch on a prebuilt artifact, or an asset path that does not exist     |
| User-visible effect  | Readers see the previous build, or a failed asset request                                         |

## 2. Severity

| Impact                                      | Urgency        | Severity | Who is paged |
| ------------------------------------------- | -------------- | -------- | ------------ |
| Site down or serving broken HTML            | Immediate      | Critical | Nobody yet   |
| Deploy failed, previous build still serving | Within the day | High     | Nobody yet   |
| Deploy succeeded but assets look stale      | Within the day | Warning  | Nobody yet   |

- Declare an incident when the live site is failing, not merely stale.
- Do not re-run the deploy repeatedly before reading the build output: `cf` can exit 0 after a partial
  failure.

## 3. Triage

Run every command from the repository root.

| Check | Command | Expected when healthy | If it differs |
| --------------------------------------- | ------------------------------------------------------------ | -------------------------------------------- | -------------------------------------------------- | ---------------------------------------- |
| Does the artefact build? | `pnpm --filter @blog/web build` | exit 0; `apps/web/dist` exists | Fix the build error; nothing else matters yet |
| Does the edge build accept the assets? | `cd apps/edge && pnpm exec cf build --mode production` | exit 0, no credentials | Check the asset directory in `wrangler.config.ts` |
| Does the dry-run accept the artefact? | `pnpm exec cf deploy --prebuilt --mode production --dry-run` | exit 0, no upload | A mode mismatch means the build and deploy modes differ; rebuild with the deploy's mode |
| Is the record consistent? | `rg -n "mode\|prebuilt" .github/workflows/deploy-edge.yml` | build and deploy use the same mode | Fix the workflow, not the CLI invocation |
| Is the account and domain resolved? | `rg -n "SITE_DOMAIN\|CLOUDFLARE_ACCOUNT_ID" apps/edge/cloudflare.config.ts .github/workflows/deploy-edge.yml` | both read from the environment | Set the missing `production-edge` variable; no placeholder remains in the config |
| Did the deploy target the right commit? | `git rev-parse HEAD`, then read the workflow run | same commit | Re-run from the intended commit |

## 4. Mitigation

**Blast radius:** redeploying replaces the whole site for every reader for the duration of the upload.

1. Stop the failing rollout. Do not deploy a locally built artefact from a workstation.

1. Redeploy the previous known-good commit through the workflow:

   ```bash
   git revert --no-commit <bad-commit> && git commit -m "revert: bad static deploy"
   # open a PR, merge it, and let the deploy job run
   ```

1. Verify the site, not the pipeline:

   ```bash
   scripts/smoke-static.sh https://<domain>
   ```

   Expected: every check passes — statuses, feeds, sitemap, headers, canonical origin, and 404 behaviour.

1. If mitigation does not hold within 15 minutes, keep the previous version serving and fix forward in a PR.

## 5. Root-cause fix

| Question                  | Answer                                                                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Root cause                | State the defect, not the symptom: for example a missing `SITE_DOMAIN`, an empty `PUBLIC_SITE_URL`, or a build made in another mode     |
| Durable fix               | The workflow/config change that removes it; the mode pair and the origin are owned by [`../ci-cd-pipeline.md`](../ci-cd-pipeline.md) §3 |
| Tracked in                | [`../ci-cd-pipeline.md`](../ci-cd-pipeline.md) §6, [`../../status.md`](../../status.md) §4                                              |
| Test that would catch it  | A dry-run in CI on every PR, plus `scripts/smoke-static.sh` after every deploy                                                          |
| Alert or threshold change | Add an uptime check on `/vi/` and one feed, with a named alert destination                                                              |
| Follow-up                 | Update this runbook after any incident that uses it                                                                                     |

## 6. References

- Pipeline: [`../ci-cd-pipeline.md`](../ci-cd-pipeline.md).
- Monitoring: [`../monitoring-and-alerts.md`](../monitoring-and-alerts.md).
- Rollback target and recovery: [`../disaster-recovery.md`](../disaster-recovery.md).
- Runbook naming and structure: [`README.md`](README.md).
