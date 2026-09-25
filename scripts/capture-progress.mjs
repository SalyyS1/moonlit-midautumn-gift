/** Repro: npm install --prefix work/browser-validation playwright && node scripts/capture-progress.mjs */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from 'vite';

const root = resolve(import.meta.dirname, '..');
const visualOnly = process.env.CAPTURE_SET === 'visual';
const release = process.argv.includes('--release');
const output = resolve(root, `work/browser-validation/${process.env.CAPTURE_SET === 'screenshots' ? 'evidence-fonts' : process.env.CAPTURE_SET === 'lifecycle' ? 'evidence-lifecycle' : visualOnly || process.env.CAPTURE_SET === 'final' ? 'evidence-final' : 'evidence'}`);
const base = '/moonlit-midautumn-gift/';
const dist = resolve(root, 'work/browser-production');
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH || resolve(root, 'work/browser-validation/node_modules/playwright/index.mjs')).href);
const executablePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const report = { timestamp: new Date().toISOString(), base, viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, checks: [], snapshots: [], errors: [], warnings: [] };
await mkdir(output, { recursive: true });
process.env.VITE_SCENE_DEBUG = '1';
await build({ root, base, build: { outDir: dist, emptyOutDir: true } });
const assetBytes = await readFile(resolve(dist, 'assets/models/moonlit-world.glb'));
report.asset = { bytes: assetBytes.length, sha256: createHash('sha256').update(assetBytes).digest('hex') };
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.glb': 'model/gltf-binary', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (!pathname.startsWith(base)) { response.writeHead(404).end(); return; }
    const file = resolve(dist, pathname.slice(base.length) || 'index.html');
    if (!file.startsWith(dist + sep)) { response.writeHead(403).end(); return; }
    response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(await readFile(file));
  } catch { response.writeHead(404).end(); }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const url = `http://127.0.0.1:${server.address().port}${base}`;
const browsers = [];
const launch = async (args = []) => {
  const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-first-run', '--disable-component-update', '--disk-cache-size=33554432', '--media-cache-size=8388608', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', ...args] });
  browsers.push(browser); return browser;
};
const observe = (page, scenario) => {
  page.on('pageerror', (error) => report.errors.push({ scenario, message: error.message }));
  page.on('console', (message) => { if (message.type() === 'warning' || message.type() === 'error') report.warnings.push({ scenario, type: message.type(), message: message.text() }); });
};
const check = async (name, fn) => {
  if (process.env.CAPTURE_SET === 'screenshots' && !/production base|11 exact/.test(name)) return;
  if (process.env.CAPTURE_SET === 'lifecycle' && !/production base|persisted lifecycle/.test(name)) return;
  if (visualOnly && !/production base|11 exact|automatic letter|idle animation|10-second|chapter navigation|viewport resize|motion change during|memory chapter|persisted lifecycle/.test(name)) return;
  const started = Date.now();
  try { const detail = await fn(); report.checks.push({ name, pass: true, durationMs: Date.now() - started, detail }); }
  catch (error) { report.checks.push({ name, pass: false, durationMs: Date.now() - started, error: error.message, stack: error.stack }); }
  await writeFile(resolve(output, 'browser-report.json'), JSON.stringify(report, null, 2));
  console.log(`${report.checks.at(-1).pass ? 'PASS' : 'FAIL'} ${name}${report.checks.at(-1).error ? `: ${report.checks.at(-1).error}` : ''}`);
};
const snapshot = (page) => page.evaluate(() => document.querySelector('#moon-canvas').__moonlitRuntime?.debugSnapshot);
const capture = (page, name) => page.screenshot({ path: resolve(output, `${name}.png`), animations: 'disabled' });
async function letter(page, trigger, label = trigger.slice(1)) {
  await page.locator(trigger).click();
  assert.equal(await page.locator('#letter-backdrop').isVisible(), true);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'letter-close');
  assert.equal(await page.locator('.topbar').evaluate(node => node.inert), true);
  assert.equal(await page.locator('#skip-link').evaluate(node => node.inert), true);
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'letter-action');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'letter-close');
  await capture(page, `letter-${label}`);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#letter-backdrop').isVisible(), false);
  assert.equal(await page.evaluate(() => document.activeElement.id), trigger.slice(1));
}
async function dismissAutoLetter(page) {
  if (await page.locator('#letter-backdrop').isVisible().catch(() => false)) await page.keyboard.press('Escape');
}
try {
  const browser = await launch();
  report.browser = browser.version();
  const page = await browser.newPage({ viewport: report.viewport, deviceScaleFactor: 1 });
  observe(page, 'normal');
  await page.addInitScript(() => {
    document.addEventListener('world-ready', () => { window.__sceneReadyAt = performance.now(); }, true);
    window.__letterRevealEvents = 0;
    window.addEventListener('DOMContentLoaded', () => {
      document.querySelector('#moon-canvas')?.addEventListener('letter-reveal', event => {
        window.__letterRevealEvents++;
        window.__lastLetterReveal = event.detail;
      });
    }, { once: true });
    window.addEventListener('pageshow', event => { window.__pageShowPersisted = event.persisted; });
  });
  await check('production base-path direct load', async () => {
    const response = await page.goto(url);
    assert.equal(response.status(), 200);
    await page.waitForFunction(() => document.querySelector('#moon-canvas')?.dataset.sceneReady === 'true', null, { timeout: 60000 });
    assert.ok(await snapshot(page), 'Build must expose VITE_SCENE_DEBUG diagnostics');
    report.firstMeaningful3DMs = await page.evaluate(() => window.__sceneReadyAt);
    report.assetTiming = await page.evaluate(() => performance.getEntriesByType('resource').filter(entry => /\.glb/.test(entry.name)).map(entry => ({ name: entry.name, startMs: entry.startTime, responseEndMs: entry.responseEnd, durationMs: entry.duration })));
    report.initial = await snapshot(page);
    const cdp = await page.context().newCDPSession(page); await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
    const { root: documentNode } = await cdp.send('DOM.getDocument');
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: documentNode.nodeId, selector: '#chapter-copy h2' });
    report.headingFonts = (await cdp.send('CSS.getPlatformFontsForNode', { nodeId })).fonts;
    return { firstMeaningful3DMs: report.firstMeaningful3DMs, gpu: report.initial.gpu };
  });
  await check('11 exact progress captures and finite camera transforms', async () => {
    for (let index = 0; index <= 10; index++) {
      await page.evaluate((progress) => document.querySelector('#moon-canvas').__moonlitRuntime.seek(progress), index / 10);
      await page.waitForTimeout(250);
      const state = await snapshot(page);
      assert.ok([...state.camera.position, ...state.camera.quaternion, state.camera.fov].every(Number.isFinite));
      assert.ok(Math.abs(state.progress - index / 10) < 0.001);
      report.snapshots.push(state);
      await capture(page, `progress-${String(index).padStart(2, '0')}`);
      // The final exact seek intentionally exercises the automatic cinematic
      // path; close the accessible surface before the explicit focus test.
      if (index === 10 && await page.locator('#letter-backdrop').isVisible()) await page.keyboard.press('Escape');
    }
  });
  await check('automatic letter reveal crosses threshold without a click and reverses cleanly', async () => {
    await page.evaluate(() => document.querySelector('#moon-canvas').__moonlitRuntime.seek(.70));
    await page.waitForTimeout(80);
    assert.equal(await page.locator('#letter-backdrop').isVisible(), false);
    const before = await snapshot(page);
    await page.evaluate(() => document.querySelector('#moon-canvas').__moonlitRuntime.seek(.95));
    await page.waitForFunction(() => document.querySelector('#letter-backdrop')?.hidden === false);
    assert.equal(await page.locator('#letter-backdrop').isVisible(), true, 'Letter must open automatically at the cinematic end');
    const autoCopy = page.locator('.letter-auto-reveal');
    assert.equal(await autoCopy.count(), 1, 'Cinematic reveal must update the active chapter copy');
    assert.match(await autoCopy.textContent(), /đã mở/i);
    const opened = await snapshot(page);
    assert.equal(opened.letterRevealed, true);
    const event = await page.evaluate(() => ({ count: window.__letterRevealEvents, detail: window.__lastLetterReveal }));
    assert.ok(event.count >= 1); assert.equal(event.detail.automatic, true); assert.ok(event.detail.progress >= .94);
    await page.keyboard.press('Escape');
    await page.evaluate(() => document.querySelector('#moon-canvas').__moonlitRuntime.seek(.70));
    await page.waitForTimeout(80);
    assert.equal((await snapshot(page)).letterRevealed, false, 'Reverse scroll must re-arm the automatic reveal');
    await page.evaluate(() => document.querySelector('#moon-canvas').__moonlitRuntime.seek(.95));
    await page.waitForFunction(() => document.querySelector('#letter-backdrop')?.hidden === false);
    assert.ok((await page.evaluate(() => window.__letterRevealEvents)) >= 2, 'Second forward crossing must dispatch a second reveal');
    await page.keyboard.press('Escape');
    return { firstProgress: before.progress, openedProgress: opened.progress, revealEvents: event.count };
  });
  await check('cinematic letter keyboard focus, trap and Escape', () => letter(page, '#open-letter'));
  await check('chapter navigation synchronizes each timeline threshold', async () => {
    // Diagnostic seeks leave document scroll unchanged; synchronize it before testing real navigation.
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await page.waitForTimeout(200);
    for (let index = 0; index < 6; index++) {
      await page.locator(`.chapter-dot[data-chapter="${index}"]`).click();
      await page.waitForFunction((i) => document.querySelector(`.chapter-dot[data-chapter="${i}"]`)?.getAttribute('aria-current') === 'step', index);
      assert.equal((await page.locator('#progress-readout').textContent()).trim(), `${String(index + 1).padStart(2, '0')} / 06`);
      await dismissAutoLetter(page);
    }
  });
  await check('responsive cinematic layouts at 320, 390, 768px', async () => {
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 844 });
      await page.evaluate(() => { window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }); document.querySelector('#moon-canvas').__moonlitRuntime.seek(1); });
      await page.waitForTimeout(200);
      await dismissAutoLetter(page);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Horizontal overflow at ${width}px`);
      await capture(page, `cinematic-${width}`);
      await letter(page, '#open-letter', `cinematic-${width}`);
    }
    await page.setViewportSize(report.viewport);
  });
  await check('viewport resize resamples progress without new scroll input', async () => {
    await page.evaluate(() => window.scrollTo({ top: .25 * (document.documentElement.scrollHeight - innerHeight), behavior: 'instant' }));
    await page.waitForTimeout(350);
    await page.setViewportSize({ width: 1440, height: 950 });
    await page.waitForFunction(() => {
      const expected = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
      return Math.abs(document.querySelector('#moon-canvas').__moonlitRuntime.debugSnapshot.target - expected) < .0001;
    });
    await page.setViewportSize(report.viewport);
  });
  await check('memory chapter keeps the story copy free of photo placeholders at 320px', async () => {
    await page.setViewportSize({ width: 320, height: 844 });
    await page.evaluate(() => { window.scrollTo({ top: .8 * (document.documentElement.scrollHeight - innerHeight), behavior: 'instant' }); document.querySelector('#moon-canvas').__moonlitRuntime.seek(.8); });
    await page.locator('#chapter-copy h2').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#chapter-copy .memory-captions').count(), 0);
    assert.equal(await page.locator('#static-memory-captions').count(), 0);
    assert.doesNotMatch(await page.locator('#chapter-copy').textContent(), /Ảnh kỷ niệm|ngày ·|địa điểm/i);
    const bounds = await page.locator('#chapter-copy').boundingBox(); assert.ok(bounds.x >= -1 && bounds.x + bounds.width <= 321);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await capture(page, 'memories-expanded-320'); await page.setViewportSize(report.viewport);
  });
  await check('motion change during open letter preserves focus restoration', async () => {
    await dismissAutoLetter(page);
    await page.evaluate(() => document.querySelector('#moon-canvas').__moonlitRuntime.seek(1));
    await dismissAutoLetter(page);
    // A diagnostic seek can complete a chapter copy transition in the same
    // frame; let the final trigger settle before exercising focus behavior.
    await page.waitForTimeout(220);
    await page.locator('#open-letter').click(); await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.locator('#letter-backdrop').isVisible(), true);
    await page.keyboard.press('Escape');
    const focusState = await page.evaluate(() => ({
      id: document.activeElement?.id ?? '',
      readable: document.body.classList.contains('is-readable'),
      staticButtonVisible: !document.querySelector('#static-letter-button')?.hidden,
      staticButton: (() => { const node = document.querySelector('#static-letter-button'); return node ? { connected: node.isConnected, tabIndex: node.tabIndex, disabled: node.disabled, rects: node.getClientRects().length, inert: node.inert, ancestor: node.closest('[inert], [hidden]')?.id ?? '' } : null; })(),
      openLetterVisible: Boolean(document.querySelector('#open-letter')?.getClientRects().length),
      url: location.href,
    }));
    assert.ok(['static-story', 'static-letter-button', 'story'].includes(focusState.id), `Unexpected focus after mode switch: ${JSON.stringify(focusState)}`);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForFunction(() => document.querySelector('#moon-canvas')?.__moonlitRuntime?.debugSnapshot.ready);
  });
  await check('idle animation while scroll stops', async () => {
    await dismissAutoLetter(page);
    await page.evaluate(() => document.querySelector('#moon-canvas').__moonlitRuntime.seek(0.45));
    const before = await snapshot(page); await capture(page, 'idle-before');
    await page.waitForTimeout(1500);
    const after = await snapshot(page); await capture(page, 'idle-after');
    assert.ok(after.animationTime > before.animationTime);
    const moving = after.animatedNodes.filter((node, index) => JSON.stringify(node) !== JSON.stringify(before.animatedNodes[index])).map((node) => node.name);
    assert.ok(moving.length >= 6, `Only ${moving.length} animated nodes changed`);
    return { movingNodes: moving, elapsedAnimationSeconds: after.animationTime - before.animationTime };
  });
  await check('10-second warm RAF performance sample', async () => {
    await page.waitForTimeout(1000);
    const timing = await page.evaluate(() => new Promise((done) => {
      const deltas = []; let previous; let start;
      const tick = (now) => { start ??= now; if (previous !== undefined) deltas.push(now - previous); previous = now;
        if (now - start < 10000) requestAnimationFrame(tick); else done({ deltas, durationMs: now - start }); };
      requestAnimationFrame(tick);
    }));
    const sorted = [...timing.deltas].sort((a, b) => a - b);
    report.performance = { frames: sorted.length, durationMs: timing.durationMs, fps: sorted.length / timing.durationMs * 1000, p95Ms: sorted[Math.floor(sorted.length * .95)], maxMs: sorted.at(-1), framesOver33Ms: sorted.filter((x) => x > 33).length, gpu: (await snapshot(page)).gpu };
    report.performanceGate = { firstMeaningfulUnder1500Ms: report.firstMeaningful3DMs < 1500, fpsAtLeast55: report.performance.fps >= 55, noFrameOver33Ms: report.performance.framesOver33Ms === 0, hardwareAccelerated: !/swiftshader|llvmpipe|software/i.test(report.performance.gpu) };
    return report.performance;
  });
  await check('10 real scroll round trips return stable camera', async () => {
    const scroll = async (progress) => {
      await page.evaluate((p) => window.scrollTo({ top: p * (document.documentElement.scrollHeight - innerHeight), behavior: 'instant' }), progress);
      await page.waitForFunction((p) => Math.abs(document.querySelector('#moon-canvas').__moonlitRuntime.debugSnapshot.progress - p) < .0001, progress, { timeout: 30000 });
    };
    await scroll(0); const start = await snapshot(page);
    for (let cycle = 0; cycle < 10; cycle++) { await scroll(1); await scroll(0); }
    const end = await snapshot(page);
    const maxPositionDrift = Math.max(...end.camera.position.map((value, index) => Math.abs(value - start.camera.position[index])));
    assert.ok(maxPositionDrift < .01, `Camera drift ${maxPositionDrift}`);
    return { maxPositionDrift, cycles: 10 };
  });
  await check('base-path reload reopens GLB', async () => {
    await page.reload();
    await page.waitForFunction(() => document.querySelector('#moon-canvas')?.dataset.sceneReady === 'true');
  });
  await check('navigate away and Back preserves a working scene', async () => {
    await page.goto('about:blank');
    await page.goBack();
    await page.waitForFunction(() => document.querySelector('#moon-canvas')?.__moonlitRuntime?.debugSnapshot.ready, null, { timeout: 15000 });
    return { bfcachePersisted: await page.evaluate(() => window.__pageShowPersisted) };
  });
  await check('brand returns to opening; button key handlers preserve native events', async () => {
    await page.evaluate(() => { window.scrollTo(0, document.documentElement.scrollHeight); });
    await page.waitForTimeout(400);
    await dismissAutoLetter(page);
    await page.locator('.brand').click();
    await page.waitForFunction(() => document.querySelector('#moon-canvas').__moonlitRuntime.debugSnapshot.progress < .001);
    assert.equal(await page.locator('#sound-button').evaluate(node => {
      const event = new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true, cancelable: true }); node.dispatchEvent(event); return event.defaultPrevented;
    }), false);
  });
  await check('live reduced-motion toggle disposes 3D then restores scene', async () => {
    await page.evaluate(() => { window.__previousRuntime = document.querySelector('#moon-canvas').__moonlitRuntime; });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => document.body.classList.contains('is-readable'));
    const disposed = await page.evaluate(() => window.__previousRuntime.debugSnapshot);
    assert.equal(disposed.disposed, true); assert.equal(disposed.rafActive, false);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForFunction(() => document.querySelector('#moon-canvas')?.__moonlitRuntime?.debugSnapshot.ready);
  });
  await check('persisted lifecycle handlers restore navigation, letter, audio and readable preference', async () => {
    await page.evaluate(() => { window.scrollTo({ top: .8 * (document.documentElement.scrollHeight - innerHeight), behavior: 'instant' }); });
    await page.locator('#sound-button').click(); await page.waitForFunction(() => document.querySelector('#sound-button').getAttribute('aria-pressed') === 'true', null, { timeout: 5000 });
    await page.evaluate(() => { window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })); window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })); });
    await page.waitForFunction(() => document.querySelector('#moon-canvas')?.__moonlitRuntime?.debugSnapshot.ready);
    assert.equal(await page.locator('#sound-button').getAttribute('aria-pressed'), 'false');
    assert.equal(await page.locator('.chapter-dot').count(), 6);
    await page.locator('.chapter-dot[data-chapter="5"]').click(); await dismissAutoLetter(page); await letter(page, '#open-letter', 'persisted-lifecycle');
    await page.locator('#sound-button').click(); await page.waitForFunction(() => document.querySelector('#sound-button').getAttribute('aria-pressed') === 'true', null, { timeout: 5000 });
    await page.locator('#skip-link').focus(); await page.keyboard.press('Enter');
    await page.evaluate(() => { window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })); window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })); });
    assert.equal(await snapshot(page), undefined); assert.equal(await page.locator('#scene-poster').isVisible(), true);
    assert.equal(await page.evaluate(() => document.body.classList.contains('is-readable')), true);
    await page.evaluate(() => history.replaceState(null, '', location.pathname));
    await page.reload(); await page.waitForFunction(() => document.querySelector('#moon-canvas')?.__moonlitRuntime?.debugSnapshot.ready);
    return { method: 'Synthetic persisted pagehide/pageshow; real BFCache status reported separately' };
  });
  await check('WebGL context loss preserves readable story and letter', async () => {
    await dismissAutoLetter(page);
    await page.evaluate(() => document.querySelector('#moon-canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
    await page.waitForFunction(() => document.body.classList.contains('is-readable'));
    await letter(page, '#static-letter-button', 'context-loss');
    await capture(page, 'context-loss');
  });
  await check('responsive readable story and letter at 320, 390, 768px', async () => {
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 844 });
      await page.evaluate(() => window.scrollTo(0, 0));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Horizontal overflow at ${width}px`);
      await capture(page, `responsive-${width}`);
      await dismissAutoLetter(page);
      await letter(page, '#static-letter-button', `responsive-${width}`);
    }
  });
  await check('skip during GLB loading stops renderer and preserves poster', async () => {
    const loading = await browser.newPage({ viewport: report.viewport }); let release;
    await loading.route('**/*.glb', route => new Promise(done => { release = async () => { await route.abort(); done(); }; }));
    await loading.goto(url, { waitUntil: 'domcontentloaded' });
    await loading.locator('#skip-link').focus(); await loading.keyboard.press('Enter');
    assert.equal(await loading.locator('#scene-poster').isVisible(), true);
    assert.equal(await loading.locator('#world-status').isVisible(), false);
    assert.equal(await snapshot(loading), undefined);
    await capture(loading, 'skip-during-loading');
    if (release) await release();
    await loading.close();
  });
  for (const mode of ['reduced-motion', 'glb-404', 'webgl-disabled', 'no-javascript']) {
    await check(`${mode} readable fallback`, async () => {
      const targetBrowser = mode === 'webgl-disabled' ? await launch(['--disable-webgl']) : browser;
      const fallback = await targetBrowser.newPage({ viewport: report.viewport, reducedMotion: mode === 'reduced-motion' ? 'reduce' : 'no-preference', javaScriptEnabled: mode !== 'no-javascript' });
      observe(fallback, mode);
      const requests = [];
      fallback.on('request', (request) => { if (request.url().endsWith('.glb')) requests.push(request.url()); });
      if (mode === 'glb-404') await fallback.route('**/*.glb', (route) => route.fulfill({ status: 404, body: 'GLB intentionally unavailable' }));
      await fallback.goto(url);
      await fallback.waitForFunction(() => document.body.classList.contains('is-readable'));
      await fallback.locator('#static-story').waitFor({ state: 'visible' });
      assert.equal(await fallback.locator('.static-chapter').count(), 6);
      assert.equal(await fallback.locator('#static-memory-captions').count(), 0);
      assert.doesNotMatch(await fallback.locator('#static-story').textContent(), /Ảnh kỷ niệm|ngày ·|địa điểm/i);
      if (mode !== 'no-javascript') {
        await letter(fallback, '#static-letter-button', mode);
      } else {
        assert.equal(await fallback.locator('.static-letter-content').isVisible(), true);
        assert.ok(await fallback.locator('.static-story').evaluate(node => getComputedStyle(node).padding !== '0px'), 'No-JS document must load its CSS');
      }
      assert.equal(await fallback.locator('#scene-poster').isVisible(), true, 'Fallback must include its local poster');
      if (mode === 'reduced-motion') assert.equal(requests.length, 0, 'Reduced motion should skip the GLB payload');
      await fallback.evaluate(() => window.scrollTo(0, 0));
      await capture(fallback, mode);
      await fallback.close();
      return { glbRequests: requests.length };
    });
  }
} finally {
  report.releasePass = report.checks.every(item => item.pass) && report.errors.length === 0 && Boolean(report.performanceGate) && Object.values(report.performanceGate).every(Boolean);
  try { await writeFile(resolve(output, 'browser-report.json'), JSON.stringify(report, null, 2)); }
  finally { await Promise.all(browsers.map((browser) => browser.close())); await new Promise((done) => server.close(done)); }
}
console.log(`Evidence: ${output}`);
console.log(`Release gates: ${report.releasePass ? 'PASS' : 'FAIL'}${release ? ' (enforced)' : ' (diagnostic only; use --release to enforce)'}`);
if (report.checks.some((item) => !item.pass) || report.errors.length || (release && !report.releasePass)) process.exitCode = 1;
