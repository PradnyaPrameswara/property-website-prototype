#!/usr/bin/env node
/**
 * Structural gate before deleting the original export. The regular check
 * verifies routes and local assets; --require-parity additionally requires
 * explicitly reviewed visual/interaction evidence for every source page.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));

const publicRoot = join(root, "app", "public");

const appRoot = join(root, "app");

const srcRoot = join(appRoot, "src");

const exportedFolders = [
  "blog-categories", "blog-pages", "blog-posts", "company-pages",
  "contact-pages", "home-pages", "landing-pages", "portfolio-pages",
  "portfolio", "service-pages", "services", "team", "template-pages",
];

const collectionFolders = {
  "blog-categories": "categories",
  "blog-posts": "posts",
  portfolio: "portfolio",
  services: "services",
  team: "team",
};

const missing = [];

const routes = [];

const skipped = [];

function staticFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).filter((entry) => entry.isFile());
}

const rawPages = staticFiles(root).filter((entry) => entry.name.endsWith(".html")).map((entry) => entry.name);

for (const folder of exportedFolders) {
  for (const file of staticFiles(join(root, folder))) {
    if (file.name.endsWith(".html")) rawPages.push(folder + "/" + file.name);
  }
}

for (const path of rawPages.sort()) {
  // Export-generated email and telephone aliases are not standalone pages.
  if (path.includes("@") || path.includes("(")) {
    skipped.push(path);

    continue;
  }

  const parts = path.split("/");

  const folder = parts[0];

  const collection = collectionFolders[folder];

  let routeFile;

  if (collection && parts.length === 2) {
    routeFile = join(srcRoot, "pages", folder, "[slug].astro");

    const item = join(srcRoot, "content", collection, parts[1].replace(/\.html$/, ".md"));

    if (!existsSync(item)) missing.push("Missing content collection entry: " + item);
  } else {
    routeFile = join(srcRoot, "pages", path.replace(/\.html$/, ".astro"));
  }

  if (!existsSync(routeFile)) missing.push("Missing Astro route: " + path);

  routes.push(path);
}

function* walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      yield* walk(path);
    } else if (entry.isFile()) {
      yield path;
    }
  }
}

const assets = new Set();

const assetPattern = /\/assets\/[A-Za-z0-9_.@/-]+\.(?:jpe?g|png|svg|webp|avif|gif|mp4|webm|ico)\b/g;

const partnerPattern = /[A-Za-z0-9_.-]+-logo-company-[A-Za-z0-9_.-]+\.svg/g;

for (const file of walk(srcRoot)) {
  if (![".astro", ".tsx", ".ts", ".md", ".css"].includes(extname(file))) continue;

  const source = readFileSync(file, "utf8");

  for (const match of source.matchAll(assetPattern)) {
    assets.add(match[0].slice(1));
  }

  for (const match of source.matchAll(partnerPattern)) {
    assets.add("assets/brand/partners/" + match[0]);
  }
}

for (const asset of assets) {
  const file = join(publicRoot, asset);

  if (!existsSync(file) || statSync(file).size === 0) {
    missing.push("Missing local asset: " + asset);
  }
}

console.log(
  "Migration coverage: " + routes.length + " mapped source pages, " +
  skipped.length + " export-generated aliases, " +
  assets.size + " referenced asset paths."
);

if (process.argv.includes("--require-parity")) {
  const evidenceFile = join(appRoot, "docs", "verified-visual-parity.json");

  if (!existsSync(evidenceFile)) {
    missing.push("Full visual parity evidence does not exist; legacy export deletion is blocked.");
  } else {
    const evidence = JSON.parse(readFileSync(evidenceFile, "utf8"));

    const reviewed = new Map((evidence.routes ?? []).map((entry) => [entry.source, entry]));

    for (const path of routes) {
      const result = reviewed.get(path);

      if (
        result?.visual !== "verified" ||
        result?.responsive !== "verified" ||
        result?.interactions !== "verified" ||
        !result?.reviewer
      ) {
        missing.push("Unverified source route: " + path);
      }
    }
  }
}

if (missing.length > 0) {
  for (const problem of missing) console.error("FAIL " + problem);

  process.exitCode = 1;
} else {
  console.log("PASS Structural migration readiness; this does not establish pixel parity.");
}
