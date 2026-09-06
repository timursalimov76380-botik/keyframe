/**
 * Проверяет юридические страницы: ссылки (назад, друг на друга, из футера),
 * видимость плейсхолдеров, отсутствие JS-зависимости, контраст текста.
 * node scripts/check-legal-pages.mjs [base]
 */
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer';

const base = (process.argv[2] || 'http://localhost:5196').replace(/\/$/, '');

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars'] });
let problems = 0;
let checked = 0;

function fail(msg) {
  problems += 1;
  console.log(`✗ ${msg}`);
}

// ── 1. Прямое открытие обеих страниц, без скриптов сайта ──────
for (const path of ['/privacy.html', '/oferta.html']) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  const res = await page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
  checked += 1;
  if (res.status() !== 200) fail(`${path}: статус ${res.status()}, ожидал 200`);

  const info = await page.evaluate(() => ({
    hasScriptTag: document.querySelectorAll('script').length,
    title: document.title,
    h1: document.querySelector('h1')?.textContent.trim(),
    backHref: document.querySelector('.legal-back')?.getAttribute('href'),
    fillCount: document.querySelectorAll('.fill').length,
    fillVisible: [...document.querySelectorAll('.fill')].every((el) => {
      const cs = getComputedStyle(el);
      return cs.display !== 'none' && parseFloat(cs.opacity) > 0.5;
    }),
    // Реальные данные вписаны без скобок — если где-то осталась голая "[" или "]"
    // вне .fill, это след недоделанной замены плейсхолдера (баг, который уже был)
    strayBrackets: (() => {
      const clone = document.querySelector('.legal__body').cloneNode(true);
      clone.querySelectorAll('.fill').forEach((el) => el.remove());
      return /[[\]]/.test(clone.textContent);
    })(),
  }));

  // privacy.html вправе иметь ровно 1 незаполненный плейсхолдер (номер в реестре —
  // появится позже), oferta.html теперь полностью заполнена и должна дать 0
  const expectedFill = path === '/privacy.html' ? 1 : 0;

  checked += 1;
  if (info.hasScriptTag !== 0) fail(`${path}: найдены <script> теги (${info.hasScriptTag}) — страница должна быть без JS`);
  if (!info.title) fail(`${path}: пустой <title>`);
  if (!info.h1) fail(`${path}: нет <h1>`);
  if (info.backHref !== '/index.html') fail(`${path}: ссылка «На главную» ведёт на «${info.backHref}», ожидал /index.html`);
  if (info.fillCount !== expectedFill) fail(`${path}: плейсхолдеров .fill ${info.fillCount}, ожидал ${expectedFill}`);
  if (info.strayBrackets) fail(`${path}: в тексте вне .fill остались символы «[» или «]» — след недозаполненного плейсхолдера`);
  if (!info.fillVisible) fail(`${path}: плейсхолдер визуально не выделен (opacity/display)`);

  console.log(`  ${path}: title="${info.title}", fill×${info.fillCount}, errors=${errors.length}`);
  if (errors.length) fail(`${path}: консоль не чистая — ${errors.join('; ')}`);

  await page.close();
}

// ── 2. Перекрёстная ссылка oferta → privacy ────────────────────
{
  const page = await browser.newPage();
  await page.goto(base + '/oferta.html', { waitUntil: 'domcontentloaded' });
  checked += 1;
  const href = await page.evaluate(() => {
    const links = [...document.querySelectorAll('.legal__body a')];
    const l = links.find((a) => a.textContent.includes('Политик'));
    return l?.getAttribute('href');
  });
  if (href !== '/privacy.html') fail(`oferta.html: ссылка на политику ведёт на «${href}», ожидал /privacy.html`);
  await page.close();
}

// ── 3. Ссылки из футера index.html ──────────────────────────────
{
  const page = await browser.newPage();
  await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts?.ready);

  for (const lang of ['ru', 'en']) {
    await page.click(`.lang__btn[data-lang="${lang}"]`);
    await new Promise((r) => setTimeout(r, 200));
    checked += 1;
    const legal = await page.evaluate(() => {
      const links = [...document.querySelectorAll('.footer__legal a')];
      return links.map((a) => ({ href: a.getAttribute('href'), text: a.textContent.trim() }));
    });
    if (legal.length !== 2) {
      fail(`index.html/${lang}: в футере ${legal.length} юридических ссылок, ожидал 2`);
    } else {
      // Порядок: сначала оферта, потом политика (так попросил Тимур)
      if (legal[0].href !== '/oferta.html') fail(`index.html/${lang}: первая ссылка «${legal[0].href}», ожидал /oferta.html`);
      if (legal[1].href !== '/privacy.html') fail(`index.html/${lang}: вторая ссылка «${legal[1].href}», ожидал /privacy.html`);
      if (!legal[0].text || !legal[1].text) fail(`index.html/${lang}: пустой текст ссылки`);
    }
    console.log(`  index.html/${lang}: ${JSON.stringify(legal)}`);

    // Три строки (оферта / политика / © год) должны начинаться из одной точки
    checked += 1;
    const lefts = await page.evaluate(() =>
      [...document.querySelectorAll('.footer__legal > *')].map((el) =>
        Math.round(el.getBoundingClientRect().left),
      ),
    );
    const spread = Math.max(...lefts) - Math.min(...lefts);
    if (spread > 1) fail(`index.html/${lang}: левые края .footer__legal расходятся на ${spread}px — ${lefts}`);
  }
  await page.close();
}

// ── 4. Контраст на юридических страницах ────────────────────────
for (const path of ['/privacy.html', '/oferta.html']) {
  const page = await browser.newPage();
  await page.goto(base + path, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts?.ready);
  checked += 1;

  const results = await page.evaluate(() => {
    function toLin(c) {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    }
    function lum([r, g, b]) {
      return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
    }
    function parse(s) {
      const m = s.match(/[\d.]+/g);
      return m ? m.slice(0, 3).map(Number) : null;
    }
    function ratio(a, b) {
      const L1 = lum(a) + 0.05;
      const L2 = lum(b) + 0.05;
      return L1 > L2 ? L1 / L2 : L2 / L1;
    }
    // Как в audit.mjs: фоны с alpha ≤ 0.5 не считаются реальной подложкой
    // (иначе teal-текст на полупрозрачном teal-фоне .fill даёт ложный provал —
    // сравнивались бы два оттенка одного и того же цвета), поднимаемся выше,
    // пока не найдём достаточно непрозрачный фон; иначе — известный фон body.
    function bgOf(el) {
      let node = el;
      while (node) {
        const cs = getComputedStyle(node);
        const parts = (cs.backgroundColor.match(/[\d.]+/g) || []).map(Number);
        if (parts.length >= 3 && (parts[3] === undefined || parts[3] > 0.5)) return parts.slice(0, 3);
        node = node.parentElement;
      }
      return [5, 14, 13];
    }

    const bad = [];
    for (const el of document.querySelectorAll('p, li, h1, h2, a, .fill, .legal-back, .legal__updated')) {
      const cs = getComputedStyle(el);
      const fg = parse(cs.color);
      const bg = bgOf(el);
      if (!fg || !bg) continue;
      const size = parseFloat(cs.fontSize);
      const bold = parseInt(cs.fontWeight, 10) >= 700;
      const large = size >= 24 || (size >= 18.66 && bold);
      const min = large ? 3 : 4.5;
      const r = ratio(fg, bg);
      if (r < min && el.textContent.trim()) {
        bad.push({ tag: el.tagName.toLowerCase(), cls: el.className, ratio: r.toFixed(2), text: el.textContent.trim().slice(0, 30) });
      }
    }
    return bad;
  });

  if (results.length) {
    for (const r of results) fail(`${path}: контраст ${r.ratio} у <${r.tag} class="${r.cls}"> "${r.text}"`);
  } else {
    console.log(`  ${path}: контраст без нарушений`);
  }

  await page.close();
}

console.log(`\nПроверено: ${checked}. Проблем: ${problems}.`);
await browser.close();
process.exit(problems > 0 ? 1 : 0);
