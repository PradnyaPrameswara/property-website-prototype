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

  // The menu fades in over 300 ms; checking in the same event-loop tick
  // reports an opacity close to zero even when the open state is correct.
  await page.waitForFunction(() => {
    const menu = document.getElementById("mobile-menu");

    if (!menu?.hasAttribute("data-open")) return false;

    const styles = getComputedStyle(menu);

    return styles.visibility === "visible" && Number(styles.opacity) >= 0.95;
  }, undefined, { timeout: 3000 });

  if (!(await mobileMenu.isVisible())) {
    const diagnostics = await mobileMenu.evaluate((menu) => {
      const style = getComputedStyle(menu);

      const rect = menu.getBoundingClientRect();

      return {
        open: menu.hasAttribute("data-open"),
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        width: rect.width,
        height: rect.height,
        headerOpen: menu.closest("header")?.hasAttribute("data-open"),
      };
    });

    console.error("Mobile menu diagnostics:", JSON.stringify(diagnostics));

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

  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("http://127.0.0.1:4321/company-pages/about", { waitUntil: "domcontentloaded" });

  const amsterdam = page.getByRole("tab", { name: "Amsterdam, NL" });

  await amsterdam.click();

  if ((await amsterdam.getAttribute("aria-selected")) !== "true") {
    throw new Error("Selecting the office tab did not update aria-selected");
  }

  const faq = page.getByRole("button", { name: "Do you offer virtual meetings or consultations?" });

  await faq.click();

  if ((await faq.getAttribute("aria-expanded")) !== "true") {
    throw new Error("FAQ accordion did not expand for keyboard/screen reader state");
  }

  console.log("PASS mobile/desktop navigation, office tabs and FAQ interactions");
} finally {
  await browser.close();
}
