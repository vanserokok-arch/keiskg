const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 600, height: 950 } });
  await page.goto('http://127.0.0.1:8088/consumer-protection/consumer-goods-refund/', { waitUntil: 'domcontentloaded' });
  const info = await page.evaluate(() => {
    const el = document.querySelector('.kg-stripe-ticker');
    const track = el ? el.querySelector('.kg-stripe-track') : null;
    const cs = el ? getComputedStyle(el) : null;
    const rect = el ? el.getBoundingClientRect() : null;
    const trackRect = track ? track.getBoundingClientRect() : null;
    const trackCS = track ? getComputedStyle(track) : null;

    let rules = [];
    let sheetMeta = [];
    try {
      const sheets = Array.from(document.styleSheets || []);
      sheetMeta = sheets.map((sheet) => {
        try { return { href: sheet.href, count: (sheet.cssRules || []).length, ok: true }; }
        catch (err) { return { href: sheet.href, count: 0, ok: false, err: String(err) }; }
      });

      const collect = (rules) => {
        const out = [];
        (rules || []).forEach((rule) => {
          out.push(rule);
          if (rule.cssRules && rule.cssRules.length) {
            out.push(...collect(Array.from(rule.cssRules)));
          }
        });
        return out;
      };

      const allRules = sheets.flatMap((sheet) => {
        try { return collect(Array.from(sheet.cssRules || [])); } catch (err) { return []; }
      });

      sheetMeta = sheetMeta.map((meta, idx) => {
        if (!meta.ok) return meta;
        const rules = (() => { try { return Array.from(sheets[idx].cssRules || []); } catch (err) { return []; } })();
        return { ...meta, lastRule: rules.length ? rules[rules.length - 1].cssText.slice(0, 160) : null };
      });

      rules = allRules
        .filter((r) => {
          const text = r.cssText || '';
          const sel = r.selectorText || '';
          return text.includes('kg-stripe') || sel.includes('kg-stripe') || sel.includes('ticker');
        })
        .map((r) => ({ selector: r.selectorText || null, text: (r.cssText || '').slice(0, 160) }));
    } catch (e) {
      rules = ['unreadable'];
    }

    return {
      className: el ? el.className : null,
      parent: el && el.parentElement ? el.parentElement.tagName + '.' + Array.from(el.parentElement.classList || []).join('.') : null,
      isChildOfFirstSection: el ? el.parentElement && el.parentElement.matches('body > section:first-of-type') : null,
      sheets: sheetMeta,
      styles: rules,
      height: cs ? cs.height : null,
      rectHeight: rect ? rect.height : null,
      position: cs ? cs.position : null,
      display: cs ? cs.display : null,
      padding: cs ? `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}` : null,
      trackHeight: trackRect ? trackRect.height : null,
      trackLineHeight: trackCS ? trackCS.lineHeight : null,
      trackDisplay: trackCS ? trackCS.display : null,
      trackOverflowX: trackCS ? trackCS.overflowX : null,
      trackWhiteSpace: trackCS ? trackCS.whiteSpace : null,
      trackFlexWrap: trackCS ? trackCS.flexWrap : null,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
