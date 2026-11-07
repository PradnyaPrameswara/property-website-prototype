#!/usr/bin/env node
/**
 * Visual QA for every source HTML page except Webflow's generated
 * email/telephone aliases. Does not certify pixel parity.
 */
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const shardFlag = process.argv.indexOf("--shard");

const shard = shardFlag < 0 ? 0 : Number(process.argv[shardFlag + 1]);

const shardCount = 4;

if (!Number.isInteger(shard) || shard < 0 || shard >= shardCount) {
  throw new Error("Pass --shard with an integer from 0 to 3");
}

const folders = [
  "blog-categories", "blog-pages", "blog-posts", "company-pages",
  "contact-pages", "home-pages", "landing-pages", "portfolio-pages",
  "portfolio", "service-pages", "services", "team", "template-pages",
];

async function originals() {
  const pages = ["index.html", "401.html", "404.html"];

  for (const folder of folders) {
    const entries = await readdir(join(repoRoot, folder));

    for (const name of entries) {
      if (!name.endsWith(".html") || name.includes("@") || name.includes("(")) continue;

      pages.push(folder + "/" + name);
    }
  }

  return [...new Set(pages)].sort().map((source) => ({
    source,
    route: source === "index.html" ? "/" : "/" + source.replace(/\.html$/, ""),
  }));
}

const routes = (await originals()).filter((_, index) => index % shardCount === shard);

const viewports = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 991, height: 900 },
  { width: 1440, height: 900 },
];

const referenceCss = [
  "[data-w-id] { opacity: 1 !important; filter: none !important; }",
  '[style*="opacity:0"], [style*="opacity: 0"] { opacity: 1 !important; filter: none !important; }',
  '[style*="translate3d"] { transform: none !important; }',
].join("\n");

const output = join("visual", "full-site", "shard-" + shard);

await mkdir(join(output, "reference"), { recursive: true });

await mkdir(join(output, "astro"), { recursive: true });

function inspect() {
  const source = document.querySelector("main") ?? document.body;

  const heading = source.querySelector("h1");

  const headings = [...source.querySelectorAll("h1, h2, h3")]
    .map((element) => element.textContent?.replace(/\s+/g, " ").trim() ?? "")
    .filter(Boolean);

  const images = [...source.querySelectorAll("section img")];

  const brokenImages = images
    .filter((img) => img.complete && img.naturalWidth === 0)
    .map((img) => img.getAttribute("src"))
    .filter(Boolean)
    .slice(0, 10);

  const h1Style = heading ? getComputedStyle(heading) : null;

  const h1Box = heading?.getBoundingClientRect();

  const viewport = document.documentElement.clientWidth;

  const pageWidth = document.documentElement.scrollWidth;

  return {
    h1: heading?.textContent?.replace(/\s+/g, " ").trim() ?? "",
    headings: headings.slice(0, 50),
    headingCount: headings.length,
    sectionCount: source.querySelectorAll("section").length,
    imageCount: images.length,
    brokenImages,
    formCount: source.querySelectorAll("form").length,
    pageWidth,
    overflow: Math.max(0, pageWidth - viewport),
    pageHeight: document.documentElement.scrollHeight,
    h1Font: h1Style?.fontFamily ?? null,
    h1Size: h1Style?.fontSize ?? null,
    h1Top: h1Box ? Math.round(h1Box.y + window.scrollY) : null,
    h1Height: h1Box ? Math.round(h1Box.height) : null,
  };
}

const browser = await chromium.launch({ headless: true });

const results = [];

const blockers = [];

try {
  for (const item of routes) {
    for (const viewport of viewports) {
      const pair = { source: item.source, route: item.route, viewport: viewport.width };

      for (const version of ["reference", "astro"]) {
        const page = await browser.newPage({ viewport, deviceScaleFactor: 1, reducedMotion: "reduce" });

        const url = version === "reference"
          ? "http://127.0.0.1:4401/" + item.source
          : "http://127.0.0.1:4321" + item.route;

        const record = { url };

        try {
          const response = await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 20000,
          });

          record.status = response?.status() ?? 0;

          if (version === "reference") {
            await page.addStyleTag({ content: referenceCss });
          }

          await page.evaluate(async () => {
            await Promise.race([
              document.fonts.ready,
              new Promise((done) => setTimeout(done, 1800)),
            ]);
          });

          await page.waitForTimeout(400);

          Object.assign(record, await page.evaluate(inspect));

          // Capture full-page evidence on the two endpoint viewports.
          if (viewport.width === 390 || viewport.width === 1440) {
            const name = item.source.replace(/[^A-Za-z0-9-]/g, "_") + "-" + viewport.width + ".png";

            record.screenshot = version + "/" + name;

            await page.screenshot({
              path: join(output, record.screenshot),
              fullPage: true,
              animations: "disabled",
              timeout: 30000,
            });
          }

          if (version === "astro" && !response?.ok() && !["/401", "/404"].includes(item.route)) {
            blockers.push(item.route + " returned HTTP " + record.status);
          }

          if (version === "astro" && record.overflow > 2) {
            blockers.push(item.route + " overflows viewport " + viewport.width + " by " + record.overflow + "px");
          }

          if (version === "astro" && record.brokenImages.length > 0) {
            blockers.push(item.route + " has broken loaded images: " + record.brokenImages.join(", "));
          }
        } catch (error) {
          record.error = String(error?.message ?? error);

          if (version === "astro") {
            blockers.push(item.route + " " + viewport.width + "px browser error: " + record.error);
          }
        } finally {
          pair[version] = record;

          await page.close();
        }
      }

      const src = pair.reference;

      const astro = pair.astro;

      const referenceHeaders = src.headings ?? [];

      const astroHeaders = astro.headings ?? [];

      pair.gaps = {
        h1Mismatch: Boolean(src.h1 && src.h1 !== astro.h1),
        missingHeadings: referenceHeaders.filter((heading) => !astroHeaders.includes(heading)).slice(0, 25),
        missingImages: Math.max(0, (src.imageCount ?? 0) - (astro.imageCount ?? 0)),
        sectionCountDelta: (astro.sectionCount ?? 0) - (src.sectionCount ?? 0),
        heightDelta: (astro.pageHeight ?? 0) - (src.pageHeight ?? 0),
      };

      results.push(pair);

      console.log(
        item.route + " " + viewport.width + "px: " +
        "headings missing=" + pair.gaps.missingHeadings.length +
        ", image gap=" + pair.gaps.missingImages +
        ", overflow=" + (astro.overflow ?? "n/a")
      );
    }
  }
} finally {
  await browser.close();
}

const summary = {
  shard,
  sourceRoutes: routes.length,
  evaluatedPairs: results.length,
  screenshotPairs: results.filter((result) => result.viewport === 390 || result.viewport === 1440).length,
  h1Mismatches: results.filter((result) => result.gaps.h1Mismatch).length,
  missingHeadingPairs: results.filter((result) => result.gaps.missingHeadings.length > 0).length,
  imageDeficitPairs: results.filter((result) => result.gaps.missingImages > 0).length,
  blockers: [...new Set(blockers)],
};

await writeFile(join(output, "audit.json"), JSON.stringify({ summary, routes: results }, null, 2) + "\n");

const summaryLines = [
  "# Full-site visual parity audit — shard " + shard,
  "",
  "This is a diagnostic comparison, not certification of identical output.",
  "",
  "- Original HTML pages: " + summary.sourceRoutes,
  "- Route × viewport comparisons: " + summary.evaluatedPairs,
  "- Screenshot pairs: " + summary.screenshotPairs,
  "- H1 mismatches: " + summary.h1Mismatches,
  "- Heading-gap comparisons: " + summary.missingHeadingPairs,
  "- Image-deficit comparisons: " + summary.imageDeficitPairs,
  "- Hard failures: " + summary.blockers.length,
  "",
  "## Route gaps",
  "",
  "| Source | Width | Missing headings | Missing images | H1 mismatch |",
  "| --- | ---: | ---: | ---: | --- |",
  ...results.map((item) =>
    "| " + item.source + " | " + item.viewport + " | " +
    item.gaps.missingHeadings.length + " | " + item.gaps.missingImages +
    " | " + (item.gaps.h1Mismatch ? "Yes" : "No") + " |"
  ),
  "",
  "## Blocking failures",
  "",
  ...(summary.blockers.length ? summary.blockers.map((message) => "- " + message) : ["None found"]),
  "",
];

await writeFile(join(output, "audit.md"), summaryLines.join("\n"));

console.log("Audit summary:", JSON.stringify(summary));

if (summary.blockers.length > 0) process.exitCode = 1;
