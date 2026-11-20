/**
 * Build-time Open Graph cards: one 1200×630 PNG per published post, written to
 * `public/og/<lang>/<slug>.png`. Runs before `astro build`, so the files are copied
 * with the rest of `public/`. A post that declares a `cover` keeps using it.
 *
 * Titles are drawn as SVG text; the generic `sans-serif` family resolves to a
 * Vietnamese-capable face on macOS and Linux alike.
 */
import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const postsRoot = join(here, "../../../packages/content/posts");
const outRoot = join(here, "../public/og");

const WIDTH = 1200;
const HEIGHT = 630;
const PAD = 96;

const escape = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Greedy wrap on spaces; the reading size assumes ~26 characters per line. */
function wrap(text, perLine = 26, maxLines = 3) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > perLine && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

function field(source, name) {
  const match = new RegExp(`^${name}:\\s*(.+)$`, "m").exec(source);
  if (!match) return undefined;
  return match[1].trim().replace(/^["']|["']$/g, "");
}

function card({ title, date, lang, site }) {
  const lines = wrap(title);
  const size = lines.length > 2 ? 56 : 64;
  const lineHeight = size * 1.2;
  const firstY = 330 - ((lines.length - 1) * lineHeight) / 2;
  const titleSpans = lines
    .map(
      (line, index) =>
        `<text x="${PAD}" y="${firstY + index * lineHeight}" font-family="sans-serif" font-size="${size}" font-weight="700" fill="#201c18">${escape(line)}</text>`,
    )
    .join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#fcfcf9"/>
  <text x="${PAD}" y="120" font-family="sans-serif" font-size="28" fill="#6b665f">${escape(site)}</text>
  ${titleSpans}
  <line x1="${PAD}" y1="${HEIGHT - 150}" x2="${WIDTH - PAD}" y2="${HEIGHT - 150}" stroke="#ddd9d3" stroke-width="2"/>
  <text x="${PAD}" y="${HEIGHT - 96}" font-family="sans-serif" font-size="26" fill="#6b665f">${escape(date)} · ${lang.toUpperCase()}</text>
</svg>`;
}

const site = "Chuquanpho29";
let written = 0;

for (const lang of ["vi", "en"]) {
  let files;
  try {
    files = readdirSync(join(postsRoot, lang));
  } catch {
    continue;
  }
  mkdirSync(join(outRoot, lang), { recursive: true });

  for (const file of files) {
    const match = /\.mdx?$/.exec(file);
    if (!match) continue;
    const source = readFileSync(join(postsRoot, lang, file), "utf8");
    if (field(source, "draft") === "true") continue;
    const title = field(source, "title");
    if (!title) continue;

    const slug = file.slice(0, match.index);
    const date = field(source, "date") ?? "";
    const svg = card({ title, date, lang, site });
    await sharp(Buffer.from(svg))
      .png({ compressionLevel: 9 })
      .toFile(join(outRoot, lang, `${slug}.png`));
    written += 1;
  }
}

console.log(`og cards: ${written} written to public/og/`);
