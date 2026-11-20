# Operations

How `blog_personal` is delivered, watched, and recovered. The system is a static Astro build served by a
thin Cloudflare Worker; there is no container, database, or runtime secret, so the operating surface
is small and the remaining gaps are stated rather than filled with convention.

## Pages

| Page                                                   | Answers                                                                                                   | Read it when                                          |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| [`cloudflare-setup.md`](cloudflare-setup.md)           | The first-time Cloudflare setup, step by step: account id, token, environment, preview, domain, analytics | You are deploying for the first time                  |
| [`ci-cd-pipeline.md`](ci-cd-pipeline.md)               | What CI and the deploy do, which credentials they need, and what is still stale                           | You are changing or running the pipeline              |
| [`monitoring-and-alerts.md`](monitoring-and-alerts.md) | Which signals exist, how to read them, and what is not monitored                                          | Something looks wrong, or you are defining uptime     |
| [`disaster-recovery.md`](disaster-recovery.md)         | What can be lost (nothing at runtime), how to redeploy an earlier build, and what is unproven             | A deploy failed, or the site serves the wrong version |

## Runbooks

| Runbook                                                          | Symptom                                                                     |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [`runbooks/edge-deploy-fails.md`](runbooks/edge-deploy-fails.md) | The deploy job fails, or it succeeds and the site still serves an old build |

## Known gaps

| Gap                      | Consequence                                                     | Where it is tracked                                       |
| ------------------------ | --------------------------------------------------------------- | --------------------------------------------------------- |
| No alert channel (`Q-4`) | A failed deploy or an outage is noticed by a reader, not a page | [`monitoring-and-alerts.md`](monitoring-and-alerts.md) §4 |
| Playwright is not in CI  | The browser journeys can regress unnoticed                      | [`../status.md`](../status.md)                            |
| No CSP, no `robots.txt`  | Hardening and crawler guidance are incomplete                   | [`../status.md`](../status.md)                            |
| Rollback not yet drilled | The 10-minute target is a plan, not a measurement               | [`disaster-recovery.md`](disaster-recovery.md) §5         |

## References

- System shape: [`../architecture/05-deployment-view.md`](../architecture/05-deployment-view.md).
- Retirement decision: [`../adr/0012-static-site-with-assets-only-worker.md`](../adr/0012-static-site-with-assets-only-worker.md).
- Conventions: [`../../templates/CONVENTIONS.md`](../../templates/CONVENTIONS.md).
