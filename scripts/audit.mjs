/**
 * Быстрая проверка доступности: контраст текста, порядок табуляции, состояния ARIA.
 * node scripts/audit.mjs [url]
 */
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer';

const url = process.argv[2] || 'http://localhost:5190/';

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
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
await page.evaluate(() => document.fonts?.ready);
await new Promise((r) => setTimeout(r, 1200));

const contrast = await page.evaluate(() => {
  const toLin = (c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const lum = ([r, g, b]) => 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
  const parse = (s) => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);

  // Ищем фактический фон: поднимаемся вверх, пока фон прозрачный.
  // Градиент отдаётся в background-image и не виден в backgroundColor —
  // берём из него первый цветовой стоп, иначе светлая секция ложно проваливает проверку.
  function bgOf(el) {
    let node = el;
    while (node) {
      const cs = getComputedStyle(node);
      const parts = (cs.backgroundColor.match(/[\d.]+/g) || []).map(Number);
      if (parts.length >= 3 && (parts[3] === undefined || parts[3] > 0.5)) return parts.slice(0, 3);

      if (cs.backgroundImage && cs.backgroundImage.includes('gradient')) {
        const stop = cs.backgroundImage.match(/rgba?\(([\d.,\s]+)\)/);
        if (stop) {
          const c = stop[1].split(',').map(Number);
          if (c.length >= 3 && (c[3] === undefined || c[3] > 0.5)) return c.slice(0, 3);
        }
      }
      node = node.parentElement;
    }
    return [5, 14, 13];
  }

  const results = [];
  const seen = new Set();
  for (const el of document.querySelectorAll('p, span, li, a, small, h1, h2, h3, legend, output')) {
    if (!el.textContent.trim() || el.children.length) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    // .sr-only спрятан clip-path, а слово KEYFRAME залито градиентом через
    // background-clip: text — у обоих собственный color к делу не относится
    if (cs.clipPath !== 'none' || cs.webkitTextFillColor === 'rgba(0, 0, 0, 0)') continue;
    if (cs.color === 'rgba(0, 0, 0, 0)') continue;
    const size = parseFloat(cs.fontSize);
    const weight = Number(cs.fontWeight) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const need = large ? 3 : 4.5;

    const fg = parse(cs.color);
    const bg = bgOf(el);
    const l1 = lum(fg);
    const l2 = lum(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    const key = `${cs.color}|${bg.join(',')}|${Math.round(size)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (ratio < need) {
      results.push({
        text: el.textContent.trim().slice(0, 42),
        color: cs.color,
        size: Math.round(size),
        ratio: Number(ratio.toFixed(2)),
        need,
      });
    }
  }
  return results;
});

console.log(`\n=== Контраст: ${contrast.length ? 'нарушения' : 'нарушений нет'} ===`);
for (const c of contrast) {
  console.log(`  ${c.ratio} (нужно ${c.need}) · ${c.size}px · ${c.color} · "${c.text}"`);
}

// Проходим табом по странице и смотрим, что фокус вообще куда-то попадает
const tabOrder = [];
for (let i = 0; i < 40; i += 1) {
  await page.keyboard.press('Tab');
  const info = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName.toLowerCase(),
      text: (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().slice(0, 34),
      outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0,
    };
  });
  if (info) tabOrder.push(info);
}

console.log('\n=== Табуляция ===');
tabOrder.forEach((el, i) => {
  console.log(`  ${String(i + 1).padStart(2)}. ${el.tag.padEnd(8)} ${el.outline ? 'фокус виден' : 'ФОКУС НЕ ВИДЕН'}  "${el.text}"`);
});

const aria = await page.evaluate(() => ({
  langPressed: [...document.querySelectorAll('.lang__btn')].map((b) => `${b.dataset.lang}=${b.getAttribute('aria-pressed')}`),
  burgerExpanded: document.querySelector('.nav__burger')?.getAttribute('aria-expanded'),
  imgsWithoutAlt: [...document.images].filter((i) => !i.alt).length,
  h1Count: document.querySelectorAll('h1').length,
  htmlLang: document.documentElement.lang,
}));

console.log('\n=== Разметка ===');
console.log(' ', JSON.stringify(aria));

await browser.close();
