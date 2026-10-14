import { bindings, defineConfig, defineContainer, exports, triggers } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

/**
 * apps/edge — Cloudflare integration Worker (D-012).
 *
 * One deploy ships four things:
 *   1. the Astro `apps/web/dist` build as Workers Static Assets,
 *   2. the `/api/*` route to the `apps/api` Go Fiber Container,
 *   3. the D1 and Email Service bindings,
 *   4. the custom domain + fetch trigger.
 *
 * Two-file config (D-036): the static-asset *directory*
 * (`assetsDirectory: "../web/dist"`) lives in the sibling
 * `wrangler.config.ts`; `cloudflare.config.ts` may only carry runtime-only
 * `worker.assets` options. Do NOT add `assets.directory` here.
 *
 * Environment blocks do NOT merge — the factory returns one complete config per
 * `--mode`, so previews and production can use different names/resources.
 *
 * No credentials are committed: `accountId` and the D1 id are placeholders
 * sourced from `CLOUDFLARE_ACCOUNT_ID` / Terraform at deploy time
 * (SOLUTION.md §E); secrets arrive via `cf deploy --secrets-file`.
 */

// The Go Fiber API image (apps/api/Dockerfile). `instanceType: "lite"` and a
// low `maxInstances` keep the instance-time bill small (T5.2 risk notes).
const api = defineContainer({
  name: "blog-api",
  image: { dockerfile: "../api/Dockerfile" },
  instanceType: "lite",
  maxInstances: 3,
});

export default defineConfig(({ mode, isPreview }) => {
  const isProd = mode === "production" || mode === undefined;
  const workerName = isPreview ? `blog-edge-preview-${mode}` : `blog-edge-${mode ?? "prod"}`;

  return {
    // Replace with the real account id at deploy time (or set
    // CLOUDFLARE_ACCOUNT_ID); kept as a placeholder — never a secret.
    accountId: "<ACCOUNT_ID>",
    containers: [api],
    worker: {
      name: workerName,
      entrypoint,
      compatibilityDate: "2026-10-02",
      compatibilityFlags: ["nodejs_compat"],

      // Runtime-only asset routing: `/api` + `/api/*` run the Worker first
      // (which forwards them to the container); everything else is served from
      // the static assets. The directory itself is in wrangler.config.ts (D-036).
      assets: {
        runWorkerFirst: ["/api", "/api/*"],
        notFoundHandling: "404-page",
      },

      // Production custom domain (placeholder — DNS lives on Cloudflare per D-018).
      domains: ["example.com"],

      env: {
        // Static-asset fetcher, used to serve fall-through requests.
        ASSETS: bindings.assets(),
        // D1 database — id is a placeholder; resolve via `cf d1 list` at deploy.
        DB: bindings.d1({
          name: isProd ? "blog-prod" : "blog-staging",
          id: "<D1_DATABASE_ID>",
        }),
        // Cloudflare Email Service binding used by the contact endpoint. The
        // Worker owns the send (the container is store-only, D-040); the
        // placeholder recipient mirrors `CONTACT_TO` in src/index.ts.
        EMAIL: bindings.sendEmail({ destinationAddress: "owner@example.com" }),
        // Public API base exposed to the client islands.
        PUBLIC_API_BASE_URL: bindings.text(
          isProd ? "https://example.com" : "https://blog-edge-staging.workers.dev",
        ),
        // CORS allowlist forwarded to the container (T5.5/T6.2). Without this
        // the API falls back to its localhost default, silently breaking
        // cross-origin calls from previews/staging. Never "*"; the API rejects a
        // wildcard at startup (apps/api/internal/config/config.go).
        ALLOWED_ORIGINS: bindings.text(
          isProd ? "https://example.com" : `https://${workerName}.workers.dev`,
        ),
        // Signing secret for contact tokens; supplied via --secrets-file.
        SESSION_SECRET: bindings.secret(),

        // Container env pass-through (see src/api-container.ts `envVars`). The
        // Go API reaches D1 over the Cloudflare REST API, so it needs the account
        // id, the D1 id and a scoped token. Ids are placeholders resolved at
        // deploy time; the token arrives via --secrets-file and is never
        // committed. Contact email is sent by the Worker, not the container
        // (D-040), so no email token is forwarded.
        CLOUDFLARE_ACCOUNT_ID: bindings.text("<ACCOUNT_ID>"),
        D1_DATABASE_ID: bindings.text("<D1_DATABASE_ID>"),
        D1_API_TOKEN: bindings.secret(),

        // Durable Object namespace exposing the container instance to the
        // Worker's fetch handler (so it can forward /api/* requests).
        API: bindings.durableObject({ worker: workerName, exportName: "Api" }),
      },

      // The container-backed Durable Object class (storage: sqlite).
      exports: {
        Api: exports.durableObject({ storage: "sqlite", container: api }),
      },

      triggers: [triggers.fetch({ pattern: "example.com/api/*" })],

      // Observability (T6.3): Workers Logs + invocation logs at 100% head
      // sampling (a low-traffic personal blog — full fidelity is cheap). Query
      // strings are redacted so tracking params / emails forwarded in a URL are
      // never persisted. Analytics and uptime live at the account level (see
      // docs/runbook.md); no client-side tracker is injected.
      observability: {
        enabled: true,
        headSamplingRate: 1,
        redactQueryString: true,
        logs: { enabled: true, invocationLogs: true, headSamplingRate: 1 },
      },
    },
  };
});
