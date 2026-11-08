#!/usr/bin/env node
/**
 * Integration contract against a real Astro development server with a local
 * webhook simulator. No real accounts, outbound email, or live backend needed.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

let failNext = false;

const deliveries = [];

const receiver = createServer(async (request, response) => {
  const parts = [];

  for await (const part of request) parts.push(part);

  const body = JSON.parse(Buffer.concat(parts).toString("utf8"));

  deliveries.push({
    method: request.method,
    token: request.headers.authorization,
    body,
  });

  if (failNext) {
    failNext = false;
    response.writeHead(500).end("Receiver unavailable");

    return;
  }

  response.writeHead(202).end("Accepted");
});

receiver.listen(0, "127.0.0.1");

await once(receiver, "listening");

const { port: receiverPort } = receiver.address();

const endpoint = "http://127.0.0.1:" + receiverPort;

function startAstro(port, webhook) {
  const env = { ...process.env, FORM_WEBHOOK_URL: webhook, FORM_WEBHOOK_TOKEN: "test-token" };

  const child = spawn(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(port)],
    {
      cwd: appRoot,
      env,
      detached: process.platform !== "win32",
      stdio: ["ignore", "ignore", "pipe"],
    },
  );

  let output = "";

  child.stderr?.on("data", (data) => {
    output += String(data).slice(0, 500);
  });

  return { child, logs: () => output.slice(-1000) };
}

function stopAstro({ child }) {
  if (!child.pid) return;

  try {
    if (process.platform === "win32") child.kill();
    else process.kill(-child.pid, "SIGTERM");
  } catch {
    // Process already exited.
  }
}

async function ready(base, logs) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(base + "/api/contact", { method: "GET" });

      if (response.status === 405) return;
    } catch {
      // Server has not started listening yet.
    }

    await delay(250);
  }

  throw new Error("Astro did not become ready: " + logs());
}

async function send(base, route, fields) {
  const response = await fetch(base + route, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });

  return { status: response.status, body: await response.json() };
}

const contact = {
  "First Name": "Example", "Last Name": "Visitor", Email: "person@example.test",
  Phone: "", Service: "", Message: "A test enquiry",
};

const quote = {
  Name: "Example Visitor", "First Name": "Example", "Last Name": "Visitor",
  Email: "person@example.test", Phone: "123456", Company: "Test Co",
  Location: "", Service: "Architectural design",
};

let configured;

let unconfigured;

try {
  configured = startAstro(4537, endpoint);

  const base = "http://127.0.0.1:4537";

  await ready(base, configured.logs);

  for (const route of ["/api/contact", "/api/quote", "/api/subscribe"]) {
    assert.equal((await fetch(base + route)).status, 405);
    assert.equal((await send(base, route, {})).status, 400);
  }

  for (const [route, fields, kind] of [
    ["/api/contact", contact, "contact"],
    ["/api/quote", quote, "quote"],
    ["/api/subscribe", { email: "person@example.test" }, "subscribe"],
  ]) {
    const result = await send(base, route, fields);

    assert.equal(result.status, 200, route + ": expected a successful receiver acknowledgement");
    assert.equal(result.body.accepted, true);
    assert.equal(deliveries.at(-1).body.type, kind);
    assert.equal(deliveries.at(-1).token, "Bearer test-token");
  }

  // Spam traps report a generic success without forwarding any personal data.
  for (const [route, fields] of [
    ["/api/contact", contact],
    ["/api/quote", quote],
    ["/api/subscribe", { email: "person@example.test" }],
  ]) {
    const before = deliveries.length;
    const result = await send(base, route, { ...fields, website: "spam.example" });

    assert.equal(result.status, 200);
    assert.equal(deliveries.length, before, route + ": trapped submission was forwarded");
  }

  const beforeInvalid = deliveries.length;
  const oversized = await send(base, "/api/contact", { ...contact, Message: "x".repeat(40_000) });

  assert.equal(oversized.status, 400);
  assert.equal(deliveries.length, beforeInvalid);

  const invalidEmail = await send(base, "/api/subscribe", { email: "x".repeat(260) + "@example.test" });

  assert.equal(invalidEmail.status, 400);
  assert.equal(deliveries.length, beforeInvalid);

  const forgedOrigin = await fetch(base + "/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://example.invalid" },
    body: JSON.stringify(contact),
  });

  assert.equal(forgedOrigin.status, 400);

  const wrongType = await fetch(base + "/api/contact", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(contact),
  });

  assert.ok([400, 403].includes(wrongType.status), "non-JSON form request must be rejected");

  failNext = true;

  const rejected = await send(base, "/api/contact", contact);

  assert.equal(rejected.status, 502);
  assert.equal(rejected.body.ok, false);

  // Astro places a workspace dev-server lock: run the no-webhook case
  // sequentially rather than starting two dev servers in one workspace.
  stopAstro(configured);

  configured = undefined;

  await delay(1500);

  unconfigured = startAstro(4538, "");

  const emptyBase = "http://127.0.0.1:4538";

  await ready(emptyBase, unconfigured.logs);

  const missing = await send(emptyBase, "/api/subscribe", { email: "person@example.test" });

  assert.equal(missing.status, 503);
  assert.equal(missing.body.ok, false);

  console.log("PASS bounded validation, spam trap, webhook acknowledgement, receiver failure, unavailable configuration");
} finally {
  if (configured) stopAstro(configured);

  if (unconfigured) stopAstro(unconfigured);
  receiver.close();
}
