/**
 * Ловит «пустой кадр» на scroll-reveal: резко прокручивает к секции и замеряет,
 * сколько времени блоки остаются прозрачными, уже находясь во вьюпорте.
 * node scripts/diag-reveal.mjs [селектор] [url]
 */
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.shots');
const selector = process.argv[2] || '#work';
const url = process.argv[3] || 'http://localhost:5190/';

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p));

await mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars', '--force-color-profile=srgb', '--enable-unsafe-swiftshader'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.evaluate(() => document.fonts?.ready);
await new Promise((r) => setTimeout(r, 1200));

const samples = await page.evaluate(async (sel) => {
  const section = document.querySelector(sel);
  const items = [...section.querySelectorAll('[data-reveal]')];

  // Резкий прыжок к секции — так же ведёт себя быстрый скролл колесом
  const top = section.getBoundingClientRect().top + window.scrollY;
  window.scrollTo(0, top - 80);

  const started = performance.now();
  const log = [];

  await new Promise((resolve) => {
    const tick = () => {
      const t = performance.now() - started;
      let inView = 0;
      let faint = 0;
      let min = 1;

      for (const el of items) {
        const r = el.getBoundingClientRect();
        const visible = r.bottom > 0 && r.top < window.innerHeight;
        if (!visible) continue;
        inView += 1;
        const o = Number(getComputedStyle(el).opacity);
        if (o < 0.5) faint += 1;
        if (o < min) min = o;
      }

      log.push({ t: Math.round(t), inView, faint, min: Number(min.toFixed(2)) });
      if (t < 2000) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });

  return log;
}, selector);

// Прореживаем до каждых ~50 мс, чтобы вывод читался
const step = samples.filter((s, i) => i === 0 || s.t - samples[samples.findIndex((x) => x.t >= s.t - 50)].t >= 0).filter((_, i) => i % 3 === 0);

console.log(`\n${selector} — после резкой прокрутки к секции\n`);
console.log('   мс   в кадре   почти невидимых   min opacity');
for (const s of step.slice(0, 26)) {
  const bar = '█'.repeat(s.faint);
  console.log(
    `${String(s.t).padStart(5)}   ${String(s.inView).padStart(7)}   ${String(s.faint).padStart(15)}   ${String(s.min).padStart(11)}  ${bar}`,
  );
}

const bad = samples.filter((s) => s.inView > 0 && s.faint === s.inView);
if (bad.length) {
  const from = bad[0].t;
  const to = bad[bad.length - 1].t;
  console.log(`\nВСЕ блоки в кадре были почти невидимы с ${from} по ${to} мс — окно ${to - from} мс`);
} else {
  console.log('\nМомента, где все блоки в кадре невидимы, не поймано');
}

// Скриншоты в самые опасные моменты
for (const ms of [120, 260, 420, 700]) {
  await page.evaluate(
    (sel, delay) =>
      new Promise((resolve) => {
        const section = document.querySelector(sel);
        window.scrollTo(0, 0);
        setTimeout(() => {
          const top = section.getBoundingClientRect().top + window.scrollY;
          window.scrollTo(0, top - 80);
          setTimeout(resolve, delay);
        }, 900);
      }),
    selector,
    ms,
  );
  await page.screenshot({ path: path.join(outDir, `reveal-${ms}ms.webp`), type: 'webp', quality: 90 });
  console.log(`ok  .shots/reveal-${ms}ms.webp`);
  // Сбрасываем состояние: перезагружаем, иначе блоки уже проявлены
  await page.reload({ waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 900));
}

await browser.close();
