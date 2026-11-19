# Disaster Recovery

The system keeps almost nothing: one repository, one static build, and a Cloudflare account that
serves the build. There is no database, no schema, and no migration, so there is nothing to restore.
Recovery means rebuilding the previous commit and redeploying it, and the honesty requirement is to
say what has actually been exercised — so far, nothing has.

Scope of this page: what is lost if an asset disappears, what protects it, how the site is brought
back, and what has been proven. Recovering a bad **deploy** is the same rebuild path and lives in
[`ci-cd-pipeline.md`](ci-cd-pipeline.md) §6.

## 1. What can be lost

| Asset                 | Contents                                                      | Regenerable                                          |
| --------------------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| Static site           | Astro and Pagefind output in `apps/web/dist`                  | Yes — `pnpm --filter @blog/web build`                |
| Worker                | The `apps/edge` script, its config, and the asset manifest    | Yes — a rebuild and `cf deploy` from the same commit |
| Repository history    | Every commit, workflow, and document                          | Only from the remote; there is no second copy        |
| Credentials           | `production-edge` secrets and variables; Cloudflare API token | No — must be reissued by a human with account access |
| Custom domain and DNS | The zone and the hostname record in the Cloudflare account    | No — re-created by hand from the account record      |
| Logs                  | Worker invocation records                                     | No — not backed up, and not restorable               |

Everything except the repository history and the credentials is rebuilt from a commit. There is no
asset whose loss is unrecoverable from the repository plus a person with account access.

## 2. How each asset is protected

| Asset              | Protection                                                | Where the copy lives                                | Restore owner                                 |
| ------------------ | --------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------- |
| Static assets      | Rebuild from the repository                               | Any checkout                                        | Anyone who can run the build                  |
| Worker             | Rebuild from the repository                               | Any checkout plus the `production-edge` credentials | Release approver (`production-edge` reviewer) |
| Repository history | The Git remote                                            | GitHub                                              | No documented owner                           |
| Credentials        | GitHub Environment (secrets and variables) and Cloudflare | Those two stores                                    | Cloudflare account admin                      |
| Domain and DNS     | The Cloudflare zone, configured outside this repository   | Cloudflare account                                  | Cloudflare account admin                      |

Two limits follow immediately. The domain record is a platform setting rather than a committed file:
this repository names it in `apps/edge/cloudflare.config.ts`, but does not own the zone, so a lost
account takes the hostname with it. And a rebuild nobody has rehearsed is a hope — see §6, where the
drill log is empty.

## 3. Recovery objectives — not agreed

**RTO and RPO are not yet defined.** No target has been agreed with an owner, none has been measured,
and nothing in this repository records one. Stating a number here would be an aspiration with no
basis.

| Asset class    | RTO                 | RPO                                    | Basis                                                     | Last measured  |
| -------------- | ------------------- | -------------------------------------- | --------------------------------------------------------- | -------------- |
| Static site    | **Not yet defined** | Not applicable — rebuilt from a commit | A build, an approval, and a deploy                        | Never measured |
| Worker config  | **Not yet defined** | Not applicable — rebuilt from a commit | The same deploy restores the script and the configuration | Never measured |
| Credentials    | **Not yet defined** | Not applicable — reissued by a human   | Depends on who holds account access                       | Never measured |
| Domain and DNS | **Not yet defined** | Not applicable — re-created by a human | Depends on who holds the Cloudflare zone                  | Never measured |

What a decision needs before a number can be written: who accepts the impact of the outage, and
whether a rebuild-and-deploy inside the approval gate is fast enough for a site with no stored data.
That is open item 1 in §7.

## 4. Recovery procedure — rebuild and redeploy

**No data is restored anywhere in this procedure**, and there is no maintenance gate to open: a
static site has no write path to freeze. The blast radius is the deployed Worker and its assets, both
replaced together.

1. Declare the incident, record the start time in the incident channel, and name the one person
   performing the recovery. There is no pager and no escalation path, so the declaration is a
   message, not a page.

1. Identify the last known-good commit on `main`:

   ```bash
   git log --oneline -20 -- apps/web apps/edge packages/content
   ```

1. Rebuild that commit locally and prove the artefact before touching production:

   ```bash
   pnpm install --frozen-lockfile
   pnpm --filter @blog/web build
   cd apps/edge && pnpm exec cf build --mode production
   pnpm exec cf deploy --prebuilt --mode production --dry-run
   ```

   Expected: the build exits 0, `apps/web/dist` contains every page, and the dry run validates the
   Build Output without uploading anything.

1. Publish the known-good state by re-running the `deploy-edge` run that deployed that commit (GitHub
   → Actions → `deploy-edge` → **Re-run all jobs**), or by reverting forward on `main` when the bad
   change is the newest commit. Both paths are described in
   [`ci-cd-pipeline.md`](ci-cd-pipeline.md) §6. Do not hand-run `cf deploy` from a workstation: that
   skips the environment's reviewer gate.

1. Confirm the deployed version changed in the Cloudflare dashboard and that the site answers:

   ```bash
   scripts/smoke-static.sh https://<domain>
   ```

   Expected: every check passes. A 404 means the asset upload did not complete; a stale page means the
   deploy never reached the Worker.

1. Watch the invocation records as traffic returns, using the signal set in
   [`monitoring-and-alerts.md`](monitoring-and-alerts.md) §2.

1. Record in §6 the commit actually redeployed, the elapsed time from declaration to verified
   service, and what was missing in the meantime.

## 5. Verification after recovery

| Check                | How                                                             | Pass criterion                                                    |
| -------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------- |
| Page serves          | `GET https://<domain>/vi/`                                      | 200 with the expected locale page                                 |
| Second locale serves | `GET https://<domain>/en/`                                      | 200                                                               |
| Feed serves          | `GET https://<domain>/vi/rss.xml`                               | 200 with well-formed XML                                          |
| Sitemap serves       | `GET https://<domain>/sitemap-index.xml`                        | 200 with both locales present                                     |
| Search index exists  | `GET https://<domain>/pagefind/pagefind.js`                     | 200                                                               |
| Security headers     | `curl -sI https://<domain>/vi/`                                 | `X-Content-Type-Options: nosniff` and the other committed headers |
| Deployed version     | Cloudflare dashboard → Workers & Pages → `blog-edge-production` | Version timestamp matches the redeployed commit's run             |

The header check is worth running explicitly: the Worker exists to add those headers, so a page that
serves 200 without them means the Worker was replaced by a pure-asset path.

## 6. Drills and the declared-disaster log

**No recovery drill is recorded in this repository.** The procedure above has never been executed end
to end, no measured RTO exists, and no rebuild has been compared with the commit that produced it. By
the standard this page sets for itself, the rebuild path is not yet a proven recovery plan.

| Drill                    | Scope                                                                        | Frequency                                           | Evidence                                             | Status    |
| ------------------------ | ---------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------- | --------- |
| Artefact comparison      | Rebuild an older commit and compare `apps/web/dist` with the deployed assets | Proposed: quarterly                                 | File count and a sample page hash                    | Never run |
| Timed recovery rehearsal | Full §4 sequence, timed from declaration to verified service                 | Proposed: before any change that touches the deploy | Measured elapsed time, recorded as the RTO candidate | Never run |
| Domain/TLS check         | Confirm the custom domain, certificate, and redirect behaviour from outside  | Proposed: quarterly                                 | HTTP status and certificate details                  | Never run |

Declared disasters — none to date.

| Date | Incident                      | Declared by | Scope | Commit redeployed | Time to recover | Follow-ups |
| ---- | ----------------------------- | ----------- | ----- | ----------------- | --------------- | ---------- |
| —    | No disaster has been declared | —           | —     | —                 | —               | —          |

## 7. Open items

| #   | Open item                                 | Why it blocks a claim of recoverability                                                                   |
| --- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1   | RTO and RPO not agreed (§3)               | Without a target there is no definition of "recovered", and no drill can pass or fail                     |
| 2   | No recovery owner named (§2)              | A rebuild during an incident would depend on whoever is available                                         |
| 3   | No drill recorded (§6)                    | The procedure is unproven; a first attempt during an outage is the worst time to discover a step is wrong |
| 4   | Repository history has no second copy     | A force-push or a lost remote takes the only rebuild source with it                                       |
| 5   | No automated rollback                     | Every recovery is a human re-run or revert; nothing promotes a previous version automatically             |
| 6   | No alert on a failed deploy               | A stale site is noticed by a reader, not by a monitor                                                     |
| 7   | Domain and DNS are outside the repository | Losing the Cloudflare account loses the hostname, and no committed file restores it                       |

## 8. References

- Deploy rollback and the commit-based recovery path: [`ci-cd-pipeline.md`](ci-cd-pipeline.md).
- Signals after a recovery: [`monitoring-and-alerts.md`](monitoring-and-alerts.md).
- Deploy-failure procedure: [`runbooks/edge-deploy-fails.md`](runbooks/edge-deploy-fails.md).
- Deployment topology and the static asset model: [`architecture/05-deployment-view.md`](../architecture/05-deployment-view.md).
- Conventions: [`CONVENTIONS`](../../templates/CONVENTIONS.md).
