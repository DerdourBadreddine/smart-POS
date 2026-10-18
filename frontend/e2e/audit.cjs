const { chromium } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const stage = process.env.AUDIT_STAGE || 'before';
  const out = path.resolve(__dirname, '../../docs/screenshots', stage);
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: 'chromium' });
  const results = [];
  const routes = ['dashboard', 'inventory', 'pos', 'sales', 'repairs', 'repairs/new', 'customers', 'devices', 'expenses', 'reports', 'settings'];
  const api = await browser.newContext();
  const base = process.env.BASE_URL || 'http://127.0.0.1:8765';
  const phones = await (await api.request.get(`${base}/api/products/?category__kind=PHONE`)).json();
  const repairs = await (await api.request.get(`${base}/api/repairs/`)).json();
  const soldUnits = await (await api.request.get(`${base}/api/phone-units/?status=SOLD`)).json();
  if(stage==='after' && phones.results?.length) routes.push(`inventory/phones/${phones.results[0].id}`);
  if(stage==='after' && repairs.results?.length) routes.push(`repairs/${repairs.results[0].id}`);
  await api.close();
  for (const lang of ['fr', 'ar']) {
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    await context.addInitScript(lang => localStorage.setItem('smart-pos-language', lang), lang);
    const page = await context.newPage();
    for (const route of routes) {
      const entry = { lang, route, errors: [], failed: [], external: [] };
      const onError = error => entry.errors.push(String(error));
      const onResponse = response => { if (response.status() >= 400) entry.failed.push(`${response.status()} ${response.url()}`); };
      const onRequest = request => { if (!/^http:\/\/(127\.0\.0\.1|localhost)(:|\/)/.test(request.url())) entry.external.push(request.url()); };
      page.on('pageerror', onError); page.on('response', onResponse); page.on('request', onRequest);
      await page.goto(`${process.env.BASE_URL || 'http://127.0.0.1:8765'}/${route}`);
      await page.waitForTimeout(500);
      if(stage==='after' && route==='devices' && soldUnits.results?.length){
        await page.locator('input').fill(soldUnits.results[0].imei);
        await page.locator('form button').click();
        await page.waitForTimeout(300);
      }
      await page.screenshot({ path: path.join(out, `${lang}-${route.replaceAll('/', '-')}.png`), fullPage: true });
      entry.body = (await page.locator('main').innerText()).slice(0, 4000);
      entry.violations = (await new AxeBuilder({ page }).analyze()).violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) }));
      entry.overflow = await page.evaluate(() => [...document.querySelectorAll('main *')].filter(e => e.clientWidth > 0 && e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflowX === 'visible').map(e => `${e.tagName}.${e.className}`).slice(0, 30));
      results.push(entry);
      page.off('pageerror', onError); page.off('response', onResponse); page.off('request', onRequest);
      console.log(lang, route, 'errors', entry.errors.length, 'HTTP failures', entry.failed.length, 'axe', entry.violations.length);
    }
    await context.close();
  }
  fs.writeFileSync(path.resolve(__dirname, `../../docs/browser-${stage}.json`), JSON.stringify(results, null, 2));
  await browser.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
