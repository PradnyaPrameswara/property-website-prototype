#!/usr/bin/env node
/**
 * Phase 5 — asset localization (AGENTS.md roadmap).
 * Downloads every Webflow CDN asset referenced by app/src (images from
 * scripts/used-cdn-urls.txt) plus videos and brand SVGs into app/public/,
 * then rewrites all references in app/src to local /assets/... paths.
 *
 * Idempotent: existing non-empty files are skipped; rewrites are exact-string.
 * Never touches the raw Webflow export (AGENTS.md rule 2).
 *
 * Usage: node scripts/localize-assets.mjs
 */
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const publicDir = path.join(appRoot, "public");

const srcDir = path.join(appRoot, "src");

const CDN_VIDEO = "https://cdn.prod.website-files.com/6883a66d1ebb4685edc545ce%2F";

const CDN_BRAND = "https://cdn.prod.website-files.com/6883a66d1ebb4685edc545ce/";

/** Videos (guide 2.10/2.11) + brand assets not referenced as <img> in app/src */
const extraAssets = [
  // Home V3 hero background video + poster
  [`${CDN_VIDEO}6894d2980fa37677620dbade_video-thumbnail-archipro-webflow-template-transcode.webm`, "assets/video/hero-home-v3.webm"],
  [`${CDN_VIDEO}6894d2980fa37677620dbade_video-thumbnail-archipro-webflow-template-transcode.mp4`, "assets/video/hero-home-v3.mp4"],
  [`${CDN_VIDEO}6894d2980fa37677620dbade_video-thumbnail-archipro-webflow-template-poster-00001.jpg`, "assets/video/hero-home-v3-poster.jpg"],
  // "Tour our office" lightbox video (follow-our-work transcode) + poster
  [`${CDN_VIDEO}6894d7d289ebd85a7fa4f3f2_follow-our-work-thumbnail-v1-archipro-webflow-template-transcode.webm`, "assets/video/office-tour.webm"],
  [`${CDN_VIDEO}6894d7d289ebd85a7fa4f3f2_follow-our-work-thumbnail-v1-archipro-webflow-template-transcode.mp4`, "assets/video/office-tour.mp4"],
  [`${CDN_VIDEO}6894d7d289ebd85a7fa4f3f2_follow-our-work-thumbnail-v1-archipro-webflow-template-poster-00001.jpg`, "assets/video/office-tour-poster.jpg"],
  // Brand (Header = light-mode logo, Footer = dark-mode logo, favicon, webclip)
  [`${CDN_BRAND}6883ab331ea1ce906d0cf134_logo-light-mode-archipro-webflow-template.svg`, "assets/brand/logo-light.svg"],
  [`${CDN_BRAND}6883ab334526ed5482887a99_logo-dark-mode-archipro-webflow-template.svg`, "assets/brand/logo-dark.svg"],
  [`${CDN_BRAND}6883a824e435b2d57961a7d4_webclip-archipro-webflow-template.svg`, "assets/brand/webclip.svg"],
  [`${CDN_BRAND}6883a8219fc4fdbd0eb3cbea_favicon-archipro-webflow-template.svg`, "favicon.svg"],
];

function imageTarget(url) {
  const raw = decodeURIComponent(url.split("/").pop());

  const safe = raw.replace(/\s+/g, "-");

  return `assets/img/${safe}`;
}

async function existsNonEmpty(file) {
  try {
    const stats = await stat(file);

    return stats.size > 0;
  } catch {
    return false;
  }
}

async function download(url, rel) {
  const dest = path.join(publicDir, rel);

  if (await existsNonEmpty(dest)) return "skip";

  await mkdir(path.dirname(dest), { recursive: true });

  const res = await fetch(url);

  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);

  await writeFile(dest, Buffer.from(await res.arrayBuffer()));

  return "ok";
}

async function walk(dir) {
  const out = [];

  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      out.push(...(await walk(full)));
    } else if (/\.(astro|tsx?|md|css)$/.test(entry.name)) {
      out.push(full);
    }
  }

  return out;
}

// --- collect targets -------------------------------------------------------
const listRaw = await readFile(new URL("./used-cdn-urls.txt", import.meta.url), "utf8");

const imageUrls = listRaw.replace(/^﻿/, "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

const targets = [...imageUrls.map((url) => [url, imageTarget(url)]), ...extraAssets];

// --- download (concurrency 6) ----------------------------------------------
let done = 0;

let failed = 0;

const queue = [...targets];

await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const [url, rel] = queue.shift();

      try {
        const status = await download(url, rel);

        if (status === "ok") console.log(`ok    ${rel}`);

        done++;
      } catch (error) {
        failed++;

        console.error(`FAIL  ${rel} — ${error.message}`);
      }
    }
  }),
);

// --- build map + rewrite references in app/src ------------------------------
const map = Object.fromEntries(targets.map(([url, rel]) => [url, `/${rel}`]));

await writeFile(new URL("./asset-map.json", import.meta.url), JSON.stringify(map, null, 2) + "\n");

let touchedFiles = 0;

let replacements = 0;

for (const file of await walk(srcDir)) {
  let content = await readFile(file, "utf8");

  let changed = false;

  for (const [url, local] of Object.entries(map)) {
    const hits = content.split(url).length - 1;

    if (hits > 0) {
      content = content.split(url).join(local);

      replacements += hits;

      changed = true;
    }
  }

  if (changed) {
    await writeFile(file, content);

    touchedFiles++;

    console.log(`rewrite ${path.relative(appRoot, file)}`);
  }
}

console.log(`\nDownloaded/skipped ${done}/${targets.length} (${failed} failed), rewrote ${replacements} refs in ${touchedFiles} files.`);

if (failed > 0) process.exitCode = 1;
