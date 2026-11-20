/**
 * Restore full CMS bodies from the read-only Webflow export.
 *
 * The Phase 3 extractor wrote frontmatter only; bodies were filled in by hand
 * and are incomplete. This script extracts the complete `w-richtext` block
 * from each source detail page, converts it to Markdown, maps CDN image URLs
 * to their localized paths, and overwrites only the body of each existing
 * content entry (frontmatter is preserved verbatim).
 *
 * Run from app/: `node scripts/extract-richtext-bodies.mjs`
 * Idempotent: re-running produces identical files.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const ROOT = new URL("../../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const APP = join(ROOT, "app");

const CONTENT = join(APP, "src", "content");

const ASSET_MAP = JSON.parse(readFileSync(join(APP, "scripts", "asset-map.json"), "utf8"));

function decode(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&rsquo;|&lsquo;|[\u2018\u2019]/g, "'")
    .replace(/&quot;|&rdquo;|&ldquo;|[\u201c\u201d]/g, '"')
    .replace(/&mdash;|[\u2014]/g, "—")
    .replace(/&ndash;|[\u2013]/g, "–")
    .replace(/&nbsp;/g, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\u00e2\u0080\u0099/g, "'")
    .replace(/\u00e2\u0080\u009c|\u00e2\u0080\u009d/g, '"')
    .replace(/\u00e2\u0080\u0094/g, "—")
    .split("")
    .filter((ch) => ch.charCodeAt(0) >= 32 || ch === "\n")
    .join("")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function imagePath(src) {
  if (ASSET_MAP[src]) return ASSET_MAP[src];

  const name = decodeURIComponent((src.split("/").pop() || "").replace(/%20/g, " "));

  const candidate = `/assets/img/${name}`;

  return existsSync(join(APP, "public", candidate.slice(1))) ? candidate : src;
}

function extractRichtext(html) {
  const start = html.indexOf("w-richtext");

  if (start === -1) return "";

  const open = html.indexOf(">", start);

  if (open === -1) return "";

  let depth = 1;

  let i = open + 1;

  const re = /<\/?div\b[^>]*>/g;

  re.lastIndex = i;

  let match;

  while ((match = re.exec(html)) !== null) {
    if (match[0].startsWith("</")) depth -= 1;
    else depth += 1;

    if (depth === 0) return html.slice(open + 1, match.index);
  }

  return "";
}

function markdown(body) {
  let out = "";

  const block = /<(h[1-6]|p|ul|blockquote|figure)\b[^>]*>([\s\S]*?)<\/\1>/gi;

  let last = 0;

  let match;

  while ((match = block.exec(body)) !== null) {
    const between = body.slice(last, match.index).trim();

    if (between) {
      const standalone = [...between.matchAll(/<img\b[^>]*src="([^"]+)"[^>]*alt="([^"]*)"|<img\b[^>]*alt="([^"]*)"[^>]*src="([^"]+)"/gi)];

      for (const img of standalone) {
        const src = img[1] || img[4];

        const alt = decode(img[2] || img[3] || "");

        out += `\n![${alt}](${imagePath(src)})\n`;
      }
    }

    const tag = match[1].toLowerCase();

    const inner = match[2];

    if (/^h[1-6]$/.test(tag)) {
      const level = Number(tag[1]);

      out += `\n${"#".repeat(level)} ${decode(inner)}\n`;
    } else if (tag === "p") {
      const text = decode(inner);

      if (text) out += `\n${text}\n`;
    } else if (tag === "ul" || tag === "ol") {
      const items = [...inner.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => decode(m[1]));

      out += "\n" + items.map((item) => `- ${item}`).join("\n") + "\n";
    } else if (tag === "blockquote") {
      out += `\n> ${decode(inner)}\n`;
    } else if (tag === "figure") {
      const src = inner.match(/src="([^"]+)"/)?.[1];

      const alt = decode(inner.match(/alt="([^"]*)"/)?.[1] || "");

      if (src) out += `\n![${alt}](${imagePath(src)})\n`;
    }

    last = match.index + match[0].length;
  }

  return out.replace(/\n{3,}/g, "\n\n").trim();
}

function rewriteBody(mdFile, body) {
  const original = readFileSync(mdFile, "utf8");

  const end = original.indexOf("\n---");

  if (end === -1) throw new Error(`No frontmatter in ${mdFile}`);

  const frontmatter = original.slice(0, end + 4);

  writeFileSync(mdFile, `${frontmatter}\n\n${body}\n`, "utf8");
}

const folders = [
  ["services", "services"],
  ["portfolio", "portfolio"],
  ["blog-posts", "posts"],
  ["team", "team"],
];

let count = 0;

for (const [sourceFolder, collection] of folders) {
  const htmlDir = join(ROOT, sourceFolder);

  const mdDir = join(CONTENT, collection);

  for (const file of readdirSync(htmlDir).filter((f) => f.endsWith(".html"))) {
    const slug = basename(file, ".html");

    const mdFile = join(mdDir, `${slug}.md`);

    if (!existsSync(mdFile)) continue;

    const html = readFileSync(join(htmlDir, file), "utf8");

    const richtext = extractRichtext(html);

    const body = markdown(richtext);

    if (!body) continue;

    rewriteBody(mdFile, body);

    count += 1;

    console.log(`${collection}/${slug}.md  (${body.length} chars)`);
  }
}

console.log(`Restored full source bodies in ${count} content entries.`);
