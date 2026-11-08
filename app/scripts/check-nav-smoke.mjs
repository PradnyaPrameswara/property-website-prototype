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

  await page.goto("http://127.0.0.1:4321/company-pages/about", { waitUntil: "networkidle" });

  const amsterdam = page.getByRole("tab", { name: "Amsterdam, NL" });

  await amsterdam.scrollIntoViewIfNeeded();

  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island[component-url*="OfficeLocations"]');

    return island && !island.hasAttribute("ssr");
  }, undefined, { timeout: 15000 });

  await amsterdam.click();

  await page.waitForFunction(() =>
    Boolean(document.querySelector('[role="tab"][data-active]')?.textContent?.includes("Amsterdam")),
  );

  const officeImage = page.getByRole("img", { name: "Archipro office in Amsterdam, NL" });

  if (!(await officeImage.isVisible())) {
    throw new Error("Selecting an office did not display its photograph");
  }

  const faq = page.getByRole("button", { name: "Do you offer virtual meetings or consultations?" });

  await faq.scrollIntoViewIfNeeded();

  await page.waitForFunction(() => {
    const island = [...document.querySelectorAll("astro-island")]
      .find((element) => element.getAttribute("component-url")?.includes("FaqAccordion"));

    return island && !island.hasAttribute("ssr");
  }, undefined, { timeout: 15000 });

  await faq.click();

  await page.waitForFunction(() => {
    const button = [...document.querySelectorAll("button")]
      .find((element) => element.textContent?.includes("Do you offer virtual meetings"));

    return button?.getAttribute("aria-expanded") === "true";
  });

  await page.goto("http://127.0.0.1:4321/home-pages/home-v1", { waitUntil: "networkidle" });

  const portfolioTab = page.locator('[data-portfolio-tab="1"]');

  await portfolioTab.click();

  if ((await portfolioTab.getAttribute("aria-selected")) !== "true" ||
      !(await page.locator('[data-portfolio-image="1"]').isVisible()) ||
      await page.locator("[data-portfolio-image]:visible").count() !== 1) {
    throw new Error("Home V1 portfolio tab did not activate exactly one source image");
  }

  await portfolioTab.focus();
  await page.keyboard.press("ArrowDown");

  if ((await page.locator('[data-portfolio-tab="2"]').getAttribute("aria-selected")) !== "true") {
    throw new Error("Home V1 project keyboard navigation failed");
  }

  await page.goto("http://127.0.0.1:4321/home-pages/home-v3", { waitUntil: "networkidle" });

  const serviceTab = page.locator('[data-service-tab="2"]');

  await serviceTab.click();

  if ((await serviceTab.getAttribute("aria-selected")) !== "true" ||
      !(await page.locator('[data-service-image="2"]').isVisible()) ||
      await page.locator("[data-service-image]:visible").count() !== 1) {
    throw new Error("Home V3 service tab did not activate exactly one source image");
  }

  await serviceTab.focus();
  await page.keyboard.press("ArrowDown");

  if ((await page.locator('[data-service-tab="3"]').getAttribute("aria-selected")) !== "true") {
    throw new Error("Home V3 service keyboard navigation failed");
  }

  console.log("PASS navigation, office/FAQ interactions, and Home V1/V3 source photo tabs");
} finally {
  await browser.close();
}
