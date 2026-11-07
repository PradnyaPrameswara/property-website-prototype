#!/usr/bin/env node
/** Development-only importer of selected original assets from immutable HTML. */
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const importMode = process.argv.includes("--download");

const allowed = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".svg"]);

const selected = [
  ["home-pages/home-v1.html", "68894269d79943dcb4fbee77_designing-places-archipro-webflow-template.png"],
  ["home-pages/home-v1.html", "688942340e598afe2c3207bf_hero-linear-bg-archipro-webflow-template.png"],
  ["home-pages/home-v1.html", "688a5b011779274c81245d83_inside-firm-archipro-webflow-template.jpg"],
  ["home-pages/home-v1.html", "688a50ccb8be7acefbef0b1b_exterior-design-archipro-webflow-template.png"],
  ["home-pages/home-v1.html", "688a50cbfbe8559898958990_construction-archipro-webflow-template.png"],
  ["home-pages/home-v1.html", "688a50cc8c4226dcdd1fe747_decoration-archipro-webflow-template.png"],
  ["home-pages/home-v2.html", "688a93b259161daf15717fec_cozy-seating-area-archipro-webflow-template.png"],
  ["company-pages/about.html", "688bd943c34df2b494161ec7_scenic-mountain-terrace-archipro-webflow-template.jpg"],
  ["company-pages/about.html", "689236ac5b61c147e4a4a8b3_inside-the-firm-archipro-webflow-template.jpg"],
  ["company-pages/about.html", "68923500f2996c45c70b924f_heart-icon-archipro-webflow-template.svg"],
  ["company-pages/about.html", "6883dda4eac60697f741f8c5_couch-icon-archipro-webflow-template.svg"],
  ["company-pages/about.html", "68923500740745ee512937c0_user-icon-archipro-webflow-template.svg"],
  ["company-pages/about.html", "68923500b759f4bedda504a0_lightbulb-icon-archipro-webflow-template.svg"],
  ["company-pages/about.html", "68923500e8af7fe380307475_plant-icon-archipro-webflow-template.svg"],
  ["company-pages/about.html", "689235002dc5cf80340e4de9_check-icon-archipro-webflow-template.svg"],
  ["company-pages/about.html", "6890c4e8a2c26923a14b0ec3_new-york-archipro-webflow-template.png"],
  ["company-pages/about.html", "6890c4e823680e8f3da558f4_amsterdam-archipro-webflow-template.png"],
  ["company-pages/about.html", "6890c4e8bb449e828fb0404a_london-archipro-webflow-template.png"],
  ["company-pages/about.html", "6890c4e7531b467e094035cf_ottawa-archipro-webflow-template.png"],
  ["home-pages/home-v3.html", "688b9d50b83ea2f28adb8d92_modern-mountain-house-archipro-webflow-template.jpg"],
  ["home-pages/home-v2.html", "688a8f736ba3faadf02781f4_minimalist-bedroom-hero-archipro-webflow-template.png"],
  ["home-pages/home-v2.html", "688a8f73c7632f2e0ff7b0b3_modern-living-room-hero-archipro-webflow-template.png"],
  ["home-pages/home-v2.html", "688a8f734866d06a9c67bd1d_wooden-dining-table-hero-archipro-webflow-template.png"],
  ["home-pages/home-v2.html", "688a8f7371c3c0dcf19aa5a7_minimalist-bathroom-hero-archipro-webflow-template.png"],
  ["home-pages/home-v1.html", "6883d9dcf978a79188aaafeb_vireon-logo-company-archipro-webflow-template.svg"],
  ["home-pages/home-v1.html", "6883d9dc8be2d0a7690019e7_linkora-logo-company-archipro-webflow-template.svg"],
  ["home-pages/home-v1.html", "6883d9dc74f4793a5b09b481_converra-logo-company-archipro-webflow-template.svg"],
  ["home-pages/home-v1.html", "6883d9dc0175aafefd64b4f6_nexora-logo-company-archipro-webflow-template.svg"],
  ["home-pages/home-v1.html", "6883d9dc31f0406c374e6c3f_syncell-logo-company-archipro-webflow-template.svg"],
  ["home-pages/home-v1.html", "6883d9dc48a8579a5efd16f3_socium-logo-company-archipro-webflow-template.svg"],
  ["home-pages/home-v1.html", "6883d9dc4717347feac9ab9b_bridgr-logo-company-archipro-webflow-template.svg"],
  ["home-pages/home-v1.html", "6883d9dd971331992c54bd48_netspire-logo-company-archipro-webflow-template.svg"],
];

function imageSources(html) {
  return [...html.matchAll(/<img\b[^>]*\bsrc="(https:\/\/cdn\.prod\.website-files\.com\/[^"]+)"[^>]*>/gi)].map((match) => match[1]);
}

function filename(url) {
  const parsed = new URL(url);

  if (parsed.protocol !== "https:" || parsed.hostname !== "cdn.prod.website-files.com") {
    throw new Error("Unapproved source: " + url);
  }

  const name = decodeURIComponent(basename(parsed.pathname));

  if (!/^[A-Za-z0-9_.-]+$/.test(name) || !allowed.has(extname(name).toLowerCase())) {
    throw new Error("Unapproved image name: " + name);
  }

  return name;
}

function localPath(name) {
  const folder = name.includes("-logo-company-") ? "brand/partners" : "img";

  return join(root, "app", "public", "assets", folder, name);
}

const assets = new Map();

for (const [page, name] of selected) {
  const html = await readFile(join(root, page), "utf8");

  const url = imageSources(html).find((candidate) => filename(candidate) === name);

  if (!url) throw new Error("Original image not found in " + page + ": " + name);

  assets.set(name, url);
}

for (const name of (await readdir(join(root, "blog-posts"))).filter((item) => item.endsWith(".html"))) {
  const html = await readFile(join(root, "blog-posts", name), "utf8");

  const start = html.indexOf('class="rich-text w-richtext"');

  if (start < 0) continue;

  const end = html.indexOf("</section>", start);

  const segment = html.slice(start, end < 0 ? undefined : end);

  for (const url of imageSources(segment)) {
    if (!allowed.has(extname(filename(url)).toLowerCase())) continue;

    assets.set(filename(url), url);
  }
}

async function present(path) {
  try {
    return (await stat(path)).size > 0;
  } catch {
    return false;
  }
}

let downloaded = 0;

let missing = 0;

for (const [name, source] of [...assets].sort(([a], [b]) => a.localeCompare(b))) {
  const path = localPath(name);

  if (await present(path)) continue;

  if (!importMode) {
    console.error("MISSING " + path);

    missing += 1;

    continue;
  }

  try {
    const response = await fetch(source, { signal: AbortSignal.timeout(30000) });

    if (!response.ok) throw new Error("HTTP " + response.status);

    const type = response.headers.get("content-type") ?? "";

    if (!/^(image\/|application\/octet-stream)/i.test(type)) throw new Error("Unexpected type " + type);

    const bytes = Buffer.from(await response.arrayBuffer());

    if (bytes.length === 0 || bytes.length > 20_000_000) throw new Error("Unexpected asset size " + bytes.length);

    await mkdir(dirname(path), { recursive: true });

    await writeFile(path, bytes);

    downloaded += 1;
  } catch (error) {
    missing += 1;

    console.error("MISSING " + name + ": " + String(error));
  }
}

console.log("Original images required: " + assets.size + "; downloaded: " + downloaded + "; missing: " + missing);

if (missing) process.exitCode = 1;
