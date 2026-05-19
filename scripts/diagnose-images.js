const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function tryPlaywrightScrape(url) {
  try {
    const { chromium } = require('playwright');
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const context = await browser.newContext({ viewport: { width: 1200, height: 800 } });
    const page = await context.newPage();

    const networkImageUrls = new Set();
    page.on('response', resp => {
      try {
        const r = resp.url();
        if (/\.(jpe?g|png|webp|avif)(\?|$)/i.test(r)) networkImageUrls.add(r);
      } catch {}
    });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(e => {});
    await page.waitForTimeout(2000);

    const stateImages = await page.evaluate(() => {
      const pattern = /https?:\/\/[\S]+?\.(?:jpe?g|png|webp|avif)/gi;
      const imgs = new Set();
      try {
        for (const key of ['__NEXT_DATA__','__GATSBY_INITIAL_DATA__','__INITIAL_STATE__','__PRELOADED_STATE__']) {
          const s = window[key];
          if (!s) continue;
          const matches = JSON.stringify(s).match(pattern) || [];
          for (const m of matches) imgs.add(m);
        }
      } catch {}
      document.querySelectorAll('script:not([src])').forEach(s => {
        const c = s.textContent || '';
        const m = (c.match(pattern) || []);
        for (const u of m) imgs.add(u);
      });
      return [...imgs];
    });

    // Try clicking common gallery buttons
    const selectors = [
      'button[data-id="listing-btn-allImages"]',
      '[data-testid="Carousel-button"]',
      'button:has-text("Ver todas las imágenes")',
      'button:has-text("Ver fotos")',
      'button[aria-label*="imagen" i]',
      'button[title*="imagen" i]'
    ];

    for (const sel of selectors) {
      try {
        const el = await page.$(sel);
        if (el) { await el.click().catch(()=>{}); await page.waitForTimeout(800); }
      } catch {}
    }

    // Scroll to help lazy load
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 300) { window.scrollTo(0,y); await new Promise(r => setTimeout(r, 120)); }
    }).catch(()=>{});
    await page.waitForTimeout(1200);

    const domImages = await page.evaluate(() => {
      const set = new Set();
      document.querySelectorAll('img').forEach(img => {
        for (const a of ['src','data-src','data-lazy-src','data-main-image','data-original']) {
          const v = img.getAttribute(a);
          if (v && /^https?:\/\//i.test(v)) set.add(v);
        }
        const s = img.getAttribute('srcset') || '';
        s.split(',').forEach(part => { const u = part.trim().split(' ')[0]; if (u && /^https?:\/\//i.test(u)) set.add(u); });
      });
      return [...set];
    });

    await page.close();
    await context.close();
    await browser.close();

    return { stateImages, domImages, network: [...networkImageUrls] };
  } catch (err) {
    return { error: err.message };
  }
}

async function staticScrape(url) {
  try {
    const { data } = await axios.get(url, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(data);
    const imgs = new Set();
    $('img').each((_,el) => {
      const attribs = ['src','data-src','data-lazy-src','data-main-image','data-original','srcset'];
      for (const a of attribs) {
        const v = $(el).attr(a);
        if (!v) continue;
        if (a === 'srcset') {
          const first = v.split(',')[0]?.trim().split(' ')[0]; if (first) imgs.add(first);
        } else {
          if (/^https?:\/\//i.test(v)) imgs.add(v);
        }
      }
    });
    // search inline scripts
    const scriptText = $('script:not([src])').text();
    const reg = /https?:\/\/[\S]+?\.(?:jpe?g|png|webp|avif)/gi;
    for (const m of scriptText.match(reg) || []) imgs.add(m);
    return { static: [...imgs] };
  } catch (err) {
    return { error: err.message };
  }
}

async function main() {
  const url = process.argv[2];
  if (!url) { console.error('Uso: node scripts/diagnose-images.js <url>'); process.exit(1); }
  console.log('Diagnóstico para:', url);

  const pw = await tryPlaywrightScrape(url);
  console.log('\nPlaywright results:');
  console.log(JSON.stringify(pw, null, 2));

  const st = await staticScrape(url);
  console.log('\nStatic scrape results:');
  console.log(JSON.stringify(st, null, 2));
}

main();
