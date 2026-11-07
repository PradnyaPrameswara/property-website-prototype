#!/usr/bin/env node
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  await page.goto("http://127.0.0.1:4321/home-pages/home-v1", { waitUntil: "networkidle" });

  const mobileToggle = page.locator("#nav-toggle");

  const mobileMenu = page.locator("#mobile-menu");

  await mobileToggle.click();

  if ((await mobileToggle.getAttribute("aria-expanded")) !== "true") {
    throw new Error("Mobile menu did not report expanded=true");
  }

  if (!(await mobileMenu.isVisible())) {
    throw new Error("Mobile menu did not become visible");
  }

  await page.keyboard.press("Escape");

  if ((await mobileToggle.getAttribute("aria-expanded")) !== "false") {
    throw new Error("Escape failed to close mobile navigation");
  }

  await page.setViewportSize({ width: 1440, height: 900 });

  await page.reload({ waitUntil: "networkidle" });

  const pagesToggle = page.locator("#pages-toggle");

  await pagesToggle.focus();

  if ((await pagesToggle.getAttribute("aria-expanded")) !== "true") {
    throw new Error("Keyboard focus failed to expand the desktop menu");
  }

  await page.keyboard.press("Escape");

  if ((await pagesToggle.getAttribute("aria-expanded")) !== "false") {
    throw new Error("Escape failed to dismiss desktop dropdown");
  }

  console.log("PASS mobile open/close + desktop focus/Escape interactions");
} finally {
  await browser.close();
}
