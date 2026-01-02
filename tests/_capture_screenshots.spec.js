const { test } = require('@playwright/test');

const URL = 'http://127.0.0.1:5502/fraud/index.html';

test('capture screenshots at multiple viewports', async ({ page }) => {
  // Desktop
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'test-results/scenarios-1440.png', fullPage: true });

  // Tablet
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'test-results/scenarios-1024.png', fullPage: true });

  // Mobile
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'test-results/scenarios-375.png', fullPage: true });
});
