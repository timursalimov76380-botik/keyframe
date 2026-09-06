/**
 * Ищет горизонтальное переполнение: на каких ширинах документ шире экрана
 * и какие именно элементы выходят за правую границу.
 * node scripts/diag-nav.mjs [url]
 */
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer';

const url = process.argv[2] || 'http://localhost:5190/';
const WIDTHS = [1440, 1376, 1300, 1200, 1100, 1000, 900, 846, 700, 560, 475, 390, 378, 320];

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars', '--enable-unsafe-swiftshader'],
});

for (const width of WIDTHS) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 800 });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => document.fonts?.ready);
  await new Promise((r) => setTimeout(r, 500));

  const info = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;

    const nav = document.querySelector('.nav__inner');
    const navRect = nav.getBoundingClientRect();
    const kids = [...nav.children].map((el) => {
      const r = el.getBoundingClientRect();
      return { cls: el.className.split(' ')[0], w: Math.round(r.width), right: Math.round(r.right) };
    });

    // Кто вылезает правее вьюпорта
    const offenders = [];
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      if (r.right > vw + 1) {
        offenders.push({
          cls: (el.className && String(el.className).split(' ')[0]) || el.tagName.toLowerCase(),
          right: Math.round(r.right),
          over: Math.round(r.right - vw),
        });
      }
    }
    offenders.sort((a, b) => b.over - a.over);

    return {
      vw,
      docScroll: document.documentElement.scrollWidth,
      navInner: { w: Math.round(navRect.width), right: Math.round(navRect.right) },
      kids,
      offenders: offenders.slice(0, 4),
    };
  });

  const flag = info.docScroll > info.vw ? ' ← документ шире экрана' : '';
  console.log(
    `\n${String(width).padStart(4)}px  scrollWidth ${info.docScroll}${flag}\n` +
      `      nav__inner ширина ${info.navInner.w}, правый край ${info.navInner.right}\n` +
      `      дети: ${info.kids.map((k) => `${k.cls} ${k.w}px→${k.right}`).join(' | ')}`,
  );
  if (info.offenders.length) {
    console.log(
      `      за границей: ${info.offenders.map((o) => `${o.cls} +${o.over}px`).join(', ')}`,
    );
  }

  await page.close();
}

await browser.close();
