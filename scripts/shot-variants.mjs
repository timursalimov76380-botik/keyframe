/**
 * Прогоняет песочницу по всем вариантам и снимает стенд крупно.
 * node scripts/shot-variants.mjs [url]
 */
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.shots');
const url = process.argv[2] || 'http://localhost:5180/lab.html';

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
page.on('pageerror', (e) => console.error(`PAGEERROR ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') console.error(`CONSOLE ${m.text()}`);
});

await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
// domcontentloaded, а не networkidle0: страница тяжёлая по вычислениям,
// и строгое ожидание простоя упирается в таймаут
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.evaluate(() => document.fonts?.ready);
await new Promise((r) => setTimeout(r, 4000));

const ids = await page.evaluate(() =>
  [...document.querySelectorAll('.thumb')].map((t) => t.dataset.id),
);

// Слово мешает разглядеть силуэт — на время съёмки убираем
await page.click('#context');

for (const id of ids) {
  await page.click(`.thumb[data-id="${id}"]`);
  await new Promise((r) => setTimeout(r, 1600));
  const stage = await page.$('.stage');
  await stage.screenshot({ path: path.join(outDir, `var-${id}.webp`), type: 'webp', quality: 92 });
  console.log(`ok  var-${id}`);
}

await browser.close();
