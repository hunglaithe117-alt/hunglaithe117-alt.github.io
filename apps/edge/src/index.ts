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
 * The container validates + stores the contact row only; this Worker owns the
 * contact notification and sends it through the `send_email` binding (`env.EMAIL`)
 * after a 2xx response (D-040, store-only fallback).
 *
 * The `Api` Durable Object class (a `Container` subclass from
 * `@cloudflare/containers`) lives in `./api-container.ts` and is re-exported
 * below; the named export must match the `exports.Api` key and the `API`
 * binding's `exportName` in `cloudflare.config.ts`.
 */
export { Api } from "./api-container.ts";

// Placeholder contact-notification addresses; real values are supplied at deploy
// time. `CONTACT_TO` mirrors the `EMAIL` binding's placeholder recipient in
// cloudflare.config.ts.
const CONTACT_TO = "owner@example.com";
const CONTACT_FROM = "no-reply@example.com";

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

/** Contact fields the notification email is built from. */
interface ContactFields {
  name: string;
  email: string;
  body: string;
}

async function forwardToContainer(request: Request, env: EdgeBindings): Promise<Response> {
  const namespace = env.API;
  if (!namespace) {
    return Response.json({ error: "API container is not bound" }, { status: 503 });
  }

  const id = namespace.idFromName("primary");
  const stub = namespace.get(id);

  const url = new URL(request.url);
  const isContactSubmit = request.method === "POST" && url.pathname === "/api/contact";
  // Snapshot the contact fields from a *clone*: reading the clone leaves the
  // body stream forwarded to the container untouched. Parse failures are
  // non-fatal — the container still performs validation.
  const contact = isContactSubmit ? await parseContact(request.clone()) : null;

  const response = await stub.fetch(request);

  // The container stored the D1 row; we send the notification. A failed send
  // keeps the stored row and still returns the container's success response
  // (store-only fallback, T5.4 / D-040).
  if (isContactSubmit && contact && response.ok) {
    await sendContactNotification(env, contact);
  }

  return response;
}

/** Parses the contact payload, returning null when it is missing/malformed. */
async function parseContact(request: Request): Promise<ContactFields | null> {
  try {
    const data = (await request.json()) as Partial<Record<keyof ContactFields, unknown>>;
    const name = typeof data.name === "string" ? data.name.trim() : "";
    const email = typeof data.email === "string" ? data.email.trim() : "";
    const body = typeof data.body === "string" ? data.body.trim() : "";
    if (!name || !email || !body) return null;
    return { name, email, body };
  } catch {
    return null;
  }
}

/**
 * Sends the contact notification through the `send_email` binding. The binding
 * requires at least one of `text`/`html`; errors (e.g. sender not verified) are
 * swallowed so the request still succeeds (store-only fallback).
 */
async function sendContactNotification(env: EdgeBindings, contact: ContactFields): Promise<void> {
  if (!env.EMAIL) return;
  try {
    await env.EMAIL.send({
      from: CONTACT_FROM,
      to: CONTACT_TO,
      replyTo: contact.email,
      subject: `New contact message from ${contact.name}`,
      text: `${contact.body}\n\n— ${contact.name} <${contact.email}>`,
    });
  } catch (error) {
    console.error("contact notification failed; row remains stored", error);
  }
}
