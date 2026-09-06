/**
 * Считает вертикальные зазоры между содержимым соседних блоков —
 * не отступы из CSS, а то, сколько реально пустоты видит человек.
 * node scripts/measure-gaps.mjs [ширина] [url]
 */
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer';

const width = Number(process.argv[2] || 1440);
const url = process.argv[3] || 'http://localhost:5190/';

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars', '--enable-unsafe-swiftshader'],
});

const page = await browser.newPage();
await page.setViewport({ width, height: 900 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
await page.evaluate(() => document.fonts?.ready);
await page.evaluate(async () => {
  const step = window.innerHeight * 0.7;
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 150));
  }
  window.scrollTo(0, 0);
});
await new Promise((r) => setTimeout(r, 600));

const report = await page.evaluate(() => {
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top + window.scrollY, bottom: r.bottom + window.scrollY };
  };

  // Крайние видимые потомки — чтобы померить пустоту между текстом и текстом,
  // а не между границами секций, которые сами по себе невидимы
  function contentEdges(root) {
    let top = Infinity;
    let bottom = -Infinity;
    for (const el of root.querySelectorAll('*')) {
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || cs.position === 'fixed') continue;
      if (!el.textContent.trim() && el.tagName !== 'IMG' && el.tagName !== 'CANVAS') continue;
      const r = rect(el);
      if (r.bottom - r.top <= 0) continue;
      top = Math.min(top, r.top);
      bottom = Math.max(bottom, r.bottom);
    }
    return { top, bottom };
  }

  const blocks = [...document.querySelectorAll('main > section, main > .marquee, footer')];
  const rows = blocks.map((b) => ({
    name: b.id || b.className.split(' ')[0],
    ...contentEdges(b),
    boxTop: rect(b).top,
    boxBottom: rect(b).bottom,
  }));

  const gaps = [];
  for (let i = 1; i < rows.length; i += 1) {
    gaps.push({
      between: `${rows[i - 1].name} → ${rows[i].name}`,
      gap: Math.round(rows[i].top - rows[i - 1].bottom),
    });
  }

  const heads = [...document.querySelectorAll('.section-head')].map((h) => {
    const next = h.parentElement.querySelector('.work-grid, .cap-grid, .steps');
    return {
      section: h.closest('section')?.id,
      headToContent: next ? Math.round(rect(next).top - rect(h).bottom) : null,
    };
  });

  return { gaps, heads, pageHeight: document.body.scrollHeight };
});

console.log(`\nширина ${width}px, высота страницы ${report.pageHeight}px\n`);
console.log('=== Пустота между блоками (от последнего контента до первого) ===');
for (const g of report.gaps) console.log(`  ${String(g.gap).padStart(5)} px   ${g.between}`);
console.log('\n=== От заголовка секции до её содержимого ===');
for (const h of report.heads) console.log(`  ${String(h.headToContent).padStart(5)} px   ${h.section}`);

await browser.close();
