import { Container } from "@cloudflare/containers";

/**
 * Container-backed Durable Object class (D-012, T5.2).
 *
 * `cloudflare.config.ts` wires this class to the `apps/api` Go Fiber image via
 * the `blog-api` Container application:
 *
 *   exports.Api = exports.durableObject({ storage: "sqlite", container: api })
 *   env.API     = bindings.durableObject({ exportName: "Api" })
 *
 * `/api/*` requests reach `src/index.ts`, which forwards them to a single named
 * instance (`"primary"`) of this class; `Container.fetch()` proxies them to the
 * running container on `defaultPort` (8080, matching `apps/api/Dockerfile`).
 */
export interface ApiContainerEnv {
  // Placeholders sourced from the Worker env / secrets at deploy time
  // (SOLUTION.md §E). The container cannot use Worker bindings, so it reaches
  // D1 through the Cloudflare REST API using these values. Contact email is sent
  // by the Worker's `send_email` binding, not the container (D-040).
  CLOUDFLARE_ACCOUNT_ID: string;
  D1_DATABASE_ID: string;
  D1_API_TOKEN: string;
  // CORS allowlist for the Fiber API (T5.5/T6.2); forwarding it keeps the
  // container's allowlist in sync with the deployed origin instead of falling
  // back to its localhost default.
  ALLOWED_ORIGINS: string;
}

/**
 * The `Api` Durable Object defined in `cloudflare.config.ts` `exports`.
 *
 * The class name MUST stay `Api` — it is the `exportName` of the `API`
 * namespace binding and the `exports` key that attaches the `blog-api`
 * container application.
 */
export class Api extends Container<ApiContainerEnv> {
  /** Port the Go Fiber server listens on (`apps/api/Dockerfile` EXPOSE 8080). */
  defaultPort = 8080;

  /**
   * Runtime env pass-through: these Worker vars/secrets are injected into the
   * container when it is started. Only the D1 REST credentials the Go API needs
   * are forwarded — everything else stays in the Worker.
   */
  envVars = {
    CLOUDFLARE_ACCOUNT_ID: this.env.CLOUDFLARE_ACCOUNT_ID ?? "",
    D1_DATABASE_ID: this.env.D1_DATABASE_ID ?? "",
    D1_API_TOKEN: this.env.D1_API_TOKEN ?? "",
    ALLOWED_ORIGINS: this.env.ALLOWED_ORIGINS ?? "",
  };
}
