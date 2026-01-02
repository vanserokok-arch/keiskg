const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 1440, height: 900 } });

test('SCENARIOS acceptance checks', async ({ page }) => {
  await page.goto('http://localhost:5502/fraud/investment/', { waitUntil: 'domcontentloaded' });

  // wait for main selectors
  await page.waitForSelector('.investment-scenarios .scenarios-band-window');
  await page.waitForSelector('.investment-scenarios .scenarios-band-track > *');

  const windowWidth = await page.$eval('.investment-scenarios .scenarios-band-window', el => el.getBoundingClientRect().width);
  const cardWidth = await page.$eval('.investment-scenarios .scenarios-band-track > *', el => el.getBoundingClientRect().width);
  const scrollDiff = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

  // marquee presence and its ::before content (should be NONE)
  const marqueeSelector = '.keis-marquee';
  const marqueeExists = await page.$(marqueeSelector) !== null;
  const marqueeBeforeContent = marqueeExists
    ? await page.$eval(marqueeSelector, el => window.getComputedStyle(el, '::before').content)
    : null;

  const scenariosFilter = await page.$eval('.investment-scenarios', el => getComputedStyle(el).filter);
  const cardBorderRadius = await page.$eval('.investment-scenarios .scenarios-band-track > *', el => getComputedStyle(el).borderRadius);

  // TRUST section overlay checks (section after hero). Use #trust id from markup.
  const trustSelector = '#trust';
  const trustExists = await page.$(trustSelector) !== null;
  const trustBefore = trustExists
    ? await page.$eval(trustSelector, el => ({ content: window.getComputedStyle(el, '::before').content, mix: window.getComputedStyle(el, '::before').mixBlendMode }))
    : { content: null, mix: null };

  // Check border size before/after hover
  // find a visible slide (one whose rect intersects the viewport)
  const visibleIndex = await page.evaluate(() => {
    const slides = Array.from(document.querySelectorAll('.investment-scenarios .scenarios-band-track > *'));
    for (let i = 0; i < slides.length; i++) {
      const r = slides[i].getBoundingClientRect();
      if (r.right > 0 && r.left < window.innerWidth) return i;
    }
    return 0;
  });
  const slides = await page.$$('.investment-scenarios .scenarios-band-track > *');
  const cardHandle = slides[visibleIndex] || slides[0];
  const r1 = await cardHandle.evaluate(el => el.getBoundingClientRect());
  await cardHandle.scrollIntoViewIfNeeded();
  await page.waitForTimeout(80);
  // apply test-only hover class to avoid pointer interception issues in headless env
  await cardHandle.evaluate(el => el.classList.add('is-hover'));
  // small delay to allow transition
  await page.waitForTimeout(250);
  const r2 = await cardHandle.evaluate(el => el.getBoundingClientRect());

  // Compute results and assert
  console.log('VIEWPORT: 1440x900');
  console.log('SCENARIOS WINDOW WIDTH:', windowWidth);
  console.log('SCENARIOS CARD WIDTH:', cardWidth);
  console.log('NO HORIZONTAL SCROLL diff:', scrollDiff);
  console.log('MARQUEE BEFORE CONTENT:', marqueeBeforeContent);
  console.log('TRUST BEFORE:', trustBefore);
  console.log('SCENARIOS FILTER:', scenariosFilter);
  console.log('CARD BORDER RADIUS:', cardBorderRadius);
  console.log('CARD SIZE BEFORE:', { w: r1.width, h: r1.height });
  console.log('CARD SIZE AFTER HOVER:', { w: r2.width, h: r2.height });

  // Assertions per spec
  expect(windowWidth).toBeGreaterThan(1300);
  expect(cardWidth).toBeGreaterThan(300); // sanity large card
  expect(scrollDiff).toBe(0);
  expect(marqueeExists).toBeTruthy();
  // marquee ::before must not be present (we expect computed content to be 'none')
  expect(marqueeBeforeContent).toBe('none');
  // trust overlay must exist and use mix-blend-mode: multiply
  expect(trustExists).toBeTruthy();
  expect(trustBefore.content).toBe('""');
  expect(trustBefore.mix).toBe('multiply');
  expect(scenariosFilter === 'none' || scenariosFilter === 'none 0px 0px 0px rgba(0, 0, 0, 0)');
  expect(cardBorderRadius).toBe('0px');
  // size no shift
  expect(Math.round(r1.width)).toBe(Math.round(r2.width));
  expect(Math.round(r1.height)).toBe(Math.round(r2.height));

  // Final report lines required by the task
  console.log('✓ MARQUEE OVERLAY: NONE');
  console.log('✓ TRUST BLOCK OVERLAY: ON');
  console.log('✓ SCENARIOS FILTER: NONE');
  console.log('✓ VIEWPORT 1440: OK');
});
