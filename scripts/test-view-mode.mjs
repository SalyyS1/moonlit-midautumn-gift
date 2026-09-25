/** Run against a fresh npm run build preview: node scripts/test-view-mode.mjs [preview URL]. */
import assert from 'node:assert/strict';
import { mkdir, writeFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'work/static-scroll-debug/fixed');
const url = process.argv[2] || 'http://127.0.0.1:4173/moonlit-midautumn-gift/';
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH || resolve(root, 'work/browser-validation/node_modules/playwright/index.mjs')).href);
await mkdir(output, { recursive: true });
const videoAvailable = (await readdir(resolve(process.env.LOCALAPPDATA || root, 'ms-playwright')).catch(() => [])).some(name => name.startsWith('ffmpeg-'));
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-first-run', '--disable-component-update'] });
const report = { timestamp: new Date().toISOString(), url, browser: browser.version(), checks: [], errors: [], videoAvailable };
const contexts = [];
async function openPage(mode, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...(mode ? { reducedMotion: mode } : {}), ...options });
  contexts.push(context);
  const page = await context.newPage();
  // Playwright's implicit media emulation can hide the user's actual system preference.
  if (!mode) await page.emulateMedia({ reducedMotion: null });
  page.on('pageerror', error => report.errors.push(error.message));
  await page.addInitScript(() => {
    window.__viewModeEvidence = { frames: 0, progress: 0, ready: 0 };
    document.addEventListener('world-progress', event => {
      window.__viewModeEvidence.frames++;
      window.__viewModeEvidence.progress = event.detail.progress;
    }, true);
    document.addEventListener('world-ready', () => { window.__viewModeEvidence.ready++; }, true);
  });
  return page;
}
const state = page => page.evaluate(() => ({
  href: location.href, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  readable: document.body.classList.contains('is-readable'), scrollY,
  canvasHidden: document.querySelector('#moon-canvas').hidden,
  posterHidden: document.querySelector('#scene-poster').hidden,
  message: document.querySelector('#view-mode-message').textContent,
  heading: document.querySelector('#chapter-copy h2')?.textContent,
  glbRequests: performance.getEntriesByType('resource').filter(entry => entry.name.includes('.glb')).length,
  ...window.__viewModeEvidence,
}));
const ready = page => page.waitForFunction(() => document.querySelector('#moon-canvas')?.dataset.sceneReady === 'true' && !document.querySelector('#moon-canvas').hidden && document.querySelector('#scene-poster').hidden, null, { timeout: 60000 });
const reading = page => page.waitForFunction(() => document.body.classList.contains('is-readable') && !document.querySelector('#webgl-fallback').hidden);
const screenshot = (page, name) => page.screenshot({ path: resolve(output, `${name}.png`) });
async function check(name, run) {
  const start = Date.now();
  try { report.checks.push({ name, pass: true, detail: await run(), durationMs: Date.now() - start }); }
  catch (error) { report.checks.push({ name, pass: false, error: error.message, durationMs: Date.now() - start }); }
  await writeFile(resolve(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`${report.checks.at(-1).pass ? 'PASS' : 'FAIL'} ${name}${report.checks.at(-1).error ? `: ${report.checks.at(-1).error}` : ''}`);
}
try {
  await check('Actual browser/system motion preference remains observable', async () => {
    const page = await openPage();
    await page.goto(url);
    await page.waitForFunction(() => document.body.classList.contains('has-js'));
    const actualReduce = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (actualReduce) await reading(page); else await ready(page);
    const result = await state(page);
    assert.equal(result.readable, actualReduce);
    if (actualReduce) {
      assert.equal(result.glbRequests, 0);
      assert.equal(result.frames, 0);
      assert.match(result.message, /giảm chuyển động/);
      assert.equal(await page.locator('#enter-3d-button').isVisible(), true);
    }
    await screenshot(page, 'system-default');
    if (actualReduce) {
      await page.locator('#enter-3d-button').click(); await ready(page);
      await page.mouse.move(1020, 580); await page.mouse.wheel(0, 2400);
      await page.waitForFunction(() => window.__viewModeEvidence.progress > 0.4);
      const optedIn = await state(page);
      assert.equal(optedIn.reduced, true);
      assert.match(optedIn.heading, /Cuội/);
      result.optedIn = optedIn;
    }
    await page.context().close();
    return result;
  });
  await check('Fresh 3D link opens the scene under the actual system preference without another click', async () => {
    const page = await openPage();
    await page.goto(`${url}?view=3d`); await ready(page);
    const result = await state(page);
    assert.equal(result.readable, false);
    assert.equal(new URL(result.href).searchParams.get('view'), '3d');
    assert.ok(result.frames > 0 && result.glbRequests > 0);
    await page.context().close();
    return result;
  });
  await check('Reduced-motion user can explicitly enter 3D, wheel forward/back, reload, and return to reading', async () => {
    const page = await openPage('reduce', videoAvailable ? { recordVideo: { dir: output, size: { width: 960, height: 600 } } } : {});
    const video = page.video();
    await page.goto(url);
    await reading(page);
    const initial = await state(page);
    assert.equal(initial.glbRequests, 0);
    assert.equal(initial.frames, 0);
    assert.match(initial.message, /giảm chuyển động/);
    await page.locator('#enter-3d-button').click();
    await ready(page);
    const before = await state(page);
    assert.equal(before.reduced, true, 'Explicit opt-in must not change the OS preference');
    assert.equal(new URL(before.href).searchParams.get('view'), '3d');
    await screenshot(page, '3d-before-wheel');
    await page.mouse.move(1020, 580);
    await page.mouse.wheel(0, 2400);
    await page.waitForFunction(() => window.__viewModeEvidence.progress > 0.4);
    const forward = await state(page);
    assert.ok(forward.scrollY > 2000 && forward.frames > before.frames);
    assert.match(forward.heading, /Cuội/);
    await screenshot(page, '3d-after-wheel');
    await page.mouse.wheel(0, -2400);
    await page.waitForFunction(() => window.__viewModeEvidence.progress < 0.01);
    assert.equal((await state(page)).scrollY, 0);
    await page.reload();
    await ready(page);
    const reloaded = await state(page);
    assert.equal(reloaded.reduced, true);
    assert.equal(reloaded.readable, false);
    await page.locator('#view-mode-button').click();
    await reading(page);
    const returned = await state(page);
    assert.equal(new URL(returned.href).searchParams.has('view'), false);
    assert.equal(returned.canvasHidden, true);
    assert.match(returned.message, /chế độ đọc/);
    const frames = returned.frames;
    await page.waitForTimeout(200);
    assert.equal((await state(page)).frames, frames, 'Reading must dispose the render loop');
    await page.locator('#view-mode-button').click();
    await ready(page);
    assert.equal((await state(page)).reduced, true);
    await page.context().close();
    if (video) { await video.saveAs(resolve(output, 'real-scroll-opt-in.webm')); report.video = 'real-scroll-opt-in.webm'; }
    return { initial, before, forward, reloaded, returned };
  });
  await check('Live preference changes still select the default mode before an explicit choice', async () => {
    const page = await openPage('no-preference');
    await page.goto(url); await ready(page);
    await page.emulateMedia({ reducedMotion: 'reduce' }); await reading(page);
    assert.match((await state(page)).message, /giảm chuyển động/);
    await page.emulateMedia({ reducedMotion: 'no-preference' }); await ready(page);
    const result = await state(page);
    assert.equal(new URL(result.href).searchParams.has('view'), false);
    assert.equal(result.readable, false);
    await page.context().close();
    return result;
  });
  await check('GLB failure shows a reason and manual retry recovers after the network returns', async () => {
    const page = await openPage('reduce');
    let requests = 0;
    await page.route('**/*.glb', async route => {
      requests++;
      if (requests === 1) await route.fulfill({ status: 404, body: 'Intentional asset failure' });
      else await route.continue();
    });
    await page.goto(`${url}?view=3d`);
    await reading(page);
    const failed = await state(page);
    assert.match(failed.message, /chưa mở được/);
    assert.equal(requests, 1);
    await screenshot(page, 'asset-failure-retry');
    await page.locator('#enter-3d-button').click();
    await ready(page);
    assert.equal(requests, 2);
    const recovered = await state(page);
    assert.equal(recovered.readable, false);
    await page.context().close();
    return { failed, recovered, requests };
  });
  await check('320px controls fit and remain outside the letter dialog focus trap', async () => {
    const page = await openPage('reduce', { viewport: { width: 320, height: 844 } });
    await page.goto(url); await reading(page);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
    for (const selector of ['#view-mode-button', '#sound-button']) {
      const box = await page.locator(selector).boundingBox();
      assert.ok(box && box.x >= 0 && box.x + box.width <= 321 && box.height >= 44, selector);
    }
    await screenshot(page, 'mobile-controls');
    await page.locator('#static-letter-button').click();
    assert.equal(await page.locator('#letter-backdrop').isVisible(), true);
    assert.equal(await page.locator('.topbar').evaluate(node => node.inert), true);
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'letter-action');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'letter-close');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'static-letter-button');
    await page.context().close();
    return { viewport: 320, horizontalOverflow: false, focusTrap: true };
  });
} finally {
  await Promise.allSettled(contexts.map(context => context.close()));
  await browser.close();
  await writeFile(resolve(output, 'report.json'), JSON.stringify(report, null, 2));
}
if (report.errors.length || report.checks.some(check => !check.pass)) process.exitCode = 1;
