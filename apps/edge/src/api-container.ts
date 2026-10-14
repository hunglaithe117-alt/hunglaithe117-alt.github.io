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
  // D1 + Email through the Cloudflare REST API using these values.
  CLOUDFLARE_ACCOUNT_ID: string;
  D1_DATABASE_ID: string;
  D1_API_TOKEN: string;
  EMAIL_API_TOKEN: string;
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
   * container when it is started. Only the D1 + Email REST credentials the
   * Go API needs are forwarded — everything else stays in the Worker.
   */
  envVars = {
    CLOUDFLARE_ACCOUNT_ID: this.env.CLOUDFLARE_ACCOUNT_ID ?? "",
    D1_DATABASE_ID: this.env.D1_DATABASE_ID ?? "",
    D1_API_TOKEN: this.env.D1_API_TOKEN ?? "",
    EMAIL_API_TOKEN: this.env.EMAIL_API_TOKEN ?? "",
  };
}
