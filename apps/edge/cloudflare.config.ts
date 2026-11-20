import { bindings, defineConfig } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

/**
 * Cloudflare Worker serving `apps/web/dist` via Workers Static Assets.
 * Static-asset directory lives in `wrangler.config.ts`; this file holds runtime options.
 * Account ID and custom domain are read from `CLOUDFLARE_ACCOUNT_ID` and `SITE_DOMAIN`.
 */
export default defineConfig(({ mode, isPreview }) => {
  // Require explicit `--mode production` so mode-less builds never claim production.
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

      // Static assets and HTML pages are served directly with headers from `_headers`.
      assets: {
        runWorkerFirst: ["/"],
        notFoundHandling: "404-page",
      },

      // Claim custom domain only in production when `SITE_DOMAIN` is set.
      ...(isProd && siteDomain ? { domains: [siteDomain] } : {}),

      env: {
        ASSETS: bindings.assets(),
      },

      // Full-fidelity Workers Logs with query strings redacted; no client-side tracker.
      observability: {
        enabled: true,
        headSamplingRate: 1,
        redactQueryString: true,
        logs: { enabled: true, invocationLogs: true, headSamplingRate: 1 },
      },
    },
  };
});
