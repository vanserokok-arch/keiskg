const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8088';
const OUTPUT_DIR = process.env.OUTPUT_DIR || path.join('tests', 'visual', 'after');
const ROUTES = [
  '/consumer-protection/consumer-goods-refund/',
  '/fraud/investment/'
];

const VIEWPORTS = [
  { label: '360x900', width: 360, height: 900 },
  { label: '390x900', width: 390, height: 900 },
  { label: '428x900', width: 428, height: 900 },
  { label: '768x1024', width: 768, height: 1024 },
  { label: '899x1000', width: 899, height: 1000 },
  { label: '900x1000', width: 900, height: 1000 },
  { label: '980x1000', width: 980, height: 1000 },
  { label: '1024x900', width: 1024, height: 900 },
  { label: '1099x900', width: 1099, height: 900 },
  { label: '1100x900', width: 1100, height: 900 },
  { label: '1280x900', width: 1280, height: 900 },
  { label: '1440x900', width: 1440, height: 900 }
];

const metricsLog = [];

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const slugRoute = (route) => {
  const trimmed = route.replace(/^\/+/, '').replace(/\/+$/, '');
  return trimmed.length ? trimmed.replace(/\//g, '_') : 'home';
};

async function captureSnapshot(page, route, viewport) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.keis-header');
  await page.waitForTimeout(400);

  const metrics = await page.evaluate(() => {
    const header = document.querySelector('.keis-header');
    const hero = document.querySelector('section.hero-investment') || document.querySelector('body > section:first-of-type');
    const ticker = document.querySelector('.kg-stripe-ticker');
    const tickerTrack = ticker ? ticker.querySelector('.kg-stripe-track') : null;
    const tickerLine = tickerTrack ? parseFloat(getComputedStyle(tickerTrack).lineHeight || '0') : 0;
    const tickerTrackH = tickerTrack ? tickerTrack.getBoundingClientRect().height : 0;
    const tickerWrapped = tickerTrack ? tickerTrackH > tickerLine * 1.4 : false;

    const legacyTicker = document.querySelector('.keis-ticker');
    const legacyTrack = legacyTicker ? legacyTicker.querySelector('.keis-ticker__track') : null;
    const legacyLine = legacyTrack ? parseFloat(getComputedStyle(legacyTrack).lineHeight || '0') : 0;
    const legacyTrackH = legacyTrack ? legacyTrack.getBoundingClientRect().height : 0;
    const legacyWrapped = legacyTrack ? legacyTrackH > legacyLine * 1.4 : false;
    const nav = document.querySelector('.keis-header-nav-list');
    const contacts = document.querySelector('.keis-header-contacts');
    const hasWrap = (el) => {
      if (!el) return false;
      return el.scrollHeight - el.clientHeight > 1 || el.scrollWidth - el.clientWidth > 4;
    };

    const rect = (el) => (el ? el.getBoundingClientRect() : null);
    const headerRect = rect(header);
    const heroRect = rect(hero);
    const tickerRect = rect(ticker);

    return {
      headerHeight: headerRect ? Math.round(headerRect.height * 10) / 10 : null,
      headerTop: headerRect ? Math.round(headerRect.top * 10) / 10 : null,
      heroTop: heroRect ? Math.round(heroRect.top * 10) / 10 : null,
      heroPaddingTop: hero ? parseFloat(getComputedStyle(hero).paddingTop) : null,
      tickerTop: tickerRect ? Math.round(tickerRect.top * 10) / 10 : null,
      tickerHeight: tickerRect ? Math.round(tickerRect.height * 10) / 10 : null,
      tickerWrapped,
      legacyTickerWrapped: legacyWrapped,
      overflowX: document.documentElement.scrollWidth - window.innerWidth > 1,
      navWrapped: hasWrap(nav),
      contactsWrapped: hasWrap(contacts),
      viewport: { width: innerWidth, height: innerHeight },
      keisHeaderVar: getComputedStyle(document.documentElement).getPropertyValue('--keis-header-h').trim()
    };
  });

  metrics.route = route;
  metrics.viewportLabel = viewport.label;
  metrics.timestamp = Date.now();
  metricsLog.push(metrics);

  const folder = OUTPUT_DIR;
  ensureDir(folder);
  const shotName = `${slugRoute(route)}-${viewport.label}.png`;
  await page.screenshot({ path: path.join(folder, shotName), fullPage: true });

  return metrics;
}

test.describe('Header/Hero/Ticker visual checks', () => {
  for (const route of ROUTES) {
    for (const viewport of VIEWPORTS) {
      test(`${route} @ ${viewport.label}`, async ({ page }) => {
        const metrics = await captureSnapshot(page, route, viewport);
        expect(metrics.headerHeight).toBeTruthy();
        expect(metrics.navWrapped).toBeFalsy();
        expect(metrics.overflowX).toBeFalsy();
        expect(metrics.tickerWrapped).toBeFalsy();
        expect(metrics.legacyTickerWrapped).toBeFalsy();
      });
    }
  }

  test('header height stable between 900-1200 widths', async ({ page }) => {
    const route = ROUTES[0];
    await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.keis-header');
    const widths = [];
    for (let w = 900; w <= 1200; w += 10) widths.push(w);
    for (let w = 1190; w >= 900; w -= 10) widths.push(w);

    const heights = [];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(120);
      const h = await page.evaluate(() => {
        const header = document.querySelector('.keis-header');
        return header ? Math.round(header.getBoundingClientRect().height * 10) / 10 : null;
      });
      heights.push(h);
    }

    const baseline = heights[0];
    for (const h of heights) {
      expect(Math.abs(h - baseline)).toBeLessThanOrEqual(1);
    }
  });
});

test.afterAll(() => {
  const outDir = OUTPUT_DIR;
  ensureDir(outDir);
  const outPath = path.join(outDir, 'metrics.json');
  fs.writeFileSync(outPath, JSON.stringify(metricsLog, null, 2));
  console.log('VISUAL_METRICS', JSON.stringify(metricsLog, null, 2));
});
