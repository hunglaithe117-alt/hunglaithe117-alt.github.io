import type {
  D1Database,
  DurableObjectNamespace,
  Fetcher,
  SendEmail,
} from "@cloudflare/workers-types";

/**
 * Single source of truth for the API contract shared by apps/web, apps/edge
 * and apps/api (SOLUTION.md §B, §D).
 */

/** `GET /api/views/:slug` success payload. */
export interface ViewResponse {
  slug: string;
  count: number;
}

/** `POST /api/contact` request body. */
export interface ContactRequest {
  name: string;
  email: string;
  body: string;
}

/** `POST /api/contact` success payload. */
export interface ContactResponse {
  id: string;
  ok: boolean;
}

/** Uniform error payload returned by every `/api/*` route. */
export interface ApiError {
  error: string;
}

/**
 * Cloudflare bindings + vars available to the `apps/edge` Worker.
 * Keep aligned with `cloudflare.config.ts` `worker.env` keys (T5.x).
 */
export interface EdgeBindings {
  /** Static-assets binding (`bindings.assets()`), serving `apps/web/dist`. */
  ASSETS: Fetcher;
  /** D1 database binding. */
  DB: D1Database;
  /** Cloudflare Email Service `send_email` binding. */
  EMAIL: SendEmail;
  /** Public base URL of the API, exposed to the client. */
  PUBLIC_API_BASE_URL: string;
  /** Secret used to sign session/contact tokens. */
  SESSION_SECRET: string;
  /**
   * Durable Object namespace exposing the container-backed `Api` class, used by
   * the Worker to forward `/api/*` requests to the Go Fiber container.
   */
  API: DurableObjectNamespace;
}

/** The `/api/*` route surface, keyed by `METHOD path`. */
export interface ApiRoutes {
  "GET /api/views/:slug": {
    params: { slug: string };
    response: ViewResponse | ApiError;
  };
  "POST /api/contact": {
    body: ContactRequest;
    response: ContactResponse | ApiError;
  };
}
