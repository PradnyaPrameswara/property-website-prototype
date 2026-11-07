#!/usr/bin/env node
/** Compare exported reference pages and Astro at representative viewports. */
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const pages = ["home-v1", "home-v2", "home-v3"];

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

const browser = await chromium.launch({ headless: true });

const report = [];

function inspectOverflow() {
  const viewportWidth = document.documentElement.clientWidth;

  const documentWidth = document.documentElement.scrollWidth;

  const overflow = Math.max(0, documentWidth - viewportWidth);

  const culprits = [...document.querySelectorAll("body *")]
    .filter((element) => {
      const rect = element.getBoundingClientRect();

      return rect.width > 0 && rect.right > viewportWidth + 2 && rect.left < viewportWidth;
    })
    .slice(0, 8)
    .map((element) => ({
      tag: element.tagName.toLowerCase(),
      className: String(element.getAttribute("class") ?? "").slice(0, 150),
      right: Math.round(element.getBoundingClientRect().right),
    }));

  return { viewportWidth, documentWidth, overflow, culprits };
}

try {
  for (const pageName of pages) {
    for (const viewport of viewports) {
      for (const version of ["reference", "astro"]) {
        const page = await browser.newPage({
          viewport,
          reducedMotion: "reduce",
          deviceScaleFactor: 1,
        });

        try {
          const path = "/home-pages/" + pageName + (version === "reference" ? ".html" : "");

          const baseUrl = version === "reference"
            ? "http://127.0.0.1:4401"
            : "http://127.0.0.1:4321";

          const response = await page.goto(baseUrl + path, {
            waitUntil: "domcontentloaded",
            timeout: 30000,
          });

          if (!response?.ok()) {
            throw new Error(version + " " + path + " returned " + response?.status());
          }

          if (version === "reference") {
            // Webflow animations leave unrevealed sections at opacity zero.
            // These override styles exist in the QA browser only.
            await page.addStyleTag({ content: referenceCss });
          }

          await page.evaluate(() => document.fonts.ready);

          await page.waitForTimeout(600);

          const layout = await page.evaluate(inspectOverflow);

          const filename = pageName + "-" + viewport.width + ".png";

          await page.screenshot({
            path: join("visual", version, filename),
            fullPage: true,
            animations: "disabled",
            timeout: 30000,
          });

          report.push({ route: pageName, version, viewport: viewport.width, ...layout });

          console.log(version + " " + pageName + " " + viewport.width +
            "px: document=" + layout.documentWidth + "px; overflow=" + layout.overflow + "px");
        } finally {
          await page.close();
        }
      }
    }
  }
} finally {
  await browser.close();

  await writeFile(join("visual", "layout-report.json"), JSON.stringify(report, null, 2) + "\n");
}

const overflow = report.filter((item) => item.version === "astro" && item.overflow > 2);

if (overflow.length > 0) {
  console.warn("Astro overflow in " + overflow.length + " screenshots; see layout-report.json");
}

console.log("Captured " + report.length + " original/Astro screenshots.");
