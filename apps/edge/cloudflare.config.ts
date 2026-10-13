import { bindings, defineConfig } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

/**
 * Placeholder Worker config (no accountId literal, no containers yet).
 * `assetsDirectory` (the static-asset source) lives in the sibling
 * `wrangler.config.ts` because `cloudflare.config.ts` cannot set it (D-036).
 */
export default defineConfig(() => ({
  worker: {
    name: "blog-edge",
    entrypoint,
    compatibilityDate: "2026-10-02",
    compatibilityFlags: ["nodejs_compat"],
    // Runtime-only asset routing. The asset *directory* is supplied by the sibling
    // `wrangler.config.ts` (D-036) — it cannot be set here.
    assets: { notFoundHandling: "404-page", runWorkerFirst: ["/api", "/api/*"] },
    env: {
      // `ASSETS` binding (the `worker.assets` field is config, not a binding).
      ASSETS: bindings.assets(),
      DB: bindings.d1({ name: "blog-dev", id: "00000000-0000-0000-0000-000000000000" }),
      EMAIL: bindings.sendEmail({}),
      PUBLIC_API_BASE_URL: bindings.text("http://localhost:8787"),
      SESSION_SECRET: bindings.secret(),
    },
  },
}));
