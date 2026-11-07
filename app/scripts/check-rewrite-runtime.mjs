#!/usr/bin/env node
/**
 * Verifies that the production Astro app has no runtime dependency on the
 * original Webflow export. The root-level HTML and reference/ are deliberately
 * excluded until visual parity is proven and the final cleanup PR is merged.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("../", import.meta.url));

const requireBuild = process.argv.includes("--require-build");

const sourceTypes = new Set([".astro", ".ts", ".tsx", ".js", ".jsx", ".css"]);

const emittedTypes = new Set([".html", ".js", ".css", ".svg"]);

const violations = [];

function* walk(directory) {
  if (!existsSync(directory)) return;

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else if (entry.isFile()) {
      yield fullPath;
    }
  }
}

const forbiddenPackages = /^(?:@radix-ui\/|@webflow\/|jquery$|gsap$|webflow$|webflow-js$)/i;

const dependencies = JSON.parse(readFileSync(join(appRoot, "package.json"), "utf8"));

for (const group of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
  for (const name of Object.keys(dependencies[group] ?? {})) {
    if (forbiddenPackages.test(name)) {
      violations.push("package.json: forbidden " + group + " dependency " + name);
    }
  }
}

const runtimePatterns = [
  ["Webflow asset/CDN host", /(?:cdn\.prod\.website-files\.com|d3e54v103j8qbb\.cloudfront\.net|\.webflow\.io\/)/i],
  ["Webflow runtime bundle", /(?:webflow(?:\.schunk)?[.-][\w.-]+\.js|(?:["'/])webflow\.js)/i],
  ["jQuery runtime bundle", /(?:jquery(?:-[\d.]+)?(?:\.min)?\.js|(?:["'/])jquery(?:["'/]))/i],
  ["GSAP runtime bundle", /(?:["'/])gsap(?:\.min)?\.js|\/gsap\/\d/i],
];

const sourcePatterns = [
  ...runtimePatterns,
  ["useEffect call", /\b(?:React\.)?useEffect\s*\(/],
  ["useEffect import", /\bimport\s*\{[^}]*\buseEffect\b[^}]*\}\s*from\s*["']react["']/s],
  ["legacy runtime import", /(?:\bfrom\s*|\bimport\s*|\brequire\s*\()\s*["'](?:@radix-ui\/|@webflow\/|jquery(?:\/|["'])|gsap(?:\/|["'])|webflow(?:\/|["']))/i],
  ["Webflow interaction markup", /\bdata-wf-(?:page|site|domain|[a-z-]+)=|\bdata-w-id=/i],
];

function checkFile(file, patterns) {
  const content = readFileSync(file, "utf8");

  for (const [label, pattern] of patterns) {
    const hit = pattern.exec(content);

    if (hit) {
      const line = content.slice(0, hit.index).split("\n").length;
      violations.push(relative(appRoot, file) + ":" + line + ": " + label);
    }
  }
}

let sourceCount = 0;

for (const file of walk(join(appRoot, "src"))) {
  if (!sourceTypes.has(extname(file))) continue;
  sourceCount++;
  checkFile(file, sourcePatterns);
}

let publicCount = 0;

for (const file of walk(join(appRoot, "public"))) {
  const ext = extname(file);

  if (ext === ".html") {
    violations.push(relative(appRoot, file) + ": exported HTML must not be served by Astro");
  }

  if (!emittedTypes.has(ext)) continue;
  publicCount++;
  checkFile(file, runtimePatterns);
}

const clientDirectory = join(appRoot, "dist", "client");

if (requireBuild && !existsSync(clientDirectory)) {
  violations.push("dist/client: missing build output; run npm run build first");
}

let outputCount = 0;

for (const file of walk(clientDirectory)) {
  if (!emittedTypes.has(extname(file))) continue;
  outputCount++;
  checkFile(file, runtimePatterns);
}

console.log(
  "Rewrite runtime verification: " +
    sourceCount + " source files, " +
    publicCount + " public text assets, " +
    outputCount + " built text assets checked."
);

if (violations.length > 0) {
  for (const message of violations) console.error("FAIL " + message);
  process.exitCode = 1;
} else {
  console.log("PASS No Webflow, jQuery, GSAP, Radix, or useEffect runtime dependency detected.");
}
