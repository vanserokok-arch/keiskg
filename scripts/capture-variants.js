const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const baseUrl = 'http://localhost:5502/fraud/investment/';
  const variants = ['variant-1','variant-2','variant-3','variant-4','variant-5'];
  const viewports = [
    { name: 'desktop', w: 1440, h: 900 },
    { name: 'tablet', w: 1024, h: 768 },
    { name: 'mobile', w: 375, h: 812 }
  ];

  const outDir = path.resolve(__dirname, '..', 'test-results', 'screenshots');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  for (const v of variants) {
    for (const vp of viewports) {
      try {
        await page.setViewportSize({ width: vp.w, height: vp.h });
        const res = await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        if (!res || !res.ok()) console.warn('Warning: response not ok for', baseUrl, res && res.status());
        // add body class for variant
        await page.evaluate((cls) => {
          document.body.classList.remove('keis-sheen--variant-1','keis-sheen--variant-2','keis-sheen--variant-3');
          document.body.classList.add(cls);
        }, `keis-sheen--${v}`);
        // wait for hero form
        await page.waitForSelector('.hero-form', { timeout: 7000 });
        const el = await page.$('.hero-form');
        if (!el) {
          console.error('hero-form element not found for', v, vp.name);
          continue;
        }
        const out = path.join(outDir, `${v}-${vp.name}.png`);
        await el.screenshot({ path: out });
        console.log('Saved', out);
      } catch (err) {
        console.error('Error capturing', v, vp.name, err.message);
      }
    }
  }

  await browser.close();
  process.exit(0);
})();
