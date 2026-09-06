/**
 * Переключает язык и снимает ключевые секции — проверка английской версии.
 * node scripts/shot-lang.mjs [en|ru] [url]
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.shots');
const lang = process.argv[2] || 'en';
const url = process.argv[3] || 'http://localhost:5180/';

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
const logs = [];
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') logs.push(m.text());
});
page.on('pageerror', (e) => logs.push(`PAGEERROR ${e.message}`));

await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
await page.evaluate(() => document.fonts?.ready);

await page.click(`.lang__btn[data-lang="${lang}"]`);
await new Promise((r) => setTimeout(r, 700));

const htmlLang = await page.evaluate(() => document.documentElement.lang);
const title = await page.title();
console.log(`html lang: ${htmlLang}`);
console.log(`title: ${title}`);

await page.screenshot({ path: path.join(outDir, `${lang}-hero.webp`), type: 'webp', quality: 92 });

await page.evaluate(async () => {
  const step = window.innerHeight * 0.7;
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 200));
  }
});
await new Promise((r) => setTimeout(r, 700));

const caps = await page.$('#capabilities');
await caps.screenshot({ path: path.join(outDir, `${lang}-caps.webp`), type: 'webp', quality: 92 });

// Проверяем, что переключение языка пересобрало и калькулятор тоже
const calc = await page.evaluate(() => ({
  price: document.getElementById('calc-price').textContent,
  term: document.getElementById('calc-term').textContent,
  first: document.querySelector('#calc-includes li')?.textContent,
}));
console.log('калькулятор:', JSON.stringify(calc));

// Подпись в подвале должна стоять по центру страницы, а не по центру остатка строки
const footer = await page.evaluate(() => {
  const note = document.querySelector('.footer__note');
  const r = note.getBoundingClientRect();
  return {
    text: note.textContent.trim().slice(0, 40),
    offsetFromCenter: Math.round(r.left + r.width / 2 - window.innerWidth / 2),
  };
});
console.log(`подвал: смещение от центра ${footer.offsetFromCenter}px · "${footer.text}…"`);

if (logs.length) {
  await writeFile(path.join(outDir, `${lang}-console.log`), logs.join('\n'), 'utf8');
  console.log('\n--- console ---\n' + logs.join('\n'));
} else {
  console.log('консоль чистая');
}

await browser.close();
