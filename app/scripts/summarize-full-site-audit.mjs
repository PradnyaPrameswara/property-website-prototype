#!/usr/bin/env node
/**
 * Aggregate the four independent Chromium audit shards and enforce a known
 * content-coverage baseline. This is NOT a pixel-parity certification.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

function option(flag, fallback) {
  const index = process.argv.indexOf(flag);

  return resolve(index === -1 ? fallback : process.argv[index + 1]);
}

const input = option("--input", "visual/aggregated-input");

const output = option("--output", "visual/parity-report");

const baselinePath = option("--baseline", "docs/parity-baseline.json");

const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));

const directories = readdirSync(input, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name.startsWith("full-site-parity-shard-"))
  .map((entry) => join(input, entry.name, "audit.json"))
  .filter(existsSync);

if (directories.length !== 4) {
  throw new Error("Expected four complete Chromium audit artifacts; received " + directories.length);
}

const summaries = directories.map((file) => JSON.parse(readFileSync(file, "utf8")));

const shards = new Set(summaries.map((result) => result.summary.shard));

if (shards.size !== 4 || [...shards].some((shard) => ![0, 1, 2, 3].includes(shard))) {
  throw new Error("Missing or duplicate visual audit shards");
}

const pairs = summaries.flatMap((audit) => audit.routes);

const uniquePairs = new Set(pairs.map((pair) => pair.source + "|" + pair.viewport));

const sources = new Set(pairs.map((pair) => pair.source));

const expectedWidths = [390, 768, 991, 1440];

const issues = [];

if (sources.size !== baseline.expectedSourceRoutes) {
  issues.push("Source route coverage changed: " + sources.size);
}

if (pairs.length !== baseline.expectedComparisons || uniquePairs.size !== pairs.length) {
  issues.push("Expected unique route/viewport combinations: " + baseline.expectedComparisons);
}

for (const source of sources) {
  const actual = pairs.filter((pair) => pair.source === source).map((pair) => pair.viewport).sort((a, b) => a - b);

  if (JSON.stringify(actual) !== JSON.stringify([...expectedWidths].sort((a, b) => a - b))) {
    issues.push("Incomplete responsive coverage: " + source);
  }
}

const blockers = summaries.flatMap((audit) => audit.summary.blockers);

const h1Mismatches = pairs.filter((pair) => pair.gaps?.h1Mismatch).length;

const missingHeadingPairs = pairs.filter((pair) => pair.gaps?.missingHeadings?.length > 0).length;

const imageDeficitPairs = pairs.filter((pair) => pair.gaps?.missingImages > 0).length;

const screenshotPairs = summaries.reduce((total, audit) => total + audit.summary.screenshotPairs, 0);

if (screenshotPairs !== baseline.expectedScreenshotPairs) {
  issues.push("Screenshot pair coverage changed: " + screenshotPairs);
}

if (blockers.length > 0) issues.push(...blockers);

if (h1Mismatches > 0) issues.push("H1 mismatches: " + h1Mismatches);

if (missingHeadingPairs > baseline.maxMissingHeadingPairs) {
  issues.push("Heading gaps exceeded baseline: " + missingHeadingPairs);
}

if (imageDeficitPairs > baseline.maxImageDeficitPairs) {
  issues.push("Image deficits exceeded baseline: " + imageDeficitPairs);
}

const ranked = pairs
  .filter((pair) => pair.gaps?.missingHeadings?.length > 0 || pair.gaps?.missingImages > 0)
  .sort((a, b) => (
    b.gaps.missingHeadings.length * 3 + b.gaps.missingImages -
    (a.gaps.missingHeadings.length * 3 + a.gaps.missingImages)
  ))
  .slice(0, 20);

const lines = [
  "# Full-site rewrite coverage",
  "",
  "Diagnostic source-vs-Astro comparison, **not** a certification of pixel-identical design.",
  "",
  "| Metric | Result | Prior accepted maximum |",
  "| --- | ---: | ---: |",
  "| Source pages | " + sources.size + " | " + baseline.expectedSourceRoutes + " |",
  "| Route/viewport pairs | " + pairs.length + " | " + baseline.expectedComparisons + " |",
  "| Screenshot pairs | " + screenshotPairs + " | " + baseline.expectedScreenshotPairs + " |",
  "| H1 mismatches | " + h1Mismatches + " | 0 |",
  "| Heading-gap pairs | " + missingHeadingPairs + " | " + baseline.maxMissingHeadingPairs + " |",
  "| Image-deficit pairs | " + imageDeficitPairs + " | " + baseline.maxImageDeficitPairs + " |",
  "| Browser blockers | " + blockers.length + " | 0 |",
  "",
  "## Highest remaining source differences",
  "",
  "| Page | Viewport | Missing heading labels | Image deficit |",
  "| --- | ---: | ---: | ---: |",
  ...ranked.map((pair) => "| " + pair.route + " | " + pair.viewport + " | " + pair.gaps.missingHeadings.length + " | " + pair.gaps.missingImages + " |"),
  "",
  "## Release interpretation",
  "",
  "This report can rule out certain regressions but cannot prove that layout, typography, motion, accessibility, or form delivery is identical.",
  "Manual approval evidence for each page and a configured production webhook remain separate prerequisites to deleting Webflow sources.",
  "",
  "## Blocking findings",
  "",
  ...(issues.length ? issues.map((issue) => "- " + issue) : ["None beyond the tracked visual parity debt"]),
  "",
];

mkdirSync(output, { recursive: true });

writeFileSync(join(output, "report.md"), lines.join("\n") + "\n");

writeFileSync(join(output, "report.json"), JSON.stringify({
  result: issues.length ? "regression" : "diagnostic-pass",
  verifiedPixelParity: false,
  sourceRoutes: sources.size,
  comparisons: pairs.length,
  screenshots: screenshotPairs,
  h1Mismatches,
  missingHeadingPairs,
  imageDeficitPairs,
  blockers,
  issues,
  highestGaps: ranked.map((pair) => ({
    route: pair.route,
    width: pair.viewport,
    missingHeadings: pair.gaps.missingHeadings,
    imageDeficit: pair.gaps.missingImages,
  })),
}, null, 2) + "\n");

if (issues.length) {
  for (const issue of issues) console.error("FAIL " + issue);

  process.exitCode = 1;
} else {
  console.log("PASS Full-site audit coverage and non-regression gate; visual parity still requires review.");
}
