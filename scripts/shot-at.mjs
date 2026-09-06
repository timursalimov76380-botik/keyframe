/**
 * Скроллит к элементу и снимает экран целиком — в отличие от съёмки самого элемента,
 * сюда попадает окружение и стык секций.
 * node scripts/shot-at.mjs ".marquee" seam [сдвиг] [ширина] [url]
 */
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.shots');
const selector = process.argv[2] || '.marquee';
const name = process.argv[3] || 'at';
const offset = Number(process.argv[4] || 300);
const width = Number(process.argv[5] || 1440);
const url = process.argv[6] || 'http://localhost:5190/';

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
await page.setViewport({ width, height: 800, deviceScaleFactor: 1.5 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
await page.evaluate(() => document.fonts?.ready);

await page.evaluate(async (sel, off) => {
  const step = window.innerHeight * 0.7;
  const target = document.querySelector(sel);
  const stop = target.getBoundingClientRect().top + window.scrollY;
  for (let y = 0; y < stop; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 180));
  }
  window.scrollTo(0, Math.max(0, stop - off));
}, selector, offset);
await new Promise((r) => setTimeout(r, 800));

await page.screenshot({ path: path.join(outDir, `${name}.webp`), type: 'webp', quality: 92 });
console.log(`ok  .shots/${name}.webp`);

await browser.close();
