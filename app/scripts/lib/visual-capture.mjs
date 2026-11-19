/**
 * Shared capture conditions for Webflow/Astro visual comparison.
 *
 * Both QA scripts use this module so a route captured by one produces the
 * same result as the other. Playwright's animations:"disabled" is deliberately
 * not used: it writes caret-color:transparent inline on every element before
 * hydration, which creates a false React hydration mismatch on form islands.
 */

export const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 991, height: 900 },
  { width: 1440, height: 900 },
];

export const QUIET_CSS = [
  "*,*::before,*::after {",
  "  animation-duration: 0s !important;",
  "  animation-delay: 0s !important;",
  "  transition-duration: 0s !important;",
  "  transition-delay: 0s !important;",
  "}",
].join("\n");

export const REVEAL_CSS = [
  "[data-w-id] { opacity: 1 !important; filter: none !important; transform: none !important; }",
  '[style*="opacity:0"], [style*="opacity: 0"] { opacity: 1 !important; filter: none !important; }',
  '[style*="translate3d"] { transform: none !important; }',
].join("\n");

/**
 * Apply the shared CSS overrides. Reference pages additionally get reveal
 * overrides; these exist only in the QA browser, never in the shipped app.
 */
export async function preparePage(page, { isReference = false } = {}) {
  await page.addStyleTag({ content: QUIET_CSS });

  if (isReference) {
    await page.addStyleTag({ content: REVEAL_CSS });
  }
}

/**
 * Wait for fonts and eager-decode images so full-page screenshots are stable.
 * `forceImages` is used for full-page captures where lazy images stay offscreen.
 */
export async function settlePage(page, { forceImages = true } = {}) {
  await page.evaluate(async (force) => {
    await Promise.race([
      document.fonts.ready,
      new Promise((done) => setTimeout(done, 1800)),
    ]);

    if (!force) return;

    const images = [...document.querySelectorAll("section img")];

    for (const img of images) {
      if (img.loading === "lazy") img.loading = "eager";
    }

    await Promise.race([
      Promise.all(images.map((img) => img.decode().catch(() => undefined))),
      new Promise((done) => setTimeout(done, 1800)),
    ]);
  }, forceImages);

  await page.waitForTimeout(400);
}

/** Open a URL, apply shared overrides and settle it for a deterministic capture. */
export async function openPage(page, url, { isReference = false, forceImages = true } = {}) {
  const response = await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 40000,
  });

  await preparePage(page, { isReference });
  await settlePage(page, { forceImages });

  return response;
}
