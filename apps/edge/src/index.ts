import type { EdgeBindings } from "@blog/types";

/**
 * apps/edge Worker entrypoint (D-012).
 *
 * `worker.assets.runWorkerFirst: ["/api", "/api/*"]` (cloudflare.config.ts) sends
 * those paths here; everything else falls through to Workers Static Assets.
 *
 * `/api/*` is forwarded to the `apps/api` Go Fiber Container through the
 * container-backed Durable Object namespace (`env.API`). A single stable
 * instance name ("primary") keeps all API traffic on one warm container.
 *
 * The `Api` Durable Object class (a `Container` subclass from
 * `@cloudflare/containers`) lives in `./api-container.ts` and is re-exported
 * below; the named export must match the `exports.Api` key and the `API`
 * binding's `exportName` in `cloudflare.config.ts`.
 */
export { Api } from "./api-container.ts";
export default {
  async fetch(request: Request, env: EdgeBindings, _ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/api" || pathname.startsWith("/api/")) {
      return forwardToContainer(request, env);
    }

    // Static assets (Astro `apps/web/dist`) for every other path.
    return env.ASSETS.fetch(request);
  },
};

async function forwardToContainer(request: Request, env: EdgeBindings): Promise<Response> {
  const namespace = env.API;
  if (!namespace) {
    return Response.json({ error: "API container is not bound" }, { status: 503 });
  }

  const id = namespace.idFromName("primary");
  const stub = namespace.get(id);
  return stub.fetch(request);
}
