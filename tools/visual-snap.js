const { chromium } = require('playwright');
(async()=>{
  const browser = await chromium.launch();
  const widths=[375,768,1024,1200];
  for(const w of widths){
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    await page.goto('http://127.0.0.1:8088/consumer-protection/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.keis-header');
    const path = `/tmp/kg-snap-${w}.png`;
    await page.screenshot({ path, fullPage: false });
    console.log('SHOT', w, path);
    await page.close();
  }
  await browser.close();
  console.log('SNAPS_OK');
})().catch(e=>{ console.error(e); process.exit(1);});
