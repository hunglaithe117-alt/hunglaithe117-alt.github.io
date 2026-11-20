import { bindings, defineConfig } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

/**
 * apps/edge — Cloudflare Worker that serves the Astro `apps/web/dist` build as
 * Workers Static Assets and attaches security headers (`src/index.ts`).
 *
 * Two-file config (D-036): the static-asset *directory*
 * (`assetsDirectory: "../web/dist"`) lives in the sibling
 * `wrangler.config.ts`; `cloudflare.config.ts` may only carry runtime-only
 * `worker.assets` options. Do NOT add `assets.directory` here.
 *
 * Environment blocks do NOT merge — the factory returns one complete config per
 * `--mode`, so previews and production can use different names/resources.
 *
 * No account id or hostname is committed (SOLUTION.md §E). Both are read from
 * the environment, so the same commit deploys to any account and any domain:
 *   * `CLOUDFLARE_ACCOUNT_ID` — resolved by `cf` itself (CI variable, or
 *     `apps/edge/.env.production` locally); `cf build` records it in the Build
 *     Output, and `cf deploy --prebuilt` must see the same value.
 *   * `SITE_DOMAIN` — the production hostname claimed as a custom domain.
 */
export default defineConfig(({ mode, isPreview }) => {
  // Strict: a mode-less build is a different artefact from `--mode production`,
  // and the deploy rejects the mismatch (P0-1). Never treat `undefined` as
  // production, so a forgotten `--mode` cannot claim the production domain.
  const isProd = mode === "production";
  const workerName = isPreview
    ? `blog-preview-${mode}`
    : isProd
      ? "blog"
      : `blog-${mode ?? "default"}`;

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const siteDomain = process.env.SITE_DOMAIN;

  return {
    // Omitted when unset so a credential-free dry run still evaluates; `cf`
    // then resolves the account from `CLOUDFLARE_ACCOUNT_ID` or `cf auth login`.
    ...(accountId ? { accountId } : {}),
    worker: {
      name: workerName,
      entrypoint,
      compatibilityDate: "2026-10-02",
      compatibilityFlags: ["nodejs_compat"],

      // `runWorkerFirst: ["/"]` sends only the root path through this Worker for
      // an instant HTTP 302 locale redirect; static assets and HTML pages are
      // served directly by Cloudflare Static Assets with headers from `_headers`.
      assets: {
        runWorkerFirst: ["/"],
        notFoundHandling: "404-page",
      },

      // The production custom domain, claimed only when both the mode and the
      // hostname say production (D-004). Preview deployments keep their
      // workers.dev URL and never touch the production zone.
      ...(isProd && siteDomain ? { domains: [siteDomain] } : {}),

      env: {
        // Static-asset fetcher, used to serve every request.
        ASSETS: bindings.assets(),
      },

      // Observability (T6.3): Workers Logs + invocation logs at 100% head
      // sampling (a low-traffic personal blog — full fidelity is cheap). Query
      // strings are redacted so tracking params forwarded in a URL are never
      // persisted. Analytics and uptime live at the account level; the Worker
      // injects no client-side tracker.
      observability: {
        enabled: true,
        headSamplingRate: 1,
        redactQueryString: true,
        logs: { enabled: true, invocationLogs: true, headSamplingRate: 1 },
      },
    },
  };
});
