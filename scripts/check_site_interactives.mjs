import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const playwright = await import(process.env.EUCLID_PLAYWRIGHT_PATH || "playwright");
const engine = process.env.EUCLID_BROWSER_ENGINE || "chromium";
const base = process.env.EUCLID_SITE_BASE_URL || "http://127.0.0.1:8767/";
const output = resolve(process.env.EUCLID_SITE_OUTPUT || resolve(root, ".build/accessibility"), "interactives");
await mkdir(output, { recursive: true });
const axe = await readFile(process.env.EUCLID_AXE_PATH || require.resolve("axe-core/axe.min.js"), "utf8");
const browser = await playwright[engine].launch({ headless: true, ...(engine === "chromium" && process.env.EUCLID_BROWSER_PATH ? { executablePath: process.env.EUCLID_BROWSER_PATH } : {}) });
const reports = [];
const failures = [];
const standardContrastWarnings = [];

async function scan(page, name) {
  await page.evaluate(axe);
  const result = await page.evaluate(() => axe.run({ runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } }));
  reports.push({ name, violations: result.violations, incomplete: result.incomplete });
  for (const violation of result.violations) {
    const message = `${name}: ${violation.id}: ${violation.nodes.map(node => node.target.join(" ")).join(", ")}`;
    if (violation.id === "color-contrast" && await page.locator("html").getAttribute("data-contrast") !== "high") standardContrastWarnings.push(message);
    else failures.push(message);
  }
}

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  await context.route(/^https?:/, route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(new URL("q2release.html", base).href);
  await page.waitForFunction(() => document.querySelector(".openseadragon-canvas"));
  await page.evaluate(() => document.fonts.ready);
  const dimensions = await page.locator("#viewer").boundingBox();
  assert.ok(Math.abs(dimensions.width - 1440) < 1 && Math.abs(dimensions.height - 1000) < 1, "The original explorer fills the viewport");
  assert.equal(await page.locator(".site-masthead, .page-hero, .galactic-controls").count(), 0, "No website header or content sections are inserted into the explorer");
  assert.equal(await page.locator(".explorer-home-link").getAttribute("href"), "index.html");
  assert.equal(await page.locator(".explorer-home-link img").getAttribute("src"), "assets/site/logo-dark.svg");
  assert.deepEqual(await page.locator("#astronomer-open").evaluate(e => [getComputedStyle(e).backgroundColor, getComputedStyle(e).color]), ["rgb(255, 255, 255)", "rgb(0, 0, 0)"], "Explorer buttons use white backgrounds and black text");
  assert.ok(await page.locator('.topbar').evaluate(e => Math.abs(e.querySelector('.brand').getBoundingClientRect().top - e.querySelector('.toolbar').getBoundingClientRect().top) < 1), "Heading and controls align at the top");
  assert.equal(await page.locator(".distance-label").innerText(), "28,000 light-years from Earth");
  assert.equal(await page.locator("#astronomer-open").evaluate(e => getComputedStyle(e).borderRadius), "5.6px");
  assert.ok(await page.locator('.toolbar').evaluate(e => Math.abs(e.getBoundingClientRect().left + e.getBoundingClientRect().width / 2 - innerWidth / 2) < 1), 'Explorer controls are centred in the page');
  const original = await readFile(resolve(root, "data/site/q2release.source.html"), "utf8");
  for (const [, identifier] of original.matchAll(/\bid="([^"]+)"/g)) assert.equal(await page.locator(`[id='${identifier}']`).count(), 1, `Original explorer element ${identifier} is preserved`);
  assert.equal(await page.locator(".feature-hotspot").count(), 5);
  await page.locator("#scene-toggle").click();
  assert.equal(await page.locator("#scene-toggle").getAttribute("aria-pressed"), "true");
  assert.equal(await page.locator('#scene-toggle').evaluate(e => getComputedStyle(e).outlineStyle), 'none', 'Pointer presses do not add a white outline');
  assert.ok(await page.locator('.toolbar button').evaluateAll(buttons => buttons.every(e => e.getBoundingClientRect().height <= 45)), 'Controls stay compact at default desktop text size');
  await page.locator("#scene-toggle").click();
  assert.equal(await page.locator("#scene-toggle").getAttribute("aria-pressed"), "false");
  await page.locator("#zoom-in").click();
  await page.locator("#zoom-out").click();
  await page.locator("#home").click();
  await page.locator("#viewer").focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("h");
  await page.locator("#astronomer-open").click();
  assert.ok(await page.locator("#astronomer-overlay").evaluate(element => element.open));
  await page.locator(".video-playlist__item").nth(1).click();
  assert.equal(await page.locator("#astronomer-video").getAttribute("src"), "videos/02_Why_is_Euclid_so_exciting.mp4");
  await scan(page, "q2release video dialog");
  assert.deepEqual(await page.locator('.video-dialog').evaluate(e => [getComputedStyle(e).borderRadius, getComputedStyle(e).backgroundColor, getComputedStyle(e).boxShadow]), ['0px', 'rgba(0, 0, 0, 0)', 'none'], 'Popup has no surrounding frame');
  assert.ok(await page.locator('.video-dialog__body').evaluate(e => {
    const video = e.querySelector('.video-player').getBoundingClientRect();
    const list = e.querySelector('.video-playlist').getBoundingClientRect();
    const heights = [...e.querySelectorAll('.video-playlist__item')].map(b => b.getBoundingClientRect().height);
    return list.right <= video.left && Math.abs(video.width / video.height - 9 / 16) < .01 && Math.max(...heights) - Math.min(...heights) < 1;
  }), 'Equal-height question buttons sit left of the natural portrait video');
  await page.screenshot({ path: resolve(output, "galactic-centre-dialog-desktop.png") });
  await page.setViewportSize({width:320,height:700});
  await page.screenshot({ path: resolve(output, "galactic-centre-dialog-mobile.png") });
  assert.ok(await page.locator('.video-dialog').evaluate(e => { const b=e.getBoundingClientRect();return b.left >= 0 && b.right <= innerWidth + 1 && e.scrollWidth <= e.clientWidth + 1; }), 'Video dialog reflows at 320px');
  await page.setViewportSize({width:1440,height:1000});
  await page.keyboard.press("Escape");
  assert.ok(await page.locator("#astronomer-open").evaluate(element => element === document.activeElement));
  assert.ok(await page.locator("#astronomer-overlay").evaluate(element => !element.open));
  await scan(page, "q2release restored explorer");
  await page.screenshot({ path: resolve(output, "galactic-centre-desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileDimensions = await page.locator("#viewer").boundingBox();
  assert.ok(Math.abs(mobileDimensions.height - 844) < 1, "Mobile explorer retains the full-screen image");
  await page.screenshot({ path: resolve(output, "galactic-centre-mobile.png") });
  assert.deepEqual(errors, [], "Explorer has no uncaught script errors");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(new URL("euclid-image-gallery.html?contrast=high", base).href);
  await page.waitForFunction(() => document.querySelectorAll("#sensor-grid button").length > 0);
  const firstImage = page.locator("#sensor-grid button").first();
  await firstImage.focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => !document.querySelector("#image-viewer").hidden);
  assert.equal(await page.locator(".site-masthead").getAttribute("inert"), "");
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.querySelector("#image-viewer").hidden);
  assert.ok(await firstImage.evaluate(element => element === document.activeElement));
  await scan(page, "Image gallery high contrast");
  await page.screenshot({ path: resolve(output, "image-gallery.png") });
  await page.getByRole("button", { name: "Switch to dark mode", exact: true }).click();
  await scan(page, "Image gallery dark high contrast");
  await page.setViewportSize({ width: 320, height: 844 });
  await page.evaluate(() => document.documentElement.style.fontSize = "200%");
  await page.addStyleTag({ content: "* { letter-spacing: .12em !important; word-spacing: .16em !important; } p { line-height: 1.5 !important; margin-bottom: 2em !important; }" });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Gallery surrounding content reflows with enlarged text and spacing");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(new URL("euclid-orbit.html?contrast=high", base).href);
  await page.waitForTimeout(1500);
  assert.equal(await page.locator("h1").count(), 1);
  assert.equal(await page.locator("#space-view").count(), 1);
  assert.equal(await page.locator('#tour-launch, #orbit-tour, #tour-announcement').count(), 0, "Guided tour is temporarily removed");
  assert.equal(await page.locator('.brand :is(img, svg):visible').count(), 1, "Orbit uses one visible shared header logo");
  assert.equal(await page.locator('.app-header').evaluate(e=>getComputedStyle(e,'::before').content), 'none', "No old logo mask is painted behind the shared logo");

  assert.equal(await page.locator('.orbit-story, #info-button, #info-dialog').count(), 0, "Orbit explanatory panel and information popup are removed");
  assert.equal(await page.getByText('Explore the spacecraft and its place in space.', {exact:true}).count(), 0);
  assert.equal(await page.locator('#space-view').getAttribute('tabindex'), '0', "The scene retains keyboard camera access");
  await page.locator('#space-view').focus();
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('+'); await page.keyboard.press('6');

  assert.equal(await page.locator(".app-header").count(), 1);
  await scan(page, "Orbit high-contrast shell");
  assert.deepEqual(errors, [], "Migrated interactive pages have no uncaught script errors");
  await page.screenshot({ path: resolve(output, "orbit.png") });
  await context.close();
} catch (error) {
  failures.push(error.stack);
} finally {
  await writeFile(resolve(output, "report.json"), JSON.stringify({ browser: engine, version: browser.version(), reports, standardContrastWarnings, failures, scope: "Structural and interaction checks. Original standard-palette contrast warnings and incomplete results require manual review; high-contrast violations fail. No conformance claim." }, null, 2));
  await browser.close();
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else console.log("Explorer, gallery and orbit smoke checks passed. Review recorded contrast and incomplete results before release.");
