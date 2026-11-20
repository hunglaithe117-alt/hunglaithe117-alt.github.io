/**
 * apps/edge Worker entrypoint (D-012).
 *
 * The Worker runs for every request (`runWorkerFirst: ["/*"]` in
 * `cloudflare.config.ts`) so it can attach security headers, then delegates to
 * Workers Static Assets (`apps/web/dist`).
 */

/** Bindings available to the fetch handler. */
interface Env {
  /** Static-asset fetcher backed by the `apps/web/dist` upload. */
  ASSETS: Fetcher;
}

/**
 * Security headers applied to every response (T6.2). Additive only — a header
 * the asset response already carries wins, so a stricter CSP added later is not
 * clobbered. HSTS is unconditional: the Worker only ever runs behind Cloudflare TLS.
 */
const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

/** HTTP statuses that must not carry a response body. */
function isNullBodyStatus(status: number): boolean {
  return status === 204 || status === 205 || status === 304;
}

/** Returns a copy of `response` with the conservative security headers added. */
function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(name)) headers.set(name, value);
  }
  return new Response(isNullBodyStatus(response.status) ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    return withSecurityHeaders(await env.ASSETS.fetch(request));
  },
};
