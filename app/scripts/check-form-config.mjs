#!/usr/bin/env node
/** Deployment-only fail-closed check; no secrets or network calls are logged. */
if (!process.argv.includes("--strict")) {
  console.log("Use --strict to validate form webhook deployment configuration.");
  process.exit(0);
}

const urlValue = process.env.FORM_WEBHOOK_URL;

const token = process.env.FORM_WEBHOOK_TOKEN;

const problems = [];

let url;

try {
  url = new URL(urlValue ?? "");
} catch {
  problems.push("FORM_WEBHOOK_URL must be a valid HTTPS URL");
}

if (url && (url.protocol !== "https:" || !url.hostname || url.username || url.password)) {
  problems.push("FORM_WEBHOOK_URL must use HTTPS without embedded credentials");
}

if (!token) problems.push("FORM_WEBHOOK_TOKEN must be set as a server-side deployment secret");

if (problems.length > 0) {
  for (const problem of problems) console.error("FAIL " + problem);

  process.exitCode = 1;
} else {
  console.log("PASS Form webhook deployment settings present (receiver delivery not tested).");
}
