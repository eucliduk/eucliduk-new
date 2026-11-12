import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = await import(process.env.EUCLID_PLAYWRIGHT_PATH || 'playwright');
const output = resolve('.build/accessibility/dr1-map');
await mkdir(output, { recursive: true });
const base = process.env.EUCLID_SITE_BASE_URL || 'http://127.0.0.1:8767/';
const browser = await chromium.launch({ headless: true, executablePath: process.env.EUCLID_BROWSER_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--disable-background-networking'] });
const errors = [], external = [], scans = [];
try {
  const context = await browser.newContext({ serviceWorkers: 'block', hasTouch: true });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1') return route.continue();
    external.push(url.href);
    return route.abort();
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  const axe = await readFile(require.resolve('axe-core/axe.min.js'), 'utf8');
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(new URL('dr1-data.html', base).href);
    assert.equal(await page.locator('#map-title').innerHTML(), 'MAPPING THE<br>UNIVERSE');
    assert.equal(await page.locator('.map-header .eyebrow').count(), 0);
    assert.equal(await page.locator('.map-footer > .map-partners').count(), 1, 'Partner logos sit separately on the left');
    assert.equal(await page.locator('.map-footer-tools #regions').count(), 1, 'Image links are grouped with the right-side controls');
    if(width === 1440) assert.ok(await page.locator('.map-footer').evaluate(e => e.querySelector('.map-partners').getBoundingClientRect().right < e.querySelector('.map-footer-tools').getBoundingClientRect().left), 'Partners left and controls right');
    assert.deepEqual(await page.locator('.region-link').first().evaluate(e => {
      const s = getComputedStyle(e); return [s.borderRadius, s.fontWeight, s.textTransform, s.fontSize, s.backgroundColor, s.color];
    }), ['5.6px', '400', 'uppercase', width > 720 ? '16.8px' : '16px', 'rgb(255, 255, 255)', 'rgb(0, 0, 0)'], 'DR1 links match filter typography and white explorer palette');
    await page.locator('.sky-map > img').evaluate(image => image.decode());
    await page.evaluate(() => document.fonts.ready);
    const info = page.locator('.map-credit > summary');
    await info.focus();
    await info.press('Enter');
    assert.ok(await page.locator('.map-credit-panel').isVisible(), 'Info button opens the map details and credits');
    await info.press('Escape');
    assert.equal(await page.locator('.map-credit').evaluate(element => element.open), false);
    const partnerHeights = await page.locator('.map-partners img').evaluateAll(images => images.map(image => image.getBoundingClientRect().height));
    assert.equal(partnerHeights.length, 2);
    assert.ok(Math.abs(partnerHeights[0]-partnerHeights[1]) < 1, 'ESA and UK Space Agency logos have matching displayed heights');
    for (const enlarged of [false, true]) {
      await page.evaluate(enlarged => document.documentElement.style.fontSize = enlarged ? '200%' : '', enlarged);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}: no overflow, enlarged=${enlarged}`);
      const geometry = await page.evaluate(() => {
        const image = document.querySelector('.sky-map > img').getBoundingClientRect();
        const svg = document.querySelector('.sky-map > svg').getBoundingClientRect();
        return ['x','y','width','height'].every(key => Math.abs(image[key]-svg[key]) < 1);
      });
      assert.ok(geometry, 'Image and interactive overlay share identical bounds');
      const header = await page.locator('.map-header').boundingBox();
      const footer = await page.locator('.map-footer').boundingBox();
      const map = await page.locator('.sky-map').boundingBox();
      if (width > 720) {
        assert.equal(map.x, 0);
        assert.equal(map.y, 0);
        assert.equal(map.width, width);
        assert.equal(map.height, page.viewportSize().height, 'Map fills the screen behind the corner controls');
      } else assert.ok(header.y + header.height <= map.y + 1, 'Narrow layouts keep heading and map separate');
      assert.ok(header.y + header.height <= footer.y, 'Controls do not overlap when text is enlarged');
    }
    await page.evaluate(() => document.documentElement.style.fontSize = '');
    for (const region of ['north','south']) {
      const link = page.locator(`.region-link[data-region='${region}']`);
      await link.focus();
      assert.ok(await page.locator(`.map-region[data-region='${region}']`).evaluate(el => el.classList.contains('is-highlighted')), 'Keyboard focus highlights the matching footprint');
      await link.blur();
    }
    await page.locator('.region-link[data-region="north"]').hover();
    await page.screenshot({ path: resolve(output, `map-${width}.png`), fullPage: true });
    await page.evaluate(axe);
    const result = await page.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21aa'] } }));
    scans.push({ width, violations: result.violations });
    assert.deepEqual(result.violations.map(v=>v.id), [], 'Automated page checks');
    if (width === 1440) {
      for (const region of ['north','south']) {
        const hotspot = page.locator(`.map-region[data-region='${region}']`);
        await hotspot.focus();
        await Promise.all([page.waitForURL(url => url.port === '8766'), page.keyboard.press('Enter')]);
        assert.equal(page.url().includes('south.html'), region === 'south', 'Each region opens its matching existing viewer');
        await page.waitForFunction(() => typeof ready !== 'undefined' && ready, null, { timeout: 30000 });
        await page.goBack();
      }
    }
  }
  await page.goto(new URL('index.html',base).href);
  assert.equal(await page.getByRole('link', {name:'Explore the data',exact:false}).first().getAttribute('href'), 'dr1-data.html');
  assert.deepEqual(errors, []);
  assert.deepEqual(external, [], 'Everything is loaded locally');
  console.log('DR1 map: image alignment, both viewer links, keyboard highlights, mobile, enlarged text and local-only requests passed.');
} finally {
  await browser.close();
  await writeFile(resolve(output, 'report.json'), JSON.stringify({ errors, external, scans },null,2));
}
