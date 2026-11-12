import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function checkFingertipGalaxy({ browser, base, axe, output }) {
  await mkdir(output, { recursive: true });
  const reports = [];
  const metadata = JSON.parse(await readFile(resolve('data/fingertip-galaxy/marks.json'), 'utf8'));
  const source = await readFile(resolve('fingertip-galaxy.html'), 'utf8');
  assert.doesNotMatch(source, /\{\{[\w-]+\}\}/, 'All template slots are filled');
  const url = new URL('fingertip-galaxy.html', base).href;
  async function noOverflow(page, label) {
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), label);
  }
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: theme, reducedMotion: 'reduce' });
    const errors = [], external = [];
    await context.route(/^https?:/, route => {
      if (new URL(route.request().url()).origin === new URL(base).origin) return route.continue();
      external.push(route.request().url()); return route.abort();
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.title(), 'Fingertip Galaxy — Euclid UK');
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('.fingerprint-marks > path').count(), metadata.marks.length);
    assert.ok(metadata.marks.length > 900, 'Individual traced marks are retained');
    assert.equal(await page.locator('.fingertip-artwork image, canvas').count(), 0, 'The artwork is editable vector paths, not a photograph or bitmap');
    assert.equal(await page.getByRole('img', { name: /Fingertip Galaxy/ }).count(), 1);
    assert.equal(await page.locator('.artwork-stage').evaluate(e => e.getBoundingClientRect().height), 1000, 'Artwork fills the opening viewport');
    assert.ok(await page.locator('.plaque-lettering text').evaluateAll(elements => elements.every(element => {
      const path = document.querySelector(element.querySelector('textPath').getAttribute('href'));
      return element.getNumberOfChars() > 0 && element.getComputedTextLength() < path.getTotalLength();
    })), 'All lettering fits along its curved paths');
    await page.screenshot({ path: resolve(output, `desktop-${theme}.png`) });
    await page.keyboard.press('Tab');
    assert.ok(await page.locator('.skip-link').evaluate(e => e === document.activeElement));
    await page.keyboard.press('Enter');
    assert.ok(await page.locator('#artwork-notes').evaluate(e => e === document.activeElement), 'Skip link focuses the transcript disclosure');
    await page.keyboard.press('Enter');
    assert.ok(await page.locator('.artwork-notes').evaluate(e => e.open));
    assert.ok(await page.getByRole('heading', { name: 'Lettering on the panel' }).isVisible());
    for (const contrast of ['standard', 'high']) {
      if (contrast === 'high') {
        await page.getByRole('link', { name: 'High contrast version', exact: true }).click();
        await page.waitForURL(u => u.searchParams.get('contrast') === 'high');
        assert.equal(await page.evaluate(() => localStorage.getItem('euclid-contrast-choice')), 'high');
        await page.locator('#artwork-notes').click();
      }
      await page.evaluate(axe);
      const result = await page.evaluate(() => window.axe.run({ runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } }));
      reports.push({ file: 'fingertip-galaxy.html', theme, contrast, violations: result.violations, incomplete: result.incomplete });
      assert.deepEqual(result.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), [], `${theme}/${contrast} axe checks`);
    }
    await page.getByRole('link', { name: 'Standard contrast version', exact: true }).click();
    await page.waitForURL(u => u.searchParams.get('contrast') === 'standard');
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await noOverflow(page, `Artwork fits at ${width}px`);
      await page.evaluate(() => scrollTo(0,0));
      await page.screenshot({ path: resolve(output, `mobile-${width}-${theme}.png`) });
    }
    await page.locator('#artwork-notes').click();
    await page.evaluate(() => document.documentElement.style.fontSize = '200%');
    await page.addStyleTag({ content: 'p { line-height: 1.5 !important; margin-bottom: 2em !important; } * { letter-spacing: .12em !important; word-spacing: .16em !important; font-family: serif !important; }' });
    await noOverflow(page, 'Transcript reflows at 320px with enlarged text, text spacing and a font override');
    await page.emulateMedia({ forcedColors: 'active' });
    await noOverflow(page, 'Forced-colour layout reflows');
    const fills = await page.locator('.fingertip-artwork').evaluate(svg => [getComputedStyle(svg.querySelector('.fingerprint-marks')).fill, getComputedStyle(svg.querySelector('.plaque-face')).fill]);
    assert.notEqual(fills[0], fills[1], 'Artwork remains visible in forced colours');
    assert.deepEqual(errors, [], 'No page script errors');
    assert.deepEqual(external, [], 'Artwork makes no external requests');
    await context.close();
  }
  const noScript = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 800 } });
  const fallback = await noScript.newPage();
  await fallback.goto(url);
  assert.equal(await fallback.locator('.fingerprint-marks > path').count(), metadata.marks.length);
  await fallback.locator('#artwork-notes').click();
  assert.ok(await fallback.getByRole('heading', { name: 'Lettering on the panel' }).isVisible());
  await noOverflow(fallback, 'Static artwork works without JavaScript');
  await noScript.close();
  return reports;
}
