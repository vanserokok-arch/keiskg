const { test, expect } = require('@playwright/test');
const baseUrl = 'http://localhost:5502/fraud/investment/';

const variants = ['variant-1','variant-2','variant-3'];
const viewports = [
  { name: 'desktop', w: 1440, h: 900 },
  { name: 'tablet', w: 1024, h: 768 },
  { name: 'mobile', w: 375, h: 812 }
];

for (const v of variants) {
  for (const vp of viewports) {
    test(`screenshot - ${v} - ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.w, height: vp.h });
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
      // set body class to pick the sheen variant
      await page.evaluate((cls) => { document.body.classList.remove('keis-sheen--variant-1','keis-sheen--variant-2','keis-sheen--variant-3'); document.body.classList.add(cls); }, `keis-sheen--${v}`);
      // wait for hero form to be present
      await page.waitForSelector('.hero-form', { timeout: 5000 });
      const el = await page.$('.hero-form');
      const out = `test-results/screenshots/${v}-${vp.name}.png`;
      await el.screenshot({ path: out, fullPage: false });
    });
  }
}
