/**
 * Phase 3 content extraction — reads the raw Webflow export (read-only) and
 * writes Astro Content Collection entries to app/src/content/<collection>/.
 * Run from app/: `node scripts/extract-content.mjs`
 * Idempotent: re-running overwrites generated files with the same content.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";

const ROOT = new URL("../../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const APP = join(ROOT, "app");

const OUT = join(APP, "src", "content");

const TITLE_SUFFIX = " - Archipro - Webflow HTML website template";

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&quot;|&rdquo;|&ldquo;/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function yamlString(value) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function stripTags(html) {
  return decodeEntities(html);
}

function firstMatch(html, regex) {
  const match = html.match(regex);

  return match ? match[1] : "";
}

function heroImage(html, name) {
  const images = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);

  const raster = images.filter((tag) => {
    const src = firstMatch(tag, /src="([^"]+)"/);
    const alt = firstMatch(tag, /alt="([^"]*)"/);

    if (!src.includes("cdn.prod.website-files.com")) return false;

    if (!/\.(jpe?g|png|webp|avif)/i.test(src)) return false;

    if (/icon|logo|favicon|webclip|avatar/i.test(alt)) return false;

    if (name && alt.trim() !== name) return false;

    return true;
  });

  // Webflow's primary content images carry class="image …"; avatars/icons don't
  return (
    raster.find((tag) => /class="[^"]*\bimage\b/.test(tag)) ??
    raster[0] ??
    ""
  ).match(/src="([^"]+)"/)?.[1] ?? "";
}

function bodyAfter(html, marker) {
  const index = html.indexOf(marker);

  return index === -1 ? html : html.slice(index);
}

function teamRoles() {
  const index = readFileSync(join(ROOT, "company-pages", "team.html"), "utf8");
  const roles = {};

  for (const match of index.matchAll(/href="\/team\/([\w-]+)"(?:(?!<\/a>).)*?display-2 text-neutral-200">([^<]+)</gs)) {
    // role sits in `.display-2.text-neutral-200` right after the member name
    roles[match[1]] = stripTags(match[2]);
  }

  return roles;
}

function writeEntry(collection, slug, fields, body = "") {
  const dir = join(OUT, collection);
  mkdirSync(dir, { recursive: true });
  const lines = ["---"];

  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);

      for (const item of value) lines.push(`  - ${yamlString(item)}`);
    } else if (Number.isFinite(value)) {
      lines.push(`${key}: ${value}`);
    } else if (value !== "") {
      lines.push(`${key}: ${yamlString(value)}`);
    }
  }

  lines.push("---", "", body, "");
  writeFileSync(join(dir, `${slug}.md`), lines.join("\n"), "utf8");

  return `${collection}/${slug}.md`;
}

const written = [];

function extract(folder, collection, map) {
  const dir = join(ROOT, folder);

  for (const [index, file] of readdirSync(dir).filter((f) => f.endsWith(".html")).entries()) {
    const slug = basename(file, ".html");
    const html = readFileSync(join(dir, file), "utf8");
    const titleTag = decodeEntities(firstMatch(html, /<title>([^<]*)<\/title>/)).replace(TITLE_SUFFIX, "");
    const description = decodeEntities(firstMatch(html, /<meta content="([^"]*)" name="description"/));
    const h1 = decodeEntities(firstMatch(html, /<h1[^>]*>([^<]*)<\/h1>/));
    written.push(writeEntry(collection, slug, map({ html, slug, titleTag, description, h1 }, index)));
  }
}

// services (15)
extract("services", "services", ({ html, titleTag, description, h1 }, i) => ({
  title: h1 || titleTag,
  excerpt: description,
  image: heroImage(bodyAfter(html, "<main")),
  order: i,
}));

// portfolio (4)
extract("portfolio", "portfolio", ({ html, titleTag, description, h1 }) => {
  const gallery = [
    ...new Set(
      [...bodyAfter(html, "<main").matchAll(/src="(https:\/\/cdn\.prod\.website-files\.com\/[^"]+\.(?:jpe?g|png|webp))"/g)]
        .values()
        .map((m) => m[1])
        .filter((src) => !/icon|logo|brix|customize-your-webflow/i.test(src))
        .toArray(),
    ),
  ];

  return { title: h1 || titleTag, description, heroImage: gallery[0] ?? "", gallery };
});

// posts (7)
extract("blog-posts", "posts", ({ html, titleTag, description, h1 }) => ({
  title: h1 || titleTag,
  excerpt: description,
  date: firstMatch(html, /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}, \d{4})/),
  category: decodeEntities(firstMatch(html, /badge[^>]*><div>([^<]*)<\/div>/)),
  heroImage: heroImage(bodyAfter(html, "<main")),
}));

// categories (3)
extract("blog-categories", "categories", ({ titleTag, description, h1 }) => ({
  title: h1 || titleTag,
  description,
}));

// team (8) — name from <title>, photo alt = name, role from the team index
const roles = teamRoles();

extract("team", "team", ({ html, slug, titleTag, description }) => ({
  name: titleTag,
  role: roles[slug] ?? "",
  bio: description,
  photo: heroImage(html, titleTag),
}));

console.log(`Wrote ${written.length} entries:`);

for (const file of written) console.log(`  ${file}`);
