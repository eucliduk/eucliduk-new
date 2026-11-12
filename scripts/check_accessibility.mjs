import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile, readdir, mkdir, writeFile, access } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { createPreviewServer } from "./site_preview_server.mjs";

const require = createRequire(import.meta.url);
const playwright = await import(process.env.EUCLID_PLAYWRIGHT_PATH || "playwright");
const browserEngine = process.env.EUCLID_BROWSER_ENGINE || "chromium";
assert.ok(["chromium", "webkit"].includes(browserEngine), "Supported test browser engine");
const axe = await readFile(process.env.EUCLID_AXE_PATH || require.resolve("axe-core/axe.min.js"), "utf8");
const directory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const previewServer = process.env.EUCLID_SITE_BASE_URL ? null : await createPreviewServer(directory);
const previewBase = process.env.EUCLID_SITE_BASE_URL || previewServer.baseURL;
const pageUrl = file => previewBase ? new URL(file, previewBase).href : pathToFileURL(resolve(directory, file)).href;
const output = resolve(process.env.EUCLID_SITE_OUTPUT || resolve(directory, ".build/accessibility"));
await mkdir(output, { recursive: true });
const pages = ["index.html", "science.html", "story.html", "dark-matter.html", "dark-energy.html", "orbit.html", "technology.html", "telescope.html", "big-data.html", "humans.html", "resources.html", "events.html", "press.html", "media.html", "dr1-foundation.html", "q1-release.html", "royal-society-exhibition.html", "faqs.html", "scientists.html", "membership.html"].filter(name => !process.env.EUCLID_SITE_PAGE || name === process.env.EUCLID_SITE_PAGE);
const browser = await playwright[browserEngine].launch({ headless: true, ...(process.env.EUCLID_BROWSER_PATH && browserEngine === "chromium" ? { executablePath: process.env.EUCLID_BROWSER_PATH } : {}) });
const browserVersion = browser.version();
const reports = [];
const failures = [];
const standardContrastWarnings = [];
const imageReleases = JSON.parse(await readFile(resolve(directory, "data/site/home-image-releases.json"), "utf8")).images;
const originalLogo = await readFile(resolve(directory, "images/logos/eucliduklogooct26.svg"), "utf8");
const logoSourceHash = createHash("sha256").update(originalLogo).digest("hex");
let logoPath;
for (const theme of ["light", "dark"]) {
  const logo = await readFile(resolve(directory, `assets/site/logo-${theme}.svg`), "utf8");
  assert.doesNotMatch(logo, /<filter\b|<fe\w+\b|<image\b|<mask\b|filter=|mask=/, "Logo uses a direct vector path without filters, masks or bitmap images");
  assert.ok(logo.includes(`data-source-sha256="${logoSourceHash}"`), "Logo is derived from the current original artwork");
  const paths = [...logo.matchAll(/<path\b[^>]*d="([^"]+)"/g)];
  assert.equal(paths.length, 1, "Logo artwork is merged into one compound vector path");
  if (logoPath) assert.equal(paths[0][1], logoPath, "Both themes use identical artwork");
  logoPath = paths[0][1];
}

async function checkReflow(page, description) {
  if (await page.locator("body.header-overlay-ready").count()) await page.waitForFunction(() => document.querySelector(".site-masthead").getBoundingClientRect().height <= document.querySelector(".hero-slide.is-active .hero-content").getBoundingClientRect().top + scrollY, null, { timeout: 5000 });
  const overflow = await page.evaluate(() => {
    const problems = [];
    if (document.documentElement.scrollWidth > innerWidth + 1) {
      problems.push("Page overflow");
      for (const element of document.body.querySelectorAll("*")) {
        if (!element.checkVisibility({ checkVisibilityCSS: true, checkOpacity: true }) || element.closest(".scientists-table-scroll,[aria-hidden='true']")) continue;
        const bounds = element.getBoundingClientRect();
        if (bounds.right > innerWidth + 1) problems.push(`${element.tagName}.${element.className}: ${Math.round(bounds.right)}`);
      }
    }
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.textContent.trim() || node.parentElement.closest("script,style,.visually-hidden,.skip-link,.scientists-table-scroll,.image-card-track,.news-card-track,[aria-hidden='true']")) continue;
      if (!node.parentElement.checkVisibility({ checkVisibilityCSS: true, checkOpacity: true })) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      if ([...range.getClientRects()].some(rect => rect.width > 0 && (rect.left < -1 || rect.right > innerWidth + 1))) problems.push(node.textContent.trim().slice(0, 80));
    }
    // Image strips intentionally scroll horizontally; verify their captions wrap
    // within each card instead of treating off-screen slides as page overflow.
    document.querySelectorAll(".image-card-track > li, .news-card-track > li").forEach(card => {
      const bounds = card.getBoundingClientRect();
      const text = document.createTreeWalker(card, NodeFilter.SHOW_TEXT);
      while (text.nextNode()) {
        if (!text.currentNode.textContent.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(text.currentNode);
        if ([...range.getClientRects()].some(rect => rect.width > 0 && (rect.left < bounds.left - 1 || rect.right > bounds.right + 1))) problems.push(`Image card caption: ${text.currentNode.textContent.trim()}`);
      }
    });
    return problems;
  });
  assert.deepEqual(overflow, [], description);
}

async function scan(page, file, theme, contrast) {
  await page.evaluate(axe);
  const result = await page.evaluate(() => window.axe.run({ runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } }));
  reports.push({ file, theme, contrast, violations: result.violations, incomplete: result.incomplete });
  for (const violation of result.violations) {
    const message = `${file} ${theme}/${contrast}: ${violation.id}: ${violation.nodes.map(node => node.target.join(" ")).join(", ")}`;
    if (contrast === "standard" && violation.id === "color-contrast") standardContrastWarnings.push(message);
    else failures.push(message);
  }
}

async function checkNavigationHover(page, contrast) {
  const targets = [page.locator(".desktop-navigation a[href='press.html']"), page.locator(".desktop-navigation .primary-nav .nav-group > a").first(), page.locator(".utility-social-link").first()];
  for (const target of targets) {
    await target.hover();
    const appearance = await target.evaluate(element => {
      const style = getComputedStyle(element);
      return { color: style.color, decoration: style.textDecorationLine, opacity: style.opacity };
    });
    if (contrast === "standard") {
      assert.equal(appearance.color, "rgb(217, 156, 43)", "Menu and social icon hover uses brand yellow in both themes");
      assert.equal(appearance.decoration, "none", "Standard hover has no underline");
      assert.equal(appearance.opacity, "1", "Social icons do not fade on hover");
    } else {
      assert.notEqual(appearance.color, "rgb(217, 156, 43)", "High contrast retains its readable colours");
    }
  }
  await page.mouse.move(0, 0);
  await page.waitForFunction(() => !document.querySelector(".desktop-navigation details[data-hover-opened][open]"));
}

async function checkCarousel(page, file, theme, contrast) {
  const hero = page.locator(".hero");
  const active = hero.locator(".hero-slide.is-active");
  const markers = hero.locator(".carousel-page");
  const expected = [
    ["4_Euclid-EWS-DR1-NorthPR_M81NGC3077-R3-EQU-16K9K.4K.webp", "dr1-data.html"],
    ["strong-gravitational-lenses.webp", "science.html"],
    ["09-galactic-bulge.webp", "q2release.html"],
    ["05-messier-78.webp", "science.html"]
  ];
  assert.equal(await hero.locator(".hero-slide").count(), 4);
  const slideEdges = await hero.evaluate(element => {
    const bounds = element.getBoundingClientRect();
    return [element.querySelector(".hero-stage"), element.querySelector(".hero-slide.is-active"), element.querySelector(".hero-visual.is-active")].map(layer => {
      const rect = layer.getBoundingClientRect();
      return Math.abs(rect.left - bounds.left) < 1 && Math.abs(rect.right - bounds.right) < 1;
    });
  });
  assert.ok(slideEdges.every(Boolean), "Text and images share the full banner width, so outgoing text reaches the image edge before being clipped");
  assert.equal(await hero.locator(".carousel-pagination").evaluate(element => getComputedStyle(element).backgroundColor), "rgba(0, 0, 0, 0)", "Slide dots have no rectangular background panel");
  const height = await hero.evaluate(element => element.getBoundingClientRect().height);
  for (const [index, [image, href]] of expected.entries()) {
    await markers.nth(index).focus();
    await page.keyboard.press("Enter");
    assert.equal(await active.count(), 1);
    if (href) {
      const headingLeft = await active.locator(".hero-title").evaluate(element => element.getBoundingClientRect().left);
      const logoLeft = await page.locator(".brand").evaluate(element => element.getBoundingClientRect().left);
      assert.ok(Math.abs(headingLeft - logoLeft) < 1, "Banner headings align with the logo's left edge");
      assert.equal(await active.getByRole("link").first().getAttribute("href"), href);
    }
    assert.equal(await hero.getAttribute("data-active-slide"), String(index));
    assert.equal(await hero.locator(".hero-visual.is-active .hero-image").getAttribute("src"), `${index === 1 ? "images/news/dr1-foundation" : "images/euclid-gallery"}/${image}`);
    assert.equal(await hero.locator(".hero-slide[inert][aria-hidden='true']").count(), 3);
    assert.equal(await active.getByRole("link").count(), index <= 1 ? 2 : 1, "Only the active slide exposes its calls to action");
    assert.equal(await hero.locator(".carousel-page[aria-current='true']").count(), 1);
    assert.ok(Math.abs(await hero.evaluate(element => element.getBoundingClientRect().height) - height) < 1, "Slide changes do not make the page jump");
    assert.match(await hero.locator("[data-carousel-status]").innerText(), new RegExp(`^Slide ${index + 1} of 4:`));
    await checkReflow(page, `${file} slide ${index + 1} ${contrast}`);
    if (index > 0) await scan(page, file, theme, `${contrast}-slide-${index + 1}`);
    if (index === 2 && contrast === "standard") {
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: resolve(output, `carousel-bulge-${theme}.png`) });
    }
  }
  await hero.getByRole("button", { name: "Next slide", exact: true }).focus();
  await page.keyboard.press("Enter");
  assert.equal(await hero.getAttribute("data-active-slide"), "0", "Next wraps to the first slide");
  await hero.getByRole("button", { name: "Previous slide", exact: true }).focus();
  await page.keyboard.press("Space");
  assert.equal(await hero.getAttribute("data-active-slide"), "3", "Previous wraps to the last slide");
  await markers.nth(3).focus();
  await page.keyboard.press("Home");
  assert.equal(await hero.getAttribute("data-active-slide"), "0");
  assert.ok(await markers.nth(0).evaluate(element => element === document.activeElement));
  await page.keyboard.press("ArrowRight");
  assert.equal(await hero.getAttribute("data-active-slide"), "1");
  await page.keyboard.press("End");
  assert.equal(await hero.getAttribute("data-active-slide"), "3");
  await page.keyboard.press("Home");
  const stage = hero.locator(".hero-stage");
  await stage.dispatchEvent("pointerdown", { pointerType: "touch", isPrimary: true, pointerId: 7, clientX: 220, clientY: 500 });
  await stage.dispatchEvent("pointermove", { pointerType: "touch", isPrimary: true, pointerId: 7, clientX: 90, clientY: 505 });
  assert.equal(await hero.getAttribute("data-carousel-motion"), "dragging", "Touch dragging follows the finger before release");
  await stage.dispatchEvent("pointerup", { pointerType: "touch", pointerId: 7, clientX: 90, clientY: 505 });
  assert.equal(await hero.getAttribute("data-active-slide"), "1", "A horizontal touch gesture advances the slide");
  await stage.dispatchEvent("pointerdown", { pointerType: "touch", isPrimary: true, pointerId: 8, clientX: 200, clientY: 500 });
  await stage.dispatchEvent("pointerup", { pointerType: "touch", pointerId: 8, clientX: 195, clientY: 350 });
  assert.equal(await hero.getAttribute("data-active-slide"), "1", "Vertical scrolling does not change slides");
  await markers.nth(0).click();
  await page.evaluate(() => scrollTo(0, 0));
}

async function checkImageCardCarousel(page) {
  const carousel = page.locator("[data-image-card-carousel]");
  const track = carousel.locator(".image-card-track");
  assert.ok(await track.evaluate(element => {
    const bounds = element.getBoundingClientRect();
    return Math.abs(bounds.left) < 1 && Math.abs(bounds.right - document.documentElement.clientWidth) < 1;
  }), "The carousel viewport spans the window without inset clipping");
  assert.equal(await carousel.getByRole("heading", { name: "Here’s looking at Euclid", exact: true }).count(), 1);
  assert.equal(await page.title(), "Euclid UK", "The homepage browser title is exactly Euclid UK");
  assert.equal(await track.locator("li").count(), imageReleases.length);
  const dates = await track.locator("li").evaluateAll(items => items.map(item => item.dataset.releaseDate));
  assert.deepEqual(dates, [...dates].sort().reverse(), "Image releases run newest first");
  assert.equal(await track.getByRole("link").count(), 0, "Gallery images are not clickable");
  assert.equal(await track.getAttribute("tabindex"), "0", "The gallery remains keyboard scrollable without image links");
  assert.deepEqual(await track.locator("img").evaluateAll(images => images.map(image => image.getAttribute("src"))), imageReleases.map(image => image.thumbnail), "Every release in the catalogue appears once");
  assert.equal(await carousel.locator(".image-card-credits").count(), 0, "The credits disclosure has been removed");
  assert.equal(await carousel.locator(".image-card-introduction").innerText(), "Explore a gallery of our favourite images from the Euclid mission so far.");
  assert.equal(await carousel.locator("[data-image-scroll-toggle], [data-image-scroll-option]").count(), 0, "No pause/resume control is displayed");
  assert.equal(await track.evaluate(element => getComputedStyle(element).overflowX), "auto", "Hiding the scrollbar retains native scrolling");
  assert.equal(await track.evaluate(element => getComputedStyle(element).scrollbarWidth), "none", "The visual scrollbar is hidden");
  assert.equal(await track.locator("figcaption p").count(), 0, "Image cards show object names without secondary captions");
  assert.equal(await page.locator("#stories-title").textContent(), "Latest news");
  assert.equal(await page.locator(".cosmic-banner").count(), 0, "The former dark-matter banner has been replaced");
  const next = carousel.getByRole("button", { name: "Next images", exact: true });
  const previous = carousel.getByRole("button", { name: "Previous images", exact: true });
  await track.evaluate(element => { element.scrollLeft = 0; });
  await page.waitForFunction(() => document.querySelector('[data-image-card-direction="-1"]').getAttribute("aria-disabled") === "true");
  await next.focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.querySelector(".image-card-track").scrollLeft > 20);
  await page.waitForFunction(() => document.querySelector("[data-image-card-status]").textContent.startsWith("Images "));
  assert.ok(await next.evaluate(element => element === document.activeElement), "Image carousel keeps focus on its navigation button");
  await previous.focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.querySelector(".image-card-track").scrollLeft < 2);
  await track.evaluate(element => { element.scrollLeft = 0; });
  await page.evaluate(() => scrollTo(0, 0));
}

async function checkNewsCardCarousel(page) {
  const carousel = page.locator("[data-news-card-carousel]");
  const track = carousel.locator(".news-card-track");
  assert.ok(await track.evaluate(element => {
    const bounds = element.getBoundingClientRect();
    return Math.abs(bounds.left) < 1 && Math.abs(bounds.right - document.documentElement.clientWidth) < 1;
  }), "The carousel viewport spans the window without inset clipping");
  const expected = ["dr1-foundation.html", "royal-society-exhibition.html", "q1-release.html"];
  assert.deepEqual(await track.locator(".news-story-card > a").evaluateAll(links => links.map(link => link.getAttribute("href"))), expected, "Homepage news matches Latest News in chronological order");
  assert.equal(await carousel.getByRole("link", { name: "All news", exact: true }).count(), 0, "The All news button has been removed");
  assert.equal(await page.locator(".stories .story-grid").count(), 0, "The former generic stories are replaced");
  assert.equal(await track.locator("h3").count(), 3);
  assert.deepEqual(await track.locator("time").evaluateAll(dates => dates.map(date => date.dateTime)), ["2026-11-10", "2026-07-15", "2025-03"]);
  await track.evaluate(element => { element.scrollLeft = 0; });
  const overflow = await track.evaluate(element => element.scrollWidth > element.clientWidth + 2);
  if (overflow) {
    const next = carousel.getByRole("button", { name: "Next stories", exact: true });
    const previous = carousel.getByRole("button", { name: "Previous stories", exact: true });
    await next.focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.querySelector(".news-card-track").scrollLeft > 20);
    assert.ok(await next.evaluate(element => element === document.activeElement));
    await previous.focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.querySelector(".news-card-track").scrollLeft < 2);
    await track.locator(".news-story-card > a").last().focus();
    assert.ok(await track.locator(".news-story-card > a").last().evaluate(element => {
      const box = element.getBoundingClientRect(), viewport = element.closest(".news-card-track").getBoundingClientRect();
      return box.left >= viewport.left - 1 && box.right <= viewport.right + 1;
    }), "Keyboard focus reveals the last news card");
  } else assert.ok(await carousel.locator(".news-card-controls").isHidden(), "Unneeded carousel controls stay hidden when all stories fit");
  await track.evaluate(element => { element.scrollLeft = 0; });
  await page.evaluate(() => scrollTo(0, 0));
}

async function checkImageCardAutoscroll() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "no-preference" });
  const page = await context.newPage();
  await page.goto(pageUrl("index.html"));
  const carousel = page.locator("[data-image-card-carousel]");
  const track = carousel.locator(".image-card-track");
  const running = () => page.waitForFunction(() => document.querySelector("[data-image-card-carousel]").dataset.imageAutoScroll === "running");
  const paused = () => page.waitForFunction(() => document.querySelector("[data-image-card-carousel]").dataset.imageAutoScroll === "paused");
  const scrollPosition = () => track.evaluate(element => element.scrollLeft);
  const staysStill = async message => {
    const before = await scrollPosition();
    await page.waitForTimeout(600);
    assert.ok(Math.abs(await scrollPosition() - before) < 1, message);
  };
  await page.mouse.move(5, 5);
  await carousel.scrollIntoViewIfNeeded();
  await running();
  await page.waitForFunction(() => document.querySelector(".image-card-track").scrollLeft > 12);
  const frames = await track.locator("li").first().evaluate(element => new Promise(resolve => {
    const positions = [];
    const sample = () => { positions.push(element.getBoundingClientRect().left); if (positions.length < 20) requestAnimationFrame(sample); else resolve(positions); };
    requestAnimationFrame(sample);
  }));
  assert.ok(frames.some((position, index) => index && frames[index - 1] - position > 0 && frames[index - 1] - position < 1), "Automatic scrolling preserves fractional-pixel movement");
  assert.equal(await carousel.locator("[data-image-card-status]").textContent(), "", "Automatic movement does not repeatedly announce images");
  assert.equal(await carousel.getByRole("button", { name: "Resume scrolling" }).count(), 0);
  await track.hover();
  await track.dispatchEvent("wheel", { deltaX: 30 });
  await paused();
  await staysStill("Manual scrolling pauses the strip even with the pointer over it");
  await running();
  assert.ok(await track.evaluate(element => element.matches(":hover")), "Scrolling resumes after idle even when the pointer remains over the cards");
  await page.mouse.move(5, 5);
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForFunction(() => document.querySelector("[data-image-card-carousel]").dataset.imageAutoScroll === "idle");
  await staysStill("An off-screen strip does not move");
  await carousel.scrollIntoViewIfNeeded();
  await running();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() => document.querySelector("[data-image-card-carousel]").dataset.imageAutoScroll === "idle");
  await staysStill("Changing the reduced-motion setting immediately stops scrolling");
  await page.emulateMedia({ reducedMotion: "no-preference", forcedColors: "active" });
  await staysStill("Forced colours keep the strip static");
  await page.emulateMedia({ forcedColors: "none" });
  await running();
  await track.dispatchEvent("pointerdown", { pointerType: "touch", pointerId: 20, isPrimary: true });
  await paused();
  await staysStill("Touch immediately pauses automatic movement");
  await track.dispatchEvent("pointercancel", { pointerType: "touch", pointerId: 20 });
  await track.evaluate(element => { element.scrollLeft += 90; });
  await page.waitForTimeout(900);
  await track.evaluate(element => { element.scrollLeft += 90; });
  await page.waitForTimeout(900);
  assert.equal(await carousel.getAttribute("data-image-auto-scroll"), "paused", "Continued manual scrolling resets the idle delay");
  await running();
  const next = carousel.getByRole("button", { name: "Next images", exact: true });
  await page.keyboard.press("Tab");
  await next.focus();
  await paused();
  const beforeManual = await scrollPosition();
  await page.keyboard.press("Enter");
  await page.waitForFunction(before => document.querySelector(".image-card-track").scrollLeft > before + 50, beforeManual);
  await page.waitForTimeout(2100);
  assert.equal(await carousel.getAttribute("data-image-auto-scroll"), "paused", "Keyboard focus protects the reader after the idle delay");
  await next.evaluate(element => element.blur());
  await running();
  await track.dispatchEvent("wheel", { deltaX: 30 });
  await paused();
  await staysStill("Wheel input pauses automatic movement");
  await running();
  const news = page.locator(".news-card-track");
  await page.setViewportSize({ width: 390, height: 844 });
  await news.scrollIntoViewIfNeeded();
  const newsPosition = await news.evaluate(element => element.scrollLeft);
  await page.waitForTimeout(1800);
  assert.equal(await news.evaluate(element => element.scrollLeft), newsPosition, "News cards never scroll automatically, even when motion is allowed");
  await context.close();
}

async function checkResourceFilters(page) {
  const library = page.locator("[data-resource-library]");
  const items = library.locator("[data-resource-item]");
  assert.equal(await items.count(), 8, "The eight featured resource cards remain available");
  assert.equal(await library.getByRole("heading", { name: "Primary Schools", exact: true }).count(), 0, "Audience tags replace the Primary Schools heading");
  const spaceWarps = items.filter({ has: page.getByRole("heading", { name: "Zooniverse - Space Warps", exact: true }) });
  assert.equal(await spaceWarps.count(), 1, "Space Warps appears once in the library");
  assert.ok(await spaceWarps.evaluate(element => element.classList.contains("school-resource")), "Space Warps shares the ESERO card layout");
  assert.equal(await spaceWarps.locator("img").getAttribute("src"), "images/resources/space-warps.png", "Space Warps uses the supplied image");
  assert.equal(await spaceWarps.getByRole("link", { name: /^Zooniverse - Space Warps/ }).getAttribute("href"), "https://www.zooniverse.org/projects/aprajita/space-warps-esa-euclid");
  assert.ok(await spaceWarps.locator(".resource-tags").getByText("Citizen science", { exact: true }).isVisible());
  assert.ok(await spaceWarps.locator(".resource-tags").getByText("Public engagement", { exact: true }).isVisible());
  const gravyLensing = items.filter({ has: page.getByRole("heading", { name: "GravyLensing", exact: true }) });
  assert.equal(await gravyLensing.count(), 1, "GravyLensing appears once in the library");
  assert.equal(await gravyLensing.getByRole("link").getAttribute("href"), "https://willjroper.github.io/GravyLensing/");
  assert.equal(await gravyLensing.locator("img").getAttribute("src"), "images/resources/gravylensing-logo.webp");
  const gravyLensingApp = items.filter({ has: page.getByRole("heading", { name: "Warp your selfies!", exact: true }) });
  assert.equal(await gravyLensingApp.count(), 1);
  assert.equal(await gravyLensingApp.getByRole("link").getAttribute("href"), "https://apps.apple.com/gb/app/gravylensing/id6783065795");
  const buildEuclid = items.filter({ has: page.getByRole("heading", { name: "Build your own Euclid!", exact: true }) });
  assert.equal(await buildEuclid.count(), 1);
  assert.equal(await buildEuclid.locator("a, button, [tabindex]").count(), 0, "The coming-soon card does not expose an inactive control");
  assert.ok(await buildEuclid.getByText("Coming soon", { exact: true }).isVisible());
  const artifactInspector = items.filter({ has: page.getByRole("heading", { name: "Zooniverse - Artifact InSPECtor", exact: true }) });
  assert.equal(await artifactInspector.count(), 1);
  assert.equal(await artifactInspector.getByRole("link").getAttribute("href"), "https://www.zooniverse.org/projects/artifact-pipeline/artifact-inspector");
  const imageExplorer = items.filter({ has: page.getByRole("heading", { name: "Explore Euclid’s first mosaic", exact: true }) });
  assert.equal(await imageExplorer.count(), 1);
  assert.equal(await imageExplorer.getByRole("link").getAttribute("href"), "https://willjroper.github.io/explore-euclid-imaging/");
  const huntDarkMatter = items.filter({ has: page.getByRole("heading", { name: "The Hunt for Dark Matter", exact: true }) });
  assert.equal(await huntDarkMatter.count(), 1);
  assert.equal(await huntDarkMatter.getByRole("link").getAttribute("href"), "https://gravitational-lensing.explored.info");
  for (const [value, label, expected] of [["primary", "Primary school", 2], ["secondary", "Secondary school", 2], ["citizen-science", "Citizen science", 2], ["public", "Public engagement", 6], ["all", "All", 8]]) {
    const button = library.getByRole("button", { name: label, exact: true });
    await button.focus();
    await page.keyboard.press("Enter");
    assert.equal(await button.getAttribute("aria-pressed"), "true");
    assert.equal(await library.locator("[data-resource-filter][aria-pressed='true']").count(), 1);
    assert.ok(await button.evaluate(element => element === document.activeElement), "Filtering retains keyboard focus");
    assert.equal(await library.locator("[data-resource-item]:visible").count(), expected);
    assert.ok(await items.evaluateAll((elements, audience) => elements.every(element => element.hidden === (audience !== "all" && !element.dataset.audiences.split(" ").includes(audience))), value));
    assert.equal(await library.locator("[data-resource-status]").textContent(), `Showing resources for ${value === "all" ? "all audiences" : label.toLocaleLowerCase()}.`);
    assert.equal(await huntDarkMatter.isVisible(), ["all", "secondary", "public"].includes(value), "Hunt for Dark Matter appears under All, Secondary school and Public engagement");
    assert.equal(await imageExplorer.isVisible(), ["all", "public"].includes(value), "The first mosaic appears under All and Public engagement");
    assert.equal(await gravyLensing.isVisible(), ["all", "public"].includes(value), "GravyLensing appears under All and Public engagement");
    assert.equal(await gravyLensingApp.isVisible(), ["all", "public"].includes(value), "The GravyLensing app appears under All and Public engagement");
    assert.equal(await buildEuclid.isVisible(), ["all", "primary", "public"].includes(value), "Build your own Euclid appears under All, Primary school and Public engagement");
    assert.equal(await artifactInspector.isVisible(), ["all", "citizen-science"].includes(value), "Artifact InSPECtor appears under All and Citizen science");
    assert.equal(await spaceWarps.isVisible(), ["all", "secondary", "citizen-science", "public"].includes(value), "Space Warps appears in its matching categories");
    assert.equal(await library.locator(".school-resource").filter({ has: page.locator("#esero-euclid-title") }).isVisible(), value === "primary" || value === "all", "The primary teaching pack appears in its matching audience");
    assert.ok(await library.locator("[data-resource-section]").evaluateAll(sections => sections.every(section => section.hidden === !section.querySelector("[data-resource-item]:not([hidden])"))), "Sections with no matching items are hidden");
  }
  assert.equal(await items.locator(".resource-tags").count(), 8, "Every resource has visible audience tags");
}

async function checkSearch(page, file, theme, contrast) {
  const navigationKey = browserEngine === "webkit" ? "Alt+Tab" : "Tab";
  const trigger = page.getByRole("button", { name: "Search", exact: true }).first();
  const form = page.getByRole("search", { name: "Search Euclid UK", exact: true });
  const results = page.getByRole("region", { name: "Search results", exact: true });
  await trigger.focus();
  await page.keyboard.press("Enter");
  assert.ok(await form.isVisible());
  assert.equal(await page.locator("dialog[open]").count(), 0, "Search is inline, not a modal");
  assert.equal(await trigger.getAttribute("aria-expanded"), "true");
  assert.equal(await trigger.locator(".control-panel").count(), 1, "Search uses the appropriate spacecraft decoration");
  if (contrast === "standard" && theme === "light") await page.screenshot({ path: resolve(output, "search-inline.png") });
  const input = form.getByRole("searchbox", { name: "Search Euclid UK" });
  {
    const fieldBounds = await form.boundingBox();
    const buttonBounds = await trigger.boundingBox();
    assert.ok(fieldBounds.x < buttonBounds.x && fieldBounds.x + fieldBounds.width < buttonBounds.x, "Search overlays the menu area with space before the separate trigger");
    assert.equal(await form.evaluate(element => getComputedStyle(element).backgroundColor), theme === "dark" ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)", "Search background follows the light/dark theme");
    if (theme === "dark") assert.equal(await input.evaluate(element => getComputedStyle(element).color), "rgb(255, 255, 255)", "Dark search text is white");
    assert.ok(Math.abs(fieldBounds.height - buttonBounds.height) < 1, "Search field and trigger have matching heights");
    const searchColours = await trigger.evaluate(element => ({ accent: getComputedStyle(element.querySelector(".control-panel-fold")).backgroundColor, border: getComputedStyle(document.querySelector(".site-search-form")).borderTopColor }));
    const focusAppearance = await form.evaluate(element => ({ outline: getComputedStyle(element).outlineStyle, border: getComputedStyle(element).borderTopColor, shadow: getComputedStyle(element).boxShadow, focus: getComputedStyle(element).getPropertyValue("--search-focus").trim() }));
    assert.equal(focusAppearance.outline, "none", "Search has no second outline outside its border");
    assert.equal(focusAppearance.border, searchColours.accent, "Focused search border matches the icon accent");
    assert.match(focusAppearance.shadow, /inset/, "Keyboard focus thickens the existing search border inward");
    await form.getByRole("button", { name: "Close search" }).focus();
    assert.equal(await form.evaluate(element => getComputedStyle(element).borderTopColor), searchColours.accent, "Unfocused search border matches the trigger accent");
    await input.focus();
    assert.ok(await page.locator(".header-tools > .menu, .header-tools > .desktop-navigation").evaluateAll(elements => elements.every(element => element.inert)), "Covered navigation cannot receive keyboard focus");
  }
  assert.ok(await input.evaluate(element => element === document.activeElement));
  await input.fill("dark matter");
  await input.press("Enter");
  assert.ok(await results.getByRole("link", { name: "Dark Matter", exact: false }).count() > 0);
  assert.ok((await results.locator(".search-status").innerText()).includes("results"));
  await scan(page, file, theme, `${contrast}-search`);
  await input.focus();
  await page.keyboard.press(navigationKey);
  assert.ok(await form.getByRole("button", { name: "Close search" }).evaluate(element => element === document.activeElement));
  await page.keyboard.press(navigationKey);
  assert.ok(await trigger.evaluate(element => element === document.activeElement));
  await page.keyboard.press(navigationKey);
  assert.ok(await results.locator("a").first().evaluate(element => element === document.activeElement), "Results can be reached by keyboard");
  await input.fill("zzzznoresult");
  await input.press("Enter");
  assert.match(await results.locator(".search-status").innerText(), /^No results/);
  assert.equal(await results.getByRole("link").count(), 0);
  await input.fill("orbit");
  await input.press("Enter");
  assert.ok(await results.locator("a[href='orbit.html']").count() > 0);
  if (contrast === "standard" && theme === "light") await page.screenshot({ path: resolve(output, "search-results.png") });
  await page.keyboard.press("Escape");
  assert.ok(await form.isHidden());
  assert.equal(await trigger.getAttribute("aria-expanded"), "false");
  assert.ok(await trigger.evaluate(element => element === document.activeElement));
  await trigger.press("Enter");
  assert.equal(await input.inputValue(), "orbit", "The search query is preserved when reopening");
  await form.getByRole("button", { name: "Close search", exact: true }).click();
  assert.ok(await trigger.evaluate(element => element === document.activeElement));
}

try {
  if (!process.env.EUCLID_SITE_PAGE || process.env.EUCLID_SITE_PAGE === "humans.html") {
    const { checkPeopleGalaxy } = await import("./check_people_galaxy.mjs");
    reports.push(...await checkPeopleGalaxy({ browser, base: previewBase, axe, output: resolve(output, "people-galaxy") }));
    console.log("Checked fingerprint profiles: all portraits, hover, click, keyboard, touch, reflow and fallback.");
  }
  if (!process.env.EUCLID_SITE_PAGE || process.env.EUCLID_SITE_PAGE === "fingertip-galaxy.html") {
    const { checkFingertipGalaxy } = await import("./check_fingertip_galaxy.mjs");
    reports.push(...await checkFingertipGalaxy({ browser, base: previewBase, axe, output: resolve(output, "fingertip-galaxy") }));
    console.log("Checked Fingertip Galaxy: vector artwork, transcript, keyboard, reflow, themes and no-script fallback.");
  }
  for (const file of pages) {
    const source = await readFile(resolve(directory, file), "utf8");
    for (const match of source.matchAll(/(?:href|src)="([^\"]+)"/g)) {
      if (/^(?:https?:|mailto:|tel:|#|\?)/.test(match[1])) continue;
      await access(resolve(directory, decodeURIComponent(match[1].split(/[?#]/)[0])));
    }
    for (const theme of ["light", "dark"]) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce", colorScheme: theme });
      await context.route(/^https?:/, route => previewBase && new URL(route.request().url()).origin === new URL(previewBase).origin ? route.continue() : route.abort());
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto(pageUrl(file));
      await page.evaluate(() => document.fonts.ready);
      if (file === "resources.html") {
        const schools = page.getByRole("region", { name: "Featured resources", exact: true });
        assert.ok(await schools.isVisible());
        await checkResourceFilters(page);
        const teachingResources = schools.getByRole("link", { name: /ESERO-UK Euclid Primary Resources/ });
        assert.equal(await teachingResources.getAttribute("href"), "https://www.stem.org.uk/all-news/euclid-teaching-resources");
        assert.equal(await teachingResources.locator("img").getAttribute("src"), "images/resources/esero-team-logo.svg");
        await teachingResources.locator("img").scrollIntoViewIfNeeded();
        await teachingResources.locator("img").evaluate(image => image.decode());
        assert.ok(await teachingResources.locator("img").evaluate(image => image.complete && image.naturalWidth === 600), "The ESERO tile artwork loads");
        const spaceWarps = schools.getByRole("link", { name: /^Zooniverse - Space Warps/ });
        await spaceWarps.locator("img").evaluate(image => image.decode());
        assert.ok(await spaceWarps.locator("img").evaluate(image => image.complete && image.naturalWidth === 190), "The supplied Space Warps image loads");
        await teachingResources.focus();
        assert.ok(await teachingResources.evaluate(element => element === document.activeElement), "School resources are keyboard accessible");
        const searchIndex = JSON.parse(await page.locator("#site-search-index").textContent());
        assert.ok(searchIndex.find(entry => entry.href === "resources.html").text.includes("ESERO-UK Euclid Primary Resources"), "School resources are included in site search");
        assert.equal(await page.locator("[data-resource-library] .chapter-grid").count(), 0, "The requested older resource sections and their items have been removed");
      }
      assert.ok(await page.locator(".site-footer h2").evaluateAll(headings => headings.length > 0 && headings.every(heading => {
        const style = getComputedStyle(heading);
        return style.fontFamily.startsWith("Anton") && style.fontWeight === "400";
      })), `${file}: footer headings use regular Anton`);
      assert.equal(await page.locator('a[href="faqs.html"]').count(), 0, "Inactive FAQs is absent from shared links");
      const socialNavigation = page.getByRole("navigation", { name: "Euclid UK social media", exact: true });
      assert.equal(await socialNavigation.getByRole("link").count(), 3);
      for (const platform of ["Instagram", "Bluesky", "LinkedIn"]) {
        const socialLink = socialNavigation.getByRole("link", { name: `Euclid UK on ${platform}`, exact: true });
        const footerLink = page.locator(".site-footer-socials").getByRole("link", { name: `Euclid UK on ${platform}`, exact: true });
        assert.equal(await socialLink.getAttribute("href"), await footerLink.getAttribute("href"), `${platform}: top-bar link matches the existing footer`);
        assert.equal(await socialLink.locator("svg").getAttribute("aria-hidden"), "true");
        assert.equal(await socialLink.locator("svg").getAttribute("focusable"), "false");
        assert.ok(await socialLink.evaluate(element => {
          const bounds = element.getBoundingClientRect();
          return bounds.width >= 44 && bounds.height >= 44;
        }), `${platform}: usable pointer target`);
        await socialLink.focus();
        assert.ok(await socialLink.evaluate(element => element === document.activeElement), `${platform}: keyboard access`);
      }
      assert.ok(await socialNavigation.evaluate(element => element.getBoundingClientRect().right <= element.nextElementSibling.getBoundingClientRect().left), "Social icons sit to the left of FAQs");
      assert.equal(await page.locator('.desktop-navigation .nav-group > a[href="science.html"]').count(), 1);
      for (const id of ["dark-matter", "dark-energy"]) {
        assert.equal(await page.locator(`.desktop-navigation .nav-submenu a[href="science.html#${id}"]`).count(), 1);
        if (file === "science.html") assert.equal(await page.locator(`#${id}`).count(), 1);
      }
      assert.equal(await page.locator('.desktop-navigation .nav-submenu a[href="euclid-orbit.html"]').count(), 1);
      assert.equal(await page.locator('a[href="technology.html"], a[href="euclid-technology.html"], a[href="science.html#story"]').count(), 0, "Coming-soon controls have no destination");
      const techStatus = page.locator('.desktop-navigation .nav-group > button.coming-soon-control').filter({hasText: 'The Tech'});
      assert.equal(await techStatus.count(), 1);
      assert.equal(await techStatus.getAttribute('aria-disabled'), 'true');
      await techStatus.hover();
      assert.equal(await techStatus.locator('.coming-soon-original').evaluate(e=>getComputedStyle(e).opacity), '0');
      assert.equal(await techStatus.locator('.coming-soon-hover').evaluate(e=>getComputedStyle(e).opacity), '1');
      assert.equal(await techStatus.locator('.coming-soon-hover').innerText(), 'COMING SOON');
      assert.equal(await techStatus.locator('.coming-soon-hover').evaluate(e=>getComputedStyle(e).fontFamily), await techStatus.locator('.coming-soon-original').evaluate(e=>getComputedStyle(e).fontFamily));
      await page.mouse.move(0, 700);
      await techStatus.focus();
      assert.equal(await techStatus.locator('.coming-soon-hover').evaluate(e=>getComputedStyle(e).opacity), '1', "Focus exposes the same status");
      await page.keyboard.press('Enter');
      assert.ok(page.url().includes(file), "The coming-soon control does not navigate");
      await techStatus.blur();
      if (["technology.html", "telescope.html", "big-data.html", "story.html"].includes(file)) {
        assert.match(await page.locator("main").innerText(), /Coming soon/);
        assert.equal(await page.locator("main iframe").count(), 0, "Coming-soon pages do not load archived content");
      }
      if (file === "science.html") {
        assert.equal(await page.locator('.mission-video iframe[title]').count(), 2);
        assert.equal(await page.locator('#introduction .science-video-cards iframe').count(), 2, "Both videos appear together beside the introduction");
        assert.equal(await page.locator('#dark-matter .mission-video, #dark-energy .mission-video').count(), 0, "Videos are not duplicated");
        assert.equal(await page.locator('.page-hero > p').last().innerText(), "Learn more about Euclid's core science goals and how the UK is contributing to uncovering the mysteries of the dark Universe.");
        assert.equal(await page.locator('#story, #orbit').count(), 0, "Removed story and orbit sections stay absent");
        const introCopy = await page.locator('.science-introduction-copy').boundingBox();
        const introVideos = await page.locator('.science-video-cards').boundingBox();
        assert.ok(introVideos.x >= introCopy.x + introCopy.width, "Videos sit to the right of the introduction on desktop");
        assert.equal(await page.locator('.science-video-cards iframe').first().evaluate(e=>getComputedStyle(e).borderTopLeftRadius), "12px", "Video cards have rounded corners");
        assert.deepEqual(await page.locator('.science-video-cards figcaption a').allTextContents(), ['WHAT IS DARK MATTER?', 'WHAT IS DARK ENERGY?']);
        for (const caption of await page.locator('.science-video-cards figcaption a').all()) {
          assert.equal(await caption.evaluate(e=>getComputedStyle(e).textDecorationLine), 'none');
          assert.equal(await caption.evaluate(e=>getComputedStyle(e).fontSize), '20px');
        }
        assert.equal(await page.locator('.science-clues-link').getAttribute('href'), 'https://www.euclid-ec.org/euclid-starts-seeing-darkness/');
        assert.doesNotMatch(await page.locator('.science-clues-guidance').innerText(), /Royal Society|exhibition/i);
        const cluesCopy = await page.locator('.cosmic-clues-copy').boundingBox();
        const cluesImage = await page.locator('.cosmic-clues-layout .matter-reveal').boundingBox();
        assert.ok(cluesImage.x >= cluesCopy.x + cluesCopy.width, "Dark matter image sits to the right of its text on desktop");
        assert.equal(await page.locator('.matter-icon-button').count(), 2);
        for (const section of await page.locator('.science-wide-section').all()) {
          const width = await section.evaluate(e=>e.clientWidth - parseFloat(getComputedStyle(e).paddingLeft) - parseFloat(getComputedStyle(e).paddingRight));
          for (const paragraph of await section.locator(':scope > p').all()) assert.ok(Math.abs((await paragraph.boundingBox()).width - width) < 1, "Lower science paragraphs use the full content width");
        }
        const reveal = page.locator('[data-matter-reveal]');
        const imageButton = reveal.locator('button.matter-frame');
        await imageButton.focus();
        await imageButton.press('ArrowRight');
        assert.equal(await imageButton.evaluate(e=>e.style.getPropertyValue('--matter-x')), '51%', "Dark matter reveal supports keyboard movement");
        assert.equal(await reveal.locator('input[type=range], figcaption').count(), 0, "Position sliders and long caption are removed");
        await imageButton.press('Enter');
        assert.equal(await imageButton.getAttribute('aria-pressed'), 'true', "Keyboard activation shows the full map");
        await imageButton.press('Enter');
        await reveal.locator('[data-matter-full]').click();
        assert.equal(await reveal.locator('[data-matter-full]').getAttribute('aria-pressed'), 'true');
        assert.ok(await reveal.evaluate(element => element.classList.contains('is-full')));
        await reveal.locator('[data-matter-full]').click();
        assert.equal(await reveal.locator('[data-matter-sound]').getAttribute('aria-pressed'), 'false', "No sound starts automatically");
      }
      await checkNavigationHover(page, "standard");
      assert.equal(await page.locator(".utility-bar").getByRole("link", { name: /Current website/ }).count(), 0);
      assert.equal(await page.locator(".primary-nav a[href='faqs.html']").count(), 0);
      assert.equal(await page.locator('.site-footer a[href="resources.html"]').innerText(), "Education", "Footer resource destination is labelled Education");
      assert.ok(!(await page.locator('#site-search-index').textContent()).includes('"href":"faqs.html"'), "Inactive FAQs is absent from search");
      assert.equal(await page.locator(".desktop-navigation a[href='press.html']").innerText(), "LATEST NEWS");
      assert.deepEqual(await page.evaluate(() => {
        const style = getComputedStyle(document.documentElement);
        return ["--surface", "--ink", "--amber", "--olive", "--blue"].map(name => style.getPropertyValue(name).trim());
      }), theme === "light"
        ? ["#f2f2f2", "#293740", "#d99c2b", "#736436", "#bbd8f2"]
        : ["#0e0a18", "#f2ead9", "#a88bd9", "#b86e36", "#e4d2f2"], `${file}: original ${theme} palette`);
      assert.equal(await page.locator(".brand :is(img, svg):visible").count(), 1, `${file}: one visible brand logo`);
      if (file === "index.html") {
        assert.equal(await page.getByText("Welcome to Euclid UK", { exact: true }).count(), 0);
        assert.equal(await page.locator(".discover, .destination-grid, .join").count(), 0, "The old curiosity cards and Stay curious block are removed");
        assert.equal(await page.locator(".mission-feature").count(), 2, "Technology and people remain separate; science is part of the introduction");
        assert.equal(await page.locator(".mission-feature-science").count(), 0);
        assert.ok((await page.locator("#welcome .welcome-science").innerText()).startsWith("Euclid is designed to explore the composition and evolution of the dark Universe."));
        for (const [name, href] of [["Contributing UK expertise", "technology.html"], ["To an international mission", "humans.html"]]) {
          const section = page.getByRole("region", { name, exact: true });
          assert.equal(await section.getByRole("heading", { level: 2, name, exact: true }).count(), 1);
          if (href === "technology.html") {
            const status = section.getByRole("button", { name: /Explore the technology/ });
            assert.equal(await status.getAttribute("aria-disabled"), "true");
            assert.equal(await status.evaluate(e=>getComputedStyle(e).borderTopWidth), "0px", "The technology placeholder has no browser-default border");
          } else assert.equal(await section.getByRole("link").getAttribute("href"), href);
          await section.locator("img").evaluate(image => { image.loading = "eager"; return image.decode(); });
          assert.ok(await section.locator("img").getAttribute("alt"), "Each section image has descriptive alternative text");
        }
        const outline = page.locator(".euclid-outline");
        assert.equal(await outline.getAttribute("aria-hidden"), "true", "The telescope is decorative; adjacent text describes the mission");
        assert.equal(await outline.getAttribute("focusable"), "false");
        assert.ok(await outline.isVisible());
        assert.equal(await outline.evaluate(element => getComputedStyle(element).color), await page.locator("#welcome-title").evaluate(element => getComputedStyle(element).color), "The outline follows each theme's text colour");
        assert.equal(await page.locator(".welcome").getAttribute("data-telescope-motion"), "static");
        await page.locator(".welcome").dispatchEvent("pointermove", { pointerType: "mouse", clientX: 1200, clientY: 600 });
        assert.equal(await outline.evaluate(element => getComputedStyle(element).transform), "none", "Reduced motion keeps the telescope still");
        const heroLogo = page.locator(".brand .hero-logo");
        assert.ok(await heroLogo.isVisible());
        assert.equal(await heroLogo.getAttribute("aria-label"), "Euclid consortium UK");
        assert.equal(await heroLogo.locator("path").getAttribute("d"), logoPath, "Header uses the sharp original vector geometry");
        const headingColour = await page.locator(".hero").evaluate(element => getComputedStyle(element).color);
        assert.equal(await heroLogo.locator("path").evaluate(element => getComputedStyle(element).fill), headingColour);
        assert.equal(await page.locator(".app-header").evaluate(element => getComputedStyle(element).color), headingColour);
        assert.equal(await page.locator(".app-header").evaluate(element => getComputedStyle(element).backgroundColor), "rgba(0, 0, 0, 0)");
        assert.ok(await page.locator(".app-header").evaluate(element => {
          const header = element.getBoundingClientRect();
          const image = document.querySelector(".hero-image").getBoundingClientRect();
          return image.top <= header.top && image.bottom > header.bottom;
        }), "Hero image extends behind the header");
      } else {
        assert.ok(await page.locator(`.brand .logo-${theme}`).isVisible());
        assert.match(await page.locator(`.brand .logo-${theme}`).getAttribute("src"), new RegExp(`^assets/site/logo-${theme}\\.svg\\?v=[a-f0-9]{12}$`));
        assert.equal(await page.locator(`.brand .logo-${theme}`).evaluate(element => getComputedStyle(element).filter), "none", "Logo cut-outs are not flattened by a CSS filter");
      }
      if (file === "press.html") {
        assert.deepEqual(await page.locator(".news-feature h2 a").evaluateAll(links => links.map(link => link.getAttribute("href"))), ["dr1-foundation.html", "royal-society-exhibition.html", "q1-release.html"], "News items appear newest first");
        assert.equal(await page.locator("section[aria-label='News items'] > .news-feature").count(), 3, "All stories share the same news-section layout");
        assert.equal(await page.locator(".news-feature").getByRole("link", { name: "Read more", exact: true }).count(), 3);
        assert.equal(await page.getByRole("link", { name: "Read the press release", exact: true }).count(), 0);
        assert.equal(await page.locator(".press-contacts").count(), 0, "Press contacts belong on For Media only");
        assert.equal(await page.getByRole("heading", { name: "Press releases", exact: true }).count(), 0);
        assert.equal(await page.locator(".news-feature h2").count(), 3, "The news-item titles follow the page heading");
        assert.ok(await page.locator(".news-feature h2").evaluateAll(elements => elements.every(element => getComputedStyle(element).textTransform === "uppercase")));
        assert.ok(await page.locator(".news-feature h2 a").evaluateAll(elements => elements.every(element => getComputedStyle(element).textDecorationLine === "none")));
        assert.equal(await page.getByRole("heading", { name: "In the media", exact: true }).count(), 1);
        const coverageDates = await page.locator(".media-coverage time").evaluateAll(elements => elements.map(element => element.dateTime));
        assert.equal(coverageDates.length, 9);
        assert.equal(await page.locator(".media-card").count(), 9, "Every media article uses a card");
        await page.locator(".media-card-logo img").evaluateAll(images => { images.forEach(image => { image.loading = "eager"; }); });
        await page.locator(".media-card-logo img").evaluateAll(images => Promise.all(images.map(image => image.decode())));
        assert.ok(await page.locator(".media-card-logo img").evaluateAll(images => images.length === 9 && images.every(image => image.naturalWidth > 0 && image.alt === "")), "Publisher logos load and visible publisher names identify them");
        assert.deepEqual(coverageDates, [...coverageDates].sort().reverse(), "Media coverage is newest first");
        assert.equal(await page.locator(".media-coverage .media-card-link[href^='https://']").count(), 9);
        assert.equal(await page.getByRole("heading", { name: "Mission updates and images", exact: true }).count(), 0);
      }
      if (file === "events.html") {
        assert.equal(await page.locator(".events-resource-grid .event-recording").count(), 12);
        const eventFilters = page.getByRole("group", { name: "Show events", exact: true });
        assert.deepEqual(await eventFilters.getByRole("button").allTextContents(), ["All", "Upcoming", "2026", "2025"]);
        const upcomingPlaceholder = page.locator('[data-events-placeholder="upcoming"]');
        assert.ok(await upcomingPlaceholder.isHidden());
        await eventFilters.getByRole("button", { name: "Upcoming", exact: true }).click();
        assert.ok(await upcomingPlaceholder.isVisible());
        assert.equal(await page.locator(".event-recording:visible").count(), 0);
        assert.equal(await page.locator(".events-header-copy > p").count(), 0);
        await eventFilters.getByRole("button", { name: "2025", exact: true }).focus();
        await page.keyboard.press("Enter");
        assert.equal(await page.locator(".event-recording:visible").count(), 4);
        assert.ok(await upcomingPlaceholder.isHidden());
        for (const [id, href] of [["event-dark-matter-detectives", "https://dynamicearth.org.uk/event/whats-up-dark-matter-detectives/"], ["event-whats-up-spring-2025", "https://www.instagram.com/p/DHWI_mRu0D1/"]]) {
          const show = page.locator(`#${id}`);
          assert.ok(await show.isVisible());
          assert.equal(await show.locator(".event-recording-tab").innerText(), "Planetarium show");
          assert.equal(await show.locator("a").getAttribute("href"), href);
        }

        const onlineRecording = page.locator("#event-seeing-into-space");
        assert.ok(await onlineRecording.isVisible());
        assert.equal(await onlineRecording.locator(".event-recording-tab").innerText(), "Watch recording");
        assert.equal(await onlineRecording.locator("a").getAttribute("href"), "https://curiousabout.glasgowsciencecentre.org/innovation/exhibits3/seeing-into-space/");

        await eventFilters.getByRole("button", { name: "Upcoming", exact: true }).click();
        assert.equal(await page.locator(".event-recording:visible").count(), 0);
        assert.ok(await page.locator("[data-resource-status]").innerText().then(text => text.includes("Dates coming soon")));
        await page.getByRole("link", { name: "London", exact: true }).click();
        assert.equal(await page.locator(".event-recording:visible").count(), 8, "Map pins reveal their year when Upcoming is selected");
        assert.equal(await eventFilters.getByRole("button", { name: "2026", exact: true }).getAttribute("aria-pressed"), "true");
        const planetarium = page.locator("#event-ai-and-the-sky");
        assert.ok(await planetarium.isVisible());
        assert.equal(await planetarium.locator(".event-recording-tab").innerText(), "Planetarium show");
        assert.equal(await planetarium.locator("a").getAttribute("href"), "https://dynamicearth.org.uk/event/whats-up-ai-and-the-sky/");
        await eventFilters.getByRole("button", { name: "All", exact: true }).click();
        const map = page.getByRole("complementary", { name: "Event locations in the United Kingdom", exact: true });
        for (const city of ["Kirkwall", "Edinburgh", "Swansea", "London"]) {
          const pin = map.getByRole("link", { name: city, exact: true });
          assert.equal(await pin.count(), 1, `${city} has a labelled map pin`);
          const target = await pin.getAttribute("href");
          assert.equal(await page.locator(target).count(), 1, "Map pin has a matching event card");
          const box = await pin.boundingBox();
          assert.ok(box.width >= 44 && box.height >= 44, "Map pin has a usable touch target");
          await pin.focus();
          await page.keyboard.press("Enter");
          await page.waitForTimeout(50);
          assert.ok(await page.locator(target).evaluate(el => el === document.activeElement), "Map links move keyboard focus to the event");
        }
        assert.equal(await page.locator("#event-orkney .event-recording-tab").innerText(), "Recording coming soon");
        const recording = page.locator(".event-recording").filter({ has: page.getByRole("heading", { name: "What are the Universe’s greatest mysteries?", exact: true }) });
        assert.equal(await recording.locator(":scope > a").getAttribute("href"), "https://royalsociety.org/video/what-are-the-universes-greatest-mysteries-3pQnSEmCHzc");
        assert.equal(await recording.locator(".event-recording-tab").innerText(), "Watch recording");
        await recording.scrollIntoViewIfNeeded();
        await recording.locator("img").evaluate(image => image.decode());
        assert.ok(await recording.locator("img").evaluate(image => image.naturalWidth > 0));
      }
      if (file === "membership.html") {
        assert.equal(await page.locator(".membership-steps > li").count(), 3);
        assert.equal(await page.locator(".membership-requirements > li").count(), 3);
        assert.equal(await page.locator(".membership-contribution").count(), 2);
        assert.equal(await page.locator("#category1, #category2, #after-approval").count(), 3);
        for (const href of ["https://tracking.euclid-ec.org/euclid/login/", "https://www.euclid-ec.org/consortium/getting-started-guide/", "https://www.euclid-ec.org/consortium/roles/", "https://www.euclid-ec.org/consortium/quickstart-guide/", "https://euclid2023.org/wp-content/uploads/2023/03/code_of_conduct.pdf"]) {
          assert.equal(await page.locator(`main a[href="${href}"]`).count(), 1);
        }
        assert.match(await page.locator(".membership-contribution").first().innerText(), /more than 2 FTE/);
        assert.match(await page.locator(".membership-contribution").nth(1).innerText(), /next 6 months/);
        assert.match(await page.locator(".membership-notice").innerText(), /will be returned/);
        assert.equal(await page.locator(".scientists-contents a").count(), 4);
      }
      if (file === "scientists.html") {
        assert.equal(await page.locator("#contacts .scientist-group").count(), 11);
        assert.equal(await page.locator("#contacts .scientist-person").count(), 25);
        assert.equal(await page.locator("#coordinationgroup .scientist-person").count(), 6);
        assert.deepEqual(await page.locator("#coordinationgroup .scientist-person strong").allTextContents(), ["James Nightingale", "Rebecca Bowler", "Louis Gabarra", "Chris Lovell", "Francesco Shankar", "Jaime Ruiz Zapatero"]);
        assert.equal(await page.locator(".scientist-meeting").count(), 8);
        assert.equal(await page.locator(".scientist-meeting a").count(), 7);
        assert.equal(await page.locator("#membership .scientist-action").getAttribute("href"), "membership.html");
        assert.equal(await page.locator("#iris .scientist-action").getAttribute("href"), "https://www.iris.ac.uk");
        assert.equal(await page.locator("#coordinationgroup > p a").getAttribute("href"), "https://drive.google.com/file/d/1ouj3S0WhdMriQYcIvVVsoMCFU_kVvfsW/view");
        assert.match(await page.locator("#iris").innerText(), /1,000 CPU years[\s\S]*2022–2024/);
        assert.equal(await page.locator(".scientists-contents a").count(), 6);
        assert.equal(await page.locator(".section-navigation-hero .header-section-tabs a").count(), 6);
        for (const anchor of await page.locator(".scientists-contents a").all()) {
          const target = await anchor.getAttribute("href");
          assert.equal(await page.locator(target).count(), 1);
          await anchor.focus(); await page.keyboard.press("Enter");
          assert.ok(await page.locator(target).isVisible());
        }
      }
      if (file === "media.html") {
        assert.equal(await page.locator(".press-contact").count(), 13, "All existing press contacts are retained on For Media");
        assert.deepEqual(await page.locator("#press-releases .news-story-card > a").evaluateAll(links=>links.map(a=>a.getAttribute("href"))), ["dr1-foundation.html", "q1-release.html"]);
        assert.equal(await page.locator(".media-image-links a").count(), 3);
        assert.equal(await page.locator('main a[href="https://www.esa.int/Science_Exploration/Space_Science/Euclid"]').count(), 1);
        assert.equal(await page.locator('main a[href="https://www.euclid-ec.org/"]').count(), 1);
        assert.equal(await page.locator('.press-contact-email[href^="mailto:"]').count(), 13);
        assert.ok(await page.locator('.media-registration-button').isDisabled());
        assert.equal(await page.locator('.section-navigation-hero nav a').count(), 3);

      }
      if (["dr1-foundation.html", "q1-release.html", "royal-society-exhibition.html"].includes(file)) {
        const readingColumn = await page.locator(".press-release-body > p").first().boundingBox();
        assert.ok(Math.abs(readingColumn.x + readingColumn.width / 2 - 720) < 1, "Press-release reading column is centred at desktop width");
      }
      if (["dr1-foundation.html", "q1-release.html"].includes(file)) {
        const banner = await page.locator(".press-release-heading").boundingBox();
        const image = await page.locator(".press-release-heading > img").boundingBox();
        const title = await page.locator(".press-release-title").boundingBox();
        assert.ok(Math.abs(image.width - page.viewportSize().width) < 1, "Press-release lead image spans the page");
        assert.ok(Math.abs(image.height - banner.height) < 1, "Lead image stays inside its banner and clears the credit line");
        assert.ok(title.y > banner.y && title.y + title.height <= banner.y + banner.height, "Title is overlaid within the image");
        assert.equal(await page.locator(".press-release-header h1").evaluate(element => getComputedStyle(element).color), "rgb(255, 255, 255)");
      }
      if (file === "q1-release.html") {
        assert.equal(await page.locator(".release-quote").count(), 3);
        assert.equal(await page.locator(".press-release-title time").getAttribute("datetime"), "2025-03");
        assert.doesNotMatch(await page.locator("main").innerText(), /Insert potential quote|Insert your contact|Note to editors/);
      }
      if (file === "dr1-foundation.html") {
        const bodyBounds = await page.locator(".press-release-body > p").first().boundingBox();
        for (const figure of await page.locator(".press-release-body > figure").all()) {
          const figureBounds = await figure.boundingBox();
          assert.ok(Math.abs(figureBounds.x - bodyBounds.x) < 1 && Math.abs(figureBounds.width - bodyBounds.width) < 1, "Press release figures align with the body text width");
        }
        const comparison = page.locator("[data-image-comparison]");
        const reveal = comparison.getByRole("slider", { name: "Compare sky image and spectra", exact: true });
        assert.equal(await comparison.locator("img").count(), 2);
        await comparison.scrollIntoViewIfNeeded();
        await comparison.locator("img").evaluateAll(images => Promise.all(images.map(image => image.decode())));
        assert.ok(await comparison.locator("img").evaluateAll(images => images.every(image => image.naturalWidth === 2560)));
        assert.match(await comparison.evaluate(element => element.nextElementSibling.textContent), /^Beyond the standard one-dimensional spectra/);
        await reveal.focus();
        await page.keyboard.press("Home");
        assert.equal(await reveal.inputValue(), "0");
        assert.equal(await reveal.getAttribute("aria-valuetext"), "0% sky image, 100% spectra");
        await page.keyboard.press("End");
        assert.equal(await reveal.inputValue(), "100");
        await page.keyboard.press("ArrowLeft");
        assert.equal(await reveal.inputValue(), "99");
        await comparison.locator(".comparison-stage").scrollIntoViewIfNeeded();
        const comparisonBounds = await comparison.locator(".comparison-stage").boundingBox();
        await page.mouse.move(comparisonBounds.x + comparisonBounds.width * .25, comparisonBounds.y + comparisonBounds.height * .5);
        await page.mouse.down();
        await page.mouse.move(comparisonBounds.x + comparisonBounds.width * .75, comparisonBounds.y + comparisonBounds.height * .5);
        await page.mouse.up();
        assert.ok(Math.abs(Number(await reveal.inputValue()) - 75) <= 1, "Dragging reveals the corresponding portion of the sky image");
        await reveal.evaluate(input => { input.value = "50"; input.dispatchEvent(new Event("input", { bubbles: true })); });
        assert.equal(await page.locator(".press-release-figure").count(), 3);
        assert.equal(await page.locator(".press-release-figure figcaption").count(), 3);
        assert.equal(await page.locator(".press-release-header .press-release-heading > img").count(), 1, "The lead image fills the title banner");
        assert.equal(await page.locator(".release-quote").count(), 5, "All five speakers have separate quote blocks");
        assert.deepEqual(await page.locator(".release-quote footer strong").allTextContents(), ["Professor Andy Taylor", "Dr James Nightingale", "Natalie Lines", "Philip Holloway", "James Fawcett-Newell"]);
        assert.equal(await page.locator(".press-release-title time").getAttribute("datetime"), "2026-11-10");
        assert.equal(await page.locator(".release-quote > p").first().evaluate(element => getComputedStyle(element).fontStyle), "italic");
        assert.match(await page.locator(".release-quote > p").first().evaluate(element => getComputedStyle(element).fontFamily), /Georgia/);
        const bodyTextBounds = await page.locator(".press-release-body > p:not(.release-lead)").first().boundingBox();
        const quoteTextBounds = await page.locator(".release-quote > p").first().boundingBox();
        assert.ok(Math.abs(bodyTextBounds.x - quoteTextBounds.x) < 1 && Math.abs(bodyTextBounds.width - quoteTextBounds.width) < 1, "Quote text shares the main body text column");
        assert.equal(await page.locator(".release-embargo").count(), 0, "Published release has no embargo notice");
        assert.doesNotMatch(await page.locator("body").innerText(), /embargo/i);
        assert.equal(await page.locator("#release-media, #release-interviews, #release-papers").count(), 0, "The news item excludes media contacts and research-paper details");
        assert.equal(await page.locator(".press-release a[href^='mailto:'], .press-release a[href^='tel:']").count(), 0);
        assert.doesNotMatch(await page.locator("main").innerText(), /quote here\?|please add honest feedback|feel free to remove/);
      }
      if (file === "royal-society-exhibition.html") {
        const exhibitionLink = page.locator(".press-release-body").getByRole("link", { name: "Explore the exhibition", exact: true });
        assert.equal(await exhibitionLink.getAttribute("href"), "rssse.html");
        assert.ok(await exhibitionLink.evaluate(element => element.classList.contains("pill-link")), "Exhibition destination is a styled button link");
        assert.equal(await page.locator("#exhibition-links").count(), 0, "The old closing text section has been replaced");
        const headerImage = page.locator(".press-release-heading > img");
        assert.equal(await headerImage.getAttribute("src"), "images/news/royal-society-summer-science-entrance.jpg");
        assert.deepEqual(await headerImage.evaluate(image => [image.naturalWidth, image.naturalHeight]), [1512, 1071], "The supplied entrance photo is preserved at full resolution");
        assert.equal(await page.locator('.press-release-body img[src="images/news/euclid-royal-society-exhibition-original.jpg"]').count(), 1, "The original team photo is retained in the article body");
      }
      for (const stylesheet of ["style.css", "contrast.css"]) assert.equal(await page.locator(`link[href^='assets/site/${stylesheet}?v=']`).count(), 1, "Shared stylesheet has a cache version");
      if (file === "index.html") await page.locator(".brand").screenshot({ path: resolve(output, `logo-${theme}.png`) });
      const themeToggle = page.locator("#theme-toggle");
      const initialHeaderGradient = file === "index.html" ? await page.locator(".app-header").evaluate(element => getComputedStyle(element, "::before").backgroundImage) : null;
      if (file === "index.html") {
        assert.match(initialHeaderGradient, /^linear-gradient\(/, "The integrated header gradient is present before scrolling");
        await page.evaluate(() => scrollTo(0, 1));
        await page.waitForFunction(() => scrollY > 0);
        assert.equal(await page.locator(".app-header").evaluate(element => getComputedStyle(element).backgroundColor), "rgba(0, 0, 0, 0)", "Pinned menu keeps a transparent base while over the hero");
        assert.equal(await page.locator(".app-header").evaluate(element => getComputedStyle(element, "::before").backgroundImage), initialHeaderGradient, "The gradient does not switch on or change when scrolling begins");
        assert.ok(await page.locator(".app-header").evaluate(element => Math.abs(-parseFloat(getComputedStyle(element, "::before").bottom) - parseFloat(getComputedStyle(document.documentElement).fontSize) * 5) < 1), "Gradient has a shorter five-rem feather below the menu");
      }
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForFunction(() => scrollY > 0);
      assert.equal(await page.locator(".site-masthead").getAttribute("data-sticky"), "true");
      assert.ok(await page.locator(".site-masthead").evaluate(element => Math.abs(element.getBoundingClientRect().top) < 1), `${file}: both menu bars remain pinned even at the footer`);
      assert.ok(await page.locator(".app-header").evaluate(element => Math.abs(element.getBoundingClientRect().top - document.querySelector(".utility-bar").getBoundingClientRect().bottom) < 1), "Menu bars remain stacked without overlap");
      if (file === "index.html") {
        assert.equal(await page.locator(".app-header").evaluate(element => getComputedStyle(element).backgroundColor), "rgba(0, 0, 0, 0)", "Scrolled header does not become a solid rectangle");
        assert.equal(await page.locator(".app-header").evaluate(element => getComputedStyle(element, "::before").backgroundImage), initialHeaderGradient, "The integrated gradient stays consistent while pinned");
        assert.equal(await page.locator(".app-header").evaluate(element => getComputedStyle(element, "::before").pointerEvents), "none", "Gradient does not intercept links or page interactions");
        await page.screenshot({ path: resolve(output, `navigation-scrolled-${theme}.png`) });
      }
      const canShowTopControl = await page.evaluate(() => scrollY > Math.max(400, innerHeight * .75));
      if (canShowTopControl) {
        const topControl = page.getByRole("button", { name: "Back to top", exact: true });
        await topControl.waitFor({ state: "visible" });
        await topControl.focus();
        await page.keyboard.press("Enter");
        await page.waitForFunction(() => scrollY === 0);
        await topControl.waitFor({ state: "hidden" });
        assert.ok(await page.locator(".brand").evaluate(element => element === document.activeElement), "Back to top returns keyboard focus to the homepage link");
      }
      await page.evaluate(() => scrollTo(0, 0));
      await page.waitForFunction(() => scrollY === 0);
      assert.equal(await themeToggle.locator(".theme-icon-moon:visible, .theme-icon-sun:visible").count(), 1);
      assert.equal(await page.locator(".pill-link:not(:has(.control-panel))").count(), 0, `${file}: spacecraft panel decoration on call-to-action buttons`);
      assert.equal(await themeToggle.locator(".control-panel").count(), 0, "Theme switch has no decorative background");
      assert.equal(await themeToggle.evaluate(element => getComputedStyle(element).color), "rgb(255, 255, 255)", "Theme icon is white on the black utility bar");
      if (file === "index.html") assert.ok(await page.locator(".welcome-actions .pill-link").first().evaluate(element => {
        const label = element.querySelector(".panel-label").getBoundingClientRect();
        const arrow = element.querySelector(".arrow").getBoundingClientRect();
        return Math.abs(label.top + label.height / 2 - arrow.top - arrow.height / 2) < 2;
      }), "Desktop button label and arrow share one row");
      if (file === "index.html") {
        const heroActions = page.locator(".welcome-actions");
        assert.equal(await heroActions.getByRole("link").count(), 1);
        assert.equal(await heroActions.getByRole("link", { name: "Explore the science", exact: true }).getAttribute("href"), "science.html");
        assert.equal(await heroActions.getByRole("link", { name: /Explore the mission|Meet the team/ }).count(), 0, "The mission and team buttons are removed");
        assert.equal((await page.locator("#welcome-title").innerText()).replace(/\s+/g, " ").toLowerCase(), "exploring the dark universe");
        assert.equal(await page.locator(".welcome-description").innerText(), "We are the UK based team working on the European Space Agency's Euclid space telescope, on a mission to map the dark Universe!");
        assert.equal(await page.getByText("A little curiosity.", { exact: false }).count(), 0, "The mission introduction replaces the old welcome copy");
        const releaseSlide = page.locator(".hero-slide").first();
        assert.equal(await releaseSlide.locator(".tag").innerText(), "DR1-Foundation");
        assert.equal((await releaseSlide.locator(".hero-title").innerText()).replace(/\s+/g, " "), "EUCLID BEGINS TO UNRAVEL MAP OF THE UNIVERSE");
        assert.equal(await releaseSlide.locator(".hero-title").innerHTML(), "EUCLID BEGINS TO UNRAVEL<br>MAP OF THE UNIVERSE");
        assert.equal(await releaseSlide.locator(".hero-description").innerText(), "Explore Euclid's latest data release and learn more about the involvement of the UK's leading scientists and engineers");
        assert.equal(await releaseSlide.getByRole("link", { name: "Explore the data", exact: true }).getAttribute("href"), "dr1-data.html");
        assert.equal(await releaseSlide.getByRole("link", { name: "Read the press release", exact: true }).getAttribute("href"), "dr1-foundation.html");
        assert.equal(await page.locator("#hero-title-4").innerHTML(), "A dark universe<br>detective");
        assert.equal(await page.locator(".hero-visual").nth(3).locator(".hero-stars").count(), 1, "The six-pointed star overlay stays with M78 on slide four");
        assert.equal(await page.locator(".hero").getAttribute("data-star-slides"), "0 3");
        assert.equal(await page.locator(".hero").getAttribute("data-star-motion"), "static");
        assert.equal(await page.locator(".star-motion-toggle, .announcement-toggle").count(), 0, "Pause buttons are removed");
        assert.equal(await page.locator(".star-glow").first().evaluate(element => getComputedStyle(element).animationName), "none");
        assert.ok(await page.locator(".hero-stars").evaluateAll(elements => elements.every(element => element.getAttribute("aria-hidden") === "true")));
        assert.ok(await page.locator(".star-glow").evaluateAll(elements => elements.every(element => element.querySelectorAll(".star-ray").length === 6)), "Every animated star has six rays");
        const edgePoints = await page.locator(".scan-edge path").evaluate(element => [...element.getAttribute("d").matchAll(/[ML]([\d.]+) ([\d.]+)/g)].map(match => [Number(match[1]), Number(match[2])]));
        assert.ok(edgePoints.slice(1).every((point, index) => point[0] - edgePoints[index][0] < 100 || point[1] < edgePoints[index][1]), "All long tile edges slope in the same up-right direction");
        assert.equal(await page.locator(".motion-setting, #reduce-star-animation").count(), 0, "The footer motion block is removed");
        assert.equal(await page.locator(".hero-visual.is-active .hero-image").getAttribute("src"), "images/euclid-gallery/4_Euclid-EWS-DR1-NorthPR_M81NGC3077-R3-EQU-16K9K.4K.webp");
        assert.ok(!/[QC]/i.test(await page.locator(".scan-edge path").getAttribute("d")), "Scan edge uses angular steps, not curves");
      }
      assert.ok(await themeToggle.locator(`.theme-icon-${theme === "light" ? "moon" : "sun"}`).isVisible());
      await themeToggle.focus();
      await page.keyboard.press("Enter");
      assert.equal(await page.locator("html").getAttribute("data-theme"), theme === "light" ? "dark" : "light");
      assert.ok(await themeToggle.locator(`.theme-icon-${theme === "light" ? "sun" : "moon"}`).isVisible());
      assert.equal(await themeToggle.getAttribute("aria-label"), theme === "light" ? "Switch to light mode" : "Switch to dark mode");
      await page.keyboard.press("Enter");
      assert.equal(await page.locator("html").getAttribute("data-theme"), theme);
      assert.equal(await page.locator(".utility-bar").evaluate(element => getComputedStyle(element).backgroundColor), "rgb(0, 0, 0)");
      assert.ok(await page.locator(".utility-bar").evaluate(element => element.getBoundingClientRect().height <= 48), `${file}: compact desktop top bar`);
      const audience = page.getByRole("navigation", { name: "Audience navigation" });
      assert.equal(await audience.getByRole("link", { name: "For Scientists", exact: true }).getAttribute("href"), "scientists.html");
      assert.equal(await audience.getByRole("link", { name: "For Media", exact: true }).getAttribute("href"), "media.html");
      assert.equal(await audience.locator(".audience-tab-scientists").evaluate(element => getComputedStyle(element).borderBottomLeftRadius), "0px", "Scientists tab has a straight edge");
      assert.equal(await page.locator("h1").count(), 1);
      assert.equal(await page.locator("main").count(), 1);
      await scan(page, file, theme, "standard");
      if (file === "index.html") {
        await checkImageCardCarousel(page);
        await checkNewsCardCarousel(page);
        await checkCarousel(page, file, theme, "standard");
        await checkSearch(page, file, theme, "standard");
      }
      await page.getByRole("link", { name: "High contrast version", exact: true }).click();
      await page.waitForURL(url => url.searchParams.get("contrast") === "high");
      await checkNavigationHover(page, "high");
      await scan(page, file, theme, "high");
      if (file === "resources.html") await checkResourceFilters(page);
      if (file === "index.html") {
        await checkImageCardCarousel(page);
        await checkNewsCardCarousel(page);
        await checkCarousel(page, file, theme, "high");
        await checkSearch(page, file, theme, "high");
      }
      await page.getByRole("link", { name: "Standard contrast version", exact: true }).click();
      await page.waitForURL(url => url.searchParams.get("contrast") === "standard");
      await page.locator(".skip-link").focus();
      await page.keyboard.press("Enter");
      assert.ok(await page.locator("main").evaluate(element => element === document.activeElement));
      await page.setViewportSize({ width: 320, height: 256 });
      assert.ok(await page.locator(".utility-announcement").isHidden(), "Mobile hides the rotating announcement and partner logos");
      assert.equal(await page.locator('.utility-controls > a[href="faqs.html"]').count(), 0, "Inactive FAQ link is removed");
      assert.ok(await page.locator(".utility-socials").isVisible());
      assert.ok(await page.locator(".theme-toggle").isVisible());
      assert.equal(await page.locator(".announcement-message a").getAttribute("href"), "dr1-foundation.html", "The Breaking announcement opens the DR1 press release");
      if (file === "index.html") {
        for (const section of await page.locator('.mission-feature').all()) {
          assert.ok(await section.evaluate(e => e.querySelector('.mission-feature-media').getBoundingClientRect().bottom <= e.querySelector('.mission-feature-copy').getBoundingClientRect().top + 1), 'Homepage section photos precede copy on mobile');
        }
      }
      await checkReflow(page, `${file} narrow layout`);
      await page.addStyleTag({ content: "* { font-family: serif !important; }" });
      await checkReflow(page, `${file} browser font overrides`);
      await page.evaluate(() => document.documentElement.style.fontSize = "200%");
      await checkReflow(page, `${file} enlarged text`);
      await page.addStyleTag({ content: "p { line-height: 1.5 !important; margin-bottom: 2em !important; } * { letter-spacing: .12em !important; word-spacing: .16em !important; }" });
      await checkReflow(page, `${file} text spacing`);
      if (file === "index.html") {
        for (let index = 0; index < 4; index++) {
          await page.locator(".carousel-page").nth(index).click();
          await checkReflow(page, `${file} slide ${index + 1} enlarged text and spacing`);
        }
        await page.locator(".carousel-page").nth(0).click();
        await page.locator(".welcome-actions .pill-link").first().screenshot({ path: resolve(output, `panel-enlarged-${theme}.png`) });
      }
      await page.locator(".menu > summary").focus();
      await page.keyboard.press("Enter");
      assert.ok(await page.locator(".mobile-navigation-dialog").evaluate(element => element.open));
      assert.equal(await page.locator(".mobile-navigation-dialog > .audience-tabs").count(), 1, "Audience links move into the mobile menu without duplication");
      for (const name of ["For Scientists", "For Media"]) {
        const tab = audience.getByRole("link", { name, exact: true });
        await tab.focus();
        assert.ok(await tab.evaluate(element => element === document.activeElement));
        assert.ok(await tab.isVisible());
      }
      await checkReflow(page, `${file} mobile menu`);
      assert.ok(await page.locator(".header-tools").evaluate(element => element.querySelector(".menu > summary").getBoundingClientRect().right <= element.querySelector(".site-search-button").getBoundingClientRect().left), "Menu and search controls do not overlap with enlarged text");
      const science = page.locator(".mobile-navigation-dialog .primary-nav details").first();
      await science.locator("summary").focus();
      await page.keyboard.press("Enter");
      await checkReflow(page, `${file} science submenu`);
      await page.keyboard.press("Escape");
      assert.equal(await science.getAttribute("open"), null);
      await page.keyboard.press("Escape");
      assert.ok(await page.locator(".mobile-navigation-dialog").evaluate(element => !element.open));
      assert.ok(await page.locator(".menu > summary").evaluate(element => element === document.activeElement));
      await page.locator(".site-search-button").click();
      const mobileSearch = page.getByRole("search", { name: "Search Euclid UK", exact: true });
      await mobileSearch.getByRole("searchbox").fill("orbit");
      await mobileSearch.getByRole("searchbox").press("Enter");
      await checkReflow(page, `${file} search with enlarged text and text spacing`);
      await page.emulateMedia({ forcedColors: "active" });
      await checkReflow(page, `${file} search in forced colours`);
      await page.keyboard.press("Escape");
      await checkReflow(page, `${file} forced colours`);
      if (file === "resources.html") {
        await checkResourceFilters(page);
        await checkReflow(page, "Resource audience filters with enlarged text, text spacing and forced colours");
      }
      assert.deepEqual(errors, [], `${file}: script errors`);
      await context.close();
    }
    console.log(`Checked ${file}: links, both themes/contrast versions, narrow layout, text, keyboard and menu.`);
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "light", reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto(pageUrl("index.html"));
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    const images = [...document.images];
    images.forEach(image => image.loading = "eager");
    await Promise.all(images.map(image => image.decode()));
  });
  const desktopScience = page.locator(".desktop-navigation details").first();
  assert.equal(await page.locator(".desktop-navigation details").count(), 1, "Only the available Science menu has a dropdown");
  for (const menu of [desktopScience]) {
    assert.equal(await menu.locator("summary").evaluate(element => getComputedStyle(element, "::after").content), "none", "No plus/minus icon is added to the summary");
    await menu.locator("..").locator(":scope > a").hover();
    assert.ok(await menu.evaluate(element => element.open), "Hover opens the native dropdown");
    await menu.locator(".nav-submenu a").first().hover();
    assert.ok(await menu.evaluate(element => element.open), "Pointer can move into the dropdown");
    await page.keyboard.press("Escape");
    assert.equal(await menu.evaluate(element => element.open), false, "Escape dismisses a hover menu without moving the pointer");
    await page.mouse.move(0, 700);
    await menu.locator("summary").focus();
    await page.keyboard.press("Enter");
    assert.ok(await menu.evaluate(element => element.open), "Keyboard opens the dropdown");
    await page.keyboard.press("Tab");

    assert.ok(await menu.locator(".nav-submenu :is(a, button)").first().evaluate(element => element === document.activeElement), "Tab reaches the first section control, including its coming-soon status");
    await page.keyboard.press("Escape");
    assert.equal(await menu.evaluate(element => element.open), false);
    await menu.locator("summary").blur();
  }
  assert.equal(await page.locator(".site-search-button .control-panel").count(), 1, "Homepage search uses the same button shape as other shared pages");
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1280, height: 720 }, { width: 1366, height: 768 }, { width: 390, height: 844 }, { width: 375, height: 812 }]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForFunction(() => Math.abs(parseFloat(document.body.style.getPropertyValue("--hero-header-height")) - document.querySelector(".site-masthead").getBoundingClientRect().height) < 1);
    let navigationPosition;
    for (let index = 0; index < 4; index++) {
      await page.locator(".carousel-page").nth(index).focus();
      await page.keyboard.press("Enter");
      await page.evaluate(() => scrollTo(0, 0));
      assert.ok(await page.locator(".hero").evaluate(element => element.getBoundingClientRect().bottom <= innerHeight + 1), `Slide ${index + 1} fits the opening screen at ${viewport.width}×${viewport.height}`);
      await checkReflow(page, `Opening banner at ${viewport.width}×${viewport.height}`);
      const cue = await page.locator(".hero-scroll-cue").boundingBox();
      assert.ok(Math.abs(cue.x + cue.width / 2 - viewport.width / 2) < 1, "Down arrow is centred on the carousel");
      const controls = await page.locator(".carousel-controls").boundingBox();
      const pagination = await page.locator(".carousel-pagination").boundingBox();
      assert.ok(cue.y >= pagination.y + pagination.height || cue.x + cue.width <= pagination.x, "Down arrow and slide dots do not overlap");
      const arrowBounds = await page.locator('.carousel-arrow[data-carousel-direction="1"]').boundingBox();
      const searchBounds = await page.locator(".site-search-button").boundingBox();
      assert.ok(Math.abs(arrowBounds.x + arrowBounds.width - searchBounds.x - searchBounds.width) < 1, "Carousel right edge aligns with the search icon");
      if (navigationPosition) assert.ok(Math.abs(controls.y - navigationPosition.y) < 1 && Math.abs(controls.x - navigationPosition.x) < 1, "Carousel controls stay in the same position on every slide");
      else navigationPosition = controls;
    }
  }
  await page.locator(".hero-scroll-cue").focus();
  await page.keyboard.press("Enter");
  assert.ok(await page.locator("#welcome").evaluate(element => element === document.activeElement), "Down arrow focuses the next section");
  assert.ok(await page.evaluate(() => scrollY > 0), "Down arrow reveals the content below the carousel");
  assert.equal(await page.locator(".hero-scroll-cue svg").evaluate(element => getComputedStyle(element).animationName), "none", "Reduced motion disables the arrow cue animation");
  await page.locator(".carousel-page").nth(0).click();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: resolve(output, "home-desktop.png"), fullPage: true });
  await page.screenshot({ path: resolve(output, "hero-desktop.png") });
  await page.evaluate(() => scrollTo(0, document.querySelector(".welcome").offsetTop - 180));
  await page.screenshot({ path: resolve(output, "telescope-light.png") });
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page.evaluate(() => scrollTo(0, document.querySelector(".welcome").offsetTop - 180));
  await page.screenshot({ path: resolve(output, "telescope-dark.png") });
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await page.evaluate(() => scrollTo(0, 0));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(() => document.querySelector(".menu > .audience-tabs"));
  assert.ok(await page.locator(".site-masthead").evaluate(element => element.getBoundingClientRect().height < 190), "The mobile header is compact with social icons and theme control");
  await page.screenshot({ path: resolve(output, "hero-mobile.png") });
  await page.locator(".menu > summary").click();
  assert.ok(await page.getByRole("navigation", { name: "Audience navigation", exact: true }).isVisible());
  const mobilePanel = page.locator(".mobile-navigation-dialog");
  assert.ok(await mobilePanel.evaluate(element => element.matches(":modal")), "Navigation is a native modal with an inert background");
  const panelBounds = await mobilePanel.boundingBox();
  assert.equal(panelBounds.width, 390);
  const headerBottom = await page.locator(".site-masthead").evaluate(element => element.getBoundingClientRect().bottom);
  assert.ok(Math.abs(panelBounds.y - headerBottom) < 1, "Menu begins below the visible logo and utility bars");
  assert.ok(Math.abs(panelBounds.y + panelBounds.height - 844) < 1, "Menu fills the remaining viewport");
  assert.equal(await page.getByRole("button", { name: "Close menu", exact: true }).count(), 1);
  assert.equal(await page.locator(".mobile-navigation-close").innerText(), "", "Close button uses only the rounded cross");
  assert.ok(await mobilePanel.evaluate(element => getComputedStyle(element).backgroundColor === getComputedStyle(document.body).backgroundColor), "Menu background follows the page theme");
  await page.locator(".mobile-navigation-close").focus();
  await page.keyboard.press("Shift+Tab");
  assert.ok(await mobilePanel.evaluate(element => element.contains(document.activeElement)), "Keyboard stays inside the full-screen menu");
  await checkReflow(page, "Compact mobile menu");
  await page.screenshot({ path: resolve(output, "menu-mobile.png") });
  await scan(page, "index.html", "light", "compact-mobile-menu");
  await page.keyboard.press("Escape");
  assert.ok(await page.locator(".menu > summary").evaluate(element => element === document.activeElement), "Closing the menu returns focus to its trigger");
  await page.evaluate(() => scrollTo(0, 0));
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page.screenshot({ path: resolve(output, "hero-mobile-dark.png") });
  await context.close();
  const motionContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "no-preference", colorScheme: "light" });
  const motionPage = await motionContext.newPage();
  await motionPage.goto(pageUrl("index.html"));
  await motionPage.evaluate(() => document.fonts.ready);
  const welcome = motionPage.locator(".welcome");
  const telescope = motionPage.locator(".euclid-outline");
  assert.equal(await welcome.getAttribute("data-telescope-motion"), "interactive");
  await welcome.scrollIntoViewIfNeeded();
  const welcomeBounds = await welcome.boundingBox();
  await motionPage.mouse.move(welcomeBounds.x + welcomeBounds.width * .9, welcomeBounds.y + welcomeBounds.height * .8);
  await motionPage.waitForFunction(() => {
    const transform = new DOMMatrix(getComputedStyle(document.querySelector(".euclid-outline")).transform);
    return Math.abs(transform.m41 + 12.8) < .1 && Math.abs(transform.m42 + 7.2) < .1;
  });
  assert.ok(await telescope.evaluate(element => {
    const transform = new DOMMatrix(getComputedStyle(element).transform);
    return transform.m41 < 0 && transform.m42 < 0 && Math.abs(transform.m41) <= 16 && Math.abs(transform.m42) <= 12;
  }), "Hovering without clicking moves the telescope gently opposite the cursor, within bounded offsets");
  await motionPage.mouse.move(welcomeBounds.x + welcomeBounds.width * .1, welcomeBounds.y + welcomeBounds.height * .2);
  await motionPage.waitForFunction(() => new DOMMatrix(getComputedStyle(document.querySelector(".euclid-outline")).transform).m41 > 12);
  await welcome.dispatchEvent("pointerleave");
  await motionPage.waitForFunction(() => {
    const transform = new DOMMatrix(getComputedStyle(document.querySelector(".euclid-outline")).transform);
    return Math.abs(transform.m41) < .1 && Math.abs(transform.m42) < .1;
  });
  await welcome.dispatchEvent("pointermove", { pointerType: "touch", clientX: welcomeBounds.x, clientY: welcomeBounds.y });
  assert.equal(await telescope.evaluate(element => element.style.getPropertyValue("--telescope-x")), "", "Touch scrolling does not move the illustration");
  await motionPage.evaluate(() => scrollTo(0, 0));
  const motionHero = motionPage.locator(".hero");
  const motionMarkers = motionPage.locator(".carousel-page");
  await motionPage.getByRole("button", { name: "Next slide", exact: true }).click();
  assert.equal(await motionHero.getAttribute("data-carousel-motion"), "sliding");
  assert.ok(await motionPage.locator(".hero-slide.is-active").evaluate(element => element.getAnimations().some(animation => animation.effect.getKeyframes().every(frame => typeof frame.transform === "string"))), "Buttons trigger horizontal translation, not a fade");
  await motionPage.waitForFunction(() => document.querySelector(".hero").dataset.carouselMotion === "idle");
  await motionMarkers.nth(0).click();
  await motionPage.waitForFunction(() => document.querySelector(".hero").dataset.carouselMotion === "idle");
  await motionPage.mouse.move(1150, 400);
  await motionPage.mouse.down();
  await motionPage.mouse.move(850, 400, { steps: 8 });
  assert.equal(await motionHero.getAttribute("data-active-slide"), "0", "The selected slide changes only when the drag is released");
  assert.equal(await motionHero.getAttribute("data-carousel-motion"), "dragging");
  const dragPositions = await motionHero.evaluate(element => [element.querySelector(".hero-slide.is-active"), element.querySelector(".hero-visual.is-active")].map(layer => new DOMMatrix(getComputedStyle(layer).transform).m41));
  assert.ok(dragPositions.every(position => Math.abs(position + 300) < 1), "Image and text track the cursor together");
  assert.equal(await motionHero.locator(".hero-slide.is-preview[inert][aria-hidden='true']").count(), 1, "The drag preview remains excluded from keyboard and reading order");
  await motionPage.screenshot({ path: resolve(output, "carousel-drag.png") });
  await motionPage.mouse.up();
  assert.equal(await motionHero.getAttribute("data-active-slide"), "1");
  await motionPage.waitForFunction(() => document.querySelector(".hero").dataset.carouselMotion === "idle");
  await motionMarkers.nth(0).click();
  await motionPage.waitForFunction(() => document.querySelector(".hero").dataset.carouselMotion === "idle");
  await motionPage.mouse.move(950, 400);
  await motionPage.mouse.down();
  await motionPage.mouse.move(1250, 400, { steps: 8 });
  await motionPage.mouse.up();
  assert.equal(await motionHero.getAttribute("data-active-slide"), "3", "Dragging right wraps to the previous slide");
  await motionPage.waitForFunction(() => document.querySelector(".hero").dataset.carouselMotion === "idle");
  await motionPage.mouse.move(1000, 400);
  await motionPage.mouse.down();
  await motionPage.mouse.move(990, 400);
  await motionPage.mouse.up();
  assert.equal(await motionHero.getAttribute("data-active-slide"), "3", "A short drag snaps back instead of changing slides");
  await motionPage.waitForFunction(() => document.querySelector(".hero").dataset.carouselMotion === "idle");
  await motionHero.dispatchEvent("pointerdown", { pointerType: "touch", isPrimary: true, pointerId: 14, clientX: 1000, clientY: 400 });
  await motionHero.dispatchEvent("pointermove", { pointerType: "touch", isPrimary: true, pointerId: 14, clientX: 900, clientY: 405 });
  await motionHero.dispatchEvent("pointercancel", { pointerType: "touch", pointerId: 14 });
  assert.equal(await motionHero.getAttribute("data-carousel-motion"), "idle");
  assert.equal(await motionHero.getAttribute("data-active-slide"), "3", "A cancelled touch gesture restores the selected slide");
  assert.equal(await motionHero.locator(".is-preview").count(), 0);
  await motionPage.emulateMedia({ reducedMotion: "reduce" });
  await motionMarkers.nth(0).click();
  assert.equal(await motionHero.getAttribute("data-carousel-motion"), "idle");
  assert.equal(await motionHero.locator(".hero-slide.is-active").evaluate(element => element.getAnimations().length), 0, "Reduced motion makes slide changes immediate");
  await motionPage.emulateMedia({ reducedMotion: "no-preference" });
  await motionMarkers.nth(1).click();
  await motionMarkers.nth(2).click();
  await motionPage.waitForFunction(() => document.querySelector(".hero").dataset.carouselMotion === "idle");
  assert.equal(await motionHero.getAttribute("data-active-slide"), "2", "Rapid slide requests settle on the latest selection");
  assert.equal(await motionHero.locator(".is-preview").count(), 0);
  await motionMarkers.nth(3).click();
  await motionPage.setViewportSize({ width: 390, height: 844 });
  await motionPage.waitForFunction(() => document.querySelector(".hero").dataset.carouselMotion === "idle");
  assert.equal(await motionHero.getAttribute("data-carousel-motion"), "idle", "Resizing cancels an unfinished transition cleanly");
  assert.equal(await motionHero.getAttribute("data-active-slide"), "3");
  await motionPage.setViewportSize({ width: 1440, height: 1000 });
  await motionMarkers.nth(0).click();
  await motionPage.waitForFunction(() => document.querySelector(".hero").dataset.carouselMotion === "idle");
  const m78Glows = motionPage.locator(".hero-visual").nth(3).locator(".star-glow");
  const glow = m78Glows.first();
  const starPage = motionPage.locator(".carousel-page").nth(3);
  await motionPage.reload();
  await motionPage.waitForFunction(() => document.querySelector(".hero").dataset.starMotion === "running");
  const releaseGlows = motionPage.locator(".hero-visual").first().locator(".hero-stars:visible .star-glow");
  assert.equal(await releaseGlows.count(), 4, "Slide one has four visible six-point glows");
  assert.equal(await m78Glows.first().evaluate(element => element.getAnimations().length), 0, "Inactive M78 glows do not animate");
  await motionPage.waitForTimeout(4000);
  assert.ok(await releaseGlows.first().evaluate(element => element.getAnimations()[0].effect.getComputedTiming().currentIteration >= 1), "Slide-one glows loop beyond their first cycle");
  await motionPage.setViewportSize({ width: 390, height: 844 });
  assert.equal(await motionPage.locator(".hero-stars-portrait:visible").count(), 1, "Portrait overlay follows the rotated mobile photo");
  assert.equal(await motionPage.locator(".hero-stars-wide:visible").count(), 0);
  await motionPage.setViewportSize({ width: 1440, height: 1000 });
  await starPage.click();
  await motionPage.waitForFunction(() => document.querySelector(".hero").dataset.starMotion === "running");
  assert.equal(await motionPage.locator(".star-motion-toggle, .announcement-toggle").count(), 0);
  await motionPage.locator(".carousel-page").nth(1).click();
  await motionPage.waitForFunction(() => document.querySelector(".hero").dataset.starMotion === "static");
  assert.equal(await motionPage.locator(".star-glow").first().evaluate(element => element.getAnimations().length), 0, "Stars stop while the M78 slide is inactive");
  await starPage.click();
  await motionPage.waitForFunction(() => document.querySelector(".hero").dataset.starMotion === "running");
  const timings = await m78Glows.evaluateAll(elements => elements.map(element => element.getAnimations()[0].effect.getComputedTiming()));
  assert.equal(timings.length, 4);
  assert.ok(timings.every(timing => timing.iterations === Infinity && timing.duration === 3600 && timing.delay >= 0), "All four stars loop with complete glows and staggered starts");
  assert.equal(new Set(timings.map(timing => timing.delay)).size, 4, "The star glows are staggered");
  await motionPage.waitForTimeout(2200);
  await motionPage.screenshot({ path: resolve(output, "hero-starburst.png") });
  await scan(motionPage, "index.html", "light", "animated");
  await motionPage.waitForTimeout(4200);
  assert.equal(await motionHero.getAttribute("data-star-motion"), "running", "Stars continue looping beyond the previous stop timer");
  assert.ok(await glow.evaluate(element => element.getAnimations()[0].effect.getComputedTiming().currentIteration >= 1), "The glow reaches another iteration");
  await motionPage.waitForFunction(() => document.querySelector(".hero").dataset.starMotion === "running");
  await motionPage.locator(".carousel-page").nth(1).click();
  await starPage.click();
  await motionPage.waitForFunction(() => document.querySelector(".hero").dataset.starMotion === "running");
  assert.ok(await glow.evaluate(element => element.getAnimations().some(animation => animation.playState === "running")), "Returning to M78 resumes the looping stars");
  await motionPage.evaluate(() => localStorage.setItem("euclid-motion-choice", "reduce"));
  await motionPage.reload();
  await starPage.click();
  assert.equal(await welcome.getAttribute("data-telescope-motion"), "static", "The remembered choice keeps the telescope still after reload");
  assert.equal(await motionPage.locator(".hero").getAttribute("data-star-motion"), "static");
  await motionPage.evaluate(() => localStorage.setItem("euclid-motion-choice", "animate"));
  await motionPage.reload();
  await starPage.click();
  await motionPage.waitForFunction(() => document.querySelector(".hero").dataset.starMotion === "running");
  await motionPage.waitForFunction(() => document.querySelector(".hero").dataset.carouselMotion === "idle");
  await motionPage.setViewportSize({ width: 320, height: 700 });
  await motionPage.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await checkReflow(motionPage, "Starburst narrow layout");
  await motionPage.evaluate(() => document.documentElement.style.fontSize = "200%");
  await motionPage.addStyleTag({ content: "p { line-height: 1.5 !important; margin-bottom: 2em !important; } * { letter-spacing: .12em !important; word-spacing: .16em !important; }" });
  await checkReflow(motionPage, "Starburst enlarged text and spacing");
  await motionPage.reload();
  await starPage.click();
  await motionPage.waitForFunction(() => document.querySelector(".hero").dataset.starMotion === "running");
  await motionPage.emulateMedia({ reducedMotion: "reduce" });
  await motionPage.waitForFunction(() => document.querySelector(".hero").dataset.starMotion === "static");
  assert.equal(await glow.evaluate(element => getComputedStyle(element).animationName), "none");
  await motionPage.emulateMedia({ reducedMotion: "no-preference" });
  await motionPage.waitForFunction(() => document.querySelector(".hero").dataset.starMotion === "running");
  await motionPage.getByRole("link", { name: "High contrast version", exact: true }).click();
  await motionPage.waitForURL(url => url.searchParams.get("contrast") === "high");
  await motionPage.waitForLoadState("load");
  assert.equal(await welcome.getAttribute("data-telescope-motion"), "static", "High contrast keeps the outline static");
  await motionPage.locator(".hero-stars").first().waitFor({ state: "hidden" });
  assert.equal(await motionPage.locator(".hero-stars:visible").count(), 0);
  assert.equal(await motionPage.locator(".hero").getAttribute("data-star-motion"), "static");
  await motionPage.getByRole("link", { name: "Standard contrast version", exact: true }).click();
  await motionPage.waitForURL(url => url.searchParams.get("contrast") === "standard");
  await motionPage.emulateMedia({ forcedColors: "active" });
  await motionPage.waitForFunction(() => document.querySelector(".welcome").dataset.telescopeMotion === "static");
  assert.equal(await welcome.getAttribute("data-telescope-motion"), "static", "Forced colours keep the outline static");
  assert.equal(await motionPage.locator(".hero-stars:visible").count(), 0);
  await motionContext.close();
  await checkImageCardAutoscroll();
  const rotationContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "no-preference" });
  const rotationPage = await rotationContext.newPage();
  await rotationPage.goto(pageUrl("index.html"));
  const rotatingHero = rotationPage.locator(".hero");
  await rotatingHero.hover();
  await rotationPage.waitForFunction(() => document.querySelector(".hero").dataset.carouselAutoplay === "paused");
  await rotationPage.mouse.move(5, 5);
  await rotationPage.waitForFunction(() => document.querySelector(".hero").dataset.carouselAutoplay === "running");
  await rotationPage.waitForTimeout(9000);
  assert.equal(await rotatingHero.getAttribute("data-active-slide"), "0", "Slides do not advance before ten seconds");
  await rotationPage.waitForFunction(() => document.querySelector(".hero").dataset.activeSlide === "1", null, { timeout: 2500 });
  assert.equal(await rotatingHero.locator("[data-carousel-status]").innerText(), "", "Automatic slide changes do not generate repeated live announcements");
  assert.ok(await rotationPage.evaluate(() => document.activeElement === document.body), "Automatic rotation does not move keyboard focus");
  await rotatingHero.getByRole("button", { name: "Next slide", exact: true }).focus();
  await rotationPage.waitForFunction(() => document.querySelector(".hero").dataset.carouselAutoplay === "paused");
  await rotationPage.waitForTimeout(10200);
  assert.equal(await rotatingHero.getAttribute("data-active-slide"), "1", "Keyboard focus stops automatic rotation");
  await rotatingHero.locator(".carousel-page").nth(3).click();
  await rotationPage.locator(".brand").focus();
  await rotationPage.mouse.move(5, 5);
  await rotationPage.waitForFunction(() => document.querySelector(".hero").dataset.carouselAutoplay === "running");
  await rotationPage.waitForFunction(() => document.querySelector(".hero").dataset.activeSlide === "0", null, { timeout: 11500 });
  await rotationPage.locator(".brand").focus();
  await rotationPage.mouse.move(5, 5);
  await rotationPage.waitForFunction(() => document.querySelector(".hero").dataset.carouselAutoplay === "running");
  await rotationPage.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await rotationPage.waitForFunction(() => document.querySelector(".hero").dataset.carouselAutoplay === "paused");
  await rotationPage.evaluate(() => scrollTo(0, 0));
  await rotationPage.waitForFunction(() => document.querySelector(".hero").dataset.carouselAutoplay === "running");
  await rotationPage.emulateMedia({ reducedMotion: "reduce" });
  await rotationPage.waitForFunction(() => document.querySelector(".hero").dataset.carouselAutoplay === "paused");
  await rotationContext.close();
  const announcementContext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
  const announcementPage = await announcementContext.newPage();
  await announcementPage.clock.install();
  await announcementPage.goto(pageUrl("index.html"));
  const announcementBar = announcementPage.locator(".utility-announcement");
  await announcementBar.waitFor({ state: "visible" });
  await announcementPage.waitForFunction(() => document.querySelector(".utility-announcement").dataset.frame === "text");
  const announcementHeight = await announcementBar.evaluate(element => element.getBoundingClientRect().height);
  await announcementPage.clock.runFor(9999);
  assert.equal(await announcementBar.getAttribute("data-frame"), "text");
  await announcementPage.clock.runFor(1);
  assert.equal(await announcementBar.getAttribute("data-frame"), "logos");
  assert.equal(await announcementBar.locator(".announcement-partners img").count(), 2);
  assert.equal(await announcementBar.getByRole('link', { name: 'UK Space Agency', exact: true }).getAttribute('href'), 'https://www.gov.uk/government/case-studies/euclid');
  assert.equal(await announcementBar.getByRole('link', { name: 'European Space Agency (ESA)', exact: true }).getAttribute('href'), 'https://www.esa.int/missions/about-us/directorates/science/euclid');
  assert.ok(await announcementBar.locator(".announcement-partners img").evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)));
  assert.equal(await announcementBar.evaluate(element => element.getBoundingClientRect().height), announcementHeight, "Rotating the top bar does not move the menu");
  await announcementPage.clock.runFor(10000);
  assert.equal(await announcementBar.getAttribute("data-frame"), "text", "Announcement rotation loops");
  await announcementPage.emulateMedia({ reducedMotion: "reduce" });
  await announcementPage.waitForFunction(() => !document.querySelector(".utility-announcement").hasAttribute("data-rotating"));
  assert.ok(await announcementBar.locator(".announcement-message").isVisible());
  assert.ok(await announcementBar.locator(".announcement-partners").isHidden(), "Reduced motion keeps the announcement static");
  await announcementContext.close();
  const noScript = await browser.newContext({ viewport: { width: 320, height: 700 }, javaScriptEnabled: false });
  const fallback = await noScript.newPage();
  await fallback.goto(pageUrl("index.html"));
  assert.ok(await fallback.locator(".euclid-outline").isVisible(), "The vector illustration remains visible without JavaScript");
  assert.equal(await fallback.locator(".euclid-outline").evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m41), 0);
  await fallback.locator(".menu > summary").click();
  assert.ok(await fallback.locator(".menu nav").isVisible());
  assert.ok(await fallback.getByRole("heading", { level: 1 }).isVisible());
  assert.equal((await fallback.locator("#welcome-title").innerText()).replace(/\s+/g, " ").toLowerCase(), "exploring the dark universe");
  assert.ok(await fallback.locator(".welcome-actions").getByRole("link", { name: "Explore the science", exact: true }).isVisible());
  assert.ok(await fallback.locator(".carousel-controls").isHidden());
  assert.equal(await fallback.title(), "Euclid UK");
  assert.equal(await fallback.locator(".mission-feature").count(), 2, "Technology and people sections remain available without JavaScript");
  assert.ok(await fallback.locator(".welcome-science").isVisible(), "The merged science introduction remains available without JavaScript");
  assert.equal(await fallback.locator(".join, .discover").count(), 0, "Removed homepage sections do not return in the no-script version");
  assert.equal(await fallback.locator(".image-card-track figure").count(), imageReleases.length, "All images remain available without JavaScript");
  assert.equal(await fallback.locator(".image-card-track a").count(), 0, "No image links return without JavaScript");
  assert.equal(await fallback.locator(".news-story-card > a").count(), 3, "All news stories remain linked without JavaScript");
  assert.ok(await fallback.locator(".news-card-controls").isHidden(), "No inactive news controls are shown without JavaScript");
  assert.ok(await fallback.locator(".image-card-controls").isHidden(), "Inactive image controls are hidden without JavaScript");
  assert.equal(await fallback.getByRole("navigation", { name: "More Euclid highlights" }).getByRole("link").count(), 4, "Other slide destinations remain available without JavaScript");
  assert.equal(await fallback.locator(".star-motion-toggle, .announcement-toggle").count(), 0);
  assert.ok(await fallback.locator(".motion-setting").isHidden());
  assert.equal(await fallback.locator(".star-glow").first().evaluate(element => getComputedStyle(element).animationName), "none", "No-script glows remain static");
  assert.equal(await fallback.locator("#newsletter, .newsletter-section, .newsletter-dialog").count(), 0, "Newsletter signup has been removed");
  const resourceFallback = await noScript.newPage();
  await resourceFallback.goto(pageUrl("resources.html"));
  assert.ok(await resourceFallback.locator("[data-resource-filters]").isHidden(), "Without JavaScript, inactive filter controls stay hidden");
  assert.equal(await resourceFallback.locator("[data-resource-item]:visible").count(), 8, "All tagged resources remain available without JavaScript");
  const spectroscopyFallback = await noScript.newPage();
  await spectroscopyFallback.goto(pageUrl("dr1-foundation.html"));
  const stillComparison = spectroscopyFallback.locator("[data-image-comparison]");
  assert.equal(await stillComparison.locator("img:visible").count(), 2, "Both spectroscopy views remain available without JavaScript");
  assert.ok(await stillComparison.locator(".comparison-controls").isHidden());
  const stillBounds = await stillComparison.locator("img").evaluateAll(images => images.map(image => ({left: image.getBoundingClientRect().left, right: image.getBoundingClientRect().right})));
  assert.ok(stillBounds[0].right <= stillBounds[1].left + 1, "The static sky and spectra images appear side by side");
  await noScript.close();
  assert.equal(await readFile(resolve(directory, "index.html"), "utf8"), await readFile(resolve(directory, "euclid-home.html"), "utf8"), "The pre-rendered homepage and its compatibility URL stay identical");
  for (const file of pages) {
    const source = await readFile(resolve(directory, file), "utf8");
    assert.doesNotMatch(source, /jodrell|experimental|design experiment|content placeholder|back to the current website|noindex/i, `${file}: production pages do not contain design-preview labels`);
  }
  assert.equal((await readFile(resolve(directory, "data/site/humans.html"), "utf8")).match(/class="portrait-card"/g).length, 19, "All existing team profiles are retained");
  if (!process.env.EUCLID_SITE_PAGE) {
    process.env.EUCLID_SITE_BASE_URL = previewBase;
    await import("./check_site_interactives.mjs");
  }
} catch (error) {
  failures.push(error.stack);
} finally {
  await browser.close();
  await previewServer?.close();
  await writeFile(resolve(output, "report.json"), JSON.stringify({ pages, browserEngine, browserVersion, reports, standardContrastWarnings, failures }, null, 2));
}
if (failures.length) {
  console.error(failures.join("\n\n"));
  process.exitCode = 1;
} else console.log(`Website checks passed: ${pages.length} pages, ${reports.length} scans. Manual assistive-technology review is still required.`);
