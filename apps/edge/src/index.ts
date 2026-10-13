import type { EdgeBindings } from "@blog/types";

/**
 * Placeholder edge Worker entrypoint.
 * Real asset serving + `/api/*` routing to the Go container arrives in Phase 5 (T5.1).
 */
export default {
  async fetch(request: Request, _env: EdgeBindings): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname.startsWith("/api/")) {
      return Response.json({ error: "API not implemented until Phase 5" }, { status: 501 });
    }

    return new Response("Not implemented until Phase 3", { status: 501 });
  },
};
