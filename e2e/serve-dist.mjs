/**
 * Minimal, dependency-free static file server for the pre-built Astro site
 * (`apps/web/dist`). Used by `playwright.config.ts` `webServer` so the E2E suite
 * runs fully offline against the real static output.
 *
 * Why not `astro preview`? Astro 7's preview command auto-detaches into a
 * background daemon when stdin/stdout is not a TTY (which is always the case
 * under Playwright), which makes process-lifecycle handling racy. This server is
 * a single foreground process Playwright can start and stop deterministically.
 *
 * It emulates the clean-URL behaviour of a static host:
 *   /en/posts/hello-world  ->  <root>/en/posts/hello-world/index.html
 *   /en/about              ->  <root>/en/about/index.html
 *   missing                ->  <root>/404.html with HTTP 404
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../apps/web/dist", import.meta.url)));
const port = Number(process.env.PORT ?? 4321);
const host = process.env.HOST ?? "127.0.0.1";

if (!existsSync(root)) {
  console.error(
    `e2e static server: build output not found at ${root}\n` +
      "Run `pnpm --filter @blog/web build` before the E2E suite.",
  );
  process.exit(1);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

/** Map a request path to an on-disk file, or a 404 fallback. */
function resolveFile(urlPath) {
  let clean;
  try {
    clean = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  } catch {
    return null;
  }
  const candidate = resolve(root, "." + normalize(clean));
  // Contain traversal: every served file must live under the dist root.
  if (candidate !== root && !candidate.startsWith(root + sep)) return null;

  if (existsSync(candidate)) {
    if (statSync(candidate).isDirectory()) {
      const index = join(candidate, "index.html");
      if (existsSync(index)) return { file: index, status: 200 };
    } else {
      return { file: candidate, status: 200 };
    }
  }
  const asHtml = `${candidate}.html`;
  if (existsSync(asHtml)) return { file: asHtml, status: 200 };

  const notFound = join(root, "404.html");
  if (existsSync(notFound)) return { file: notFound, status: 404 };
  return null;
}

const server = createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "content-type": "text/plain" });
    res.end("Method Not Allowed");
    return;
  }
  const match = resolveFile(req.url ?? "/");
  if (!match) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not Found");
    return;
  }
  const headers = {
    "content-type": MIME[extname(match.file).toLowerCase()] ?? "application/octet-stream",
    "cache-control": "no-cache",
  };
  res.writeHead(match.status, headers);
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  createReadStream(match.file).pipe(res);
});

server.listen(port, host, () => {
  // Playwright waits on the URL; this log is for humans running it by hand.
  console.log(`e2e static server: http://${host}:${port} -> ${root}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
