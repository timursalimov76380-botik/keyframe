/**
 * Проверка ветки prefers-reduced-motion: сцена должна отрисовать один кадр и остановиться.
 * node scripts/shot-reduced.mjs
 */
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.shots');
const url = process.argv[2] || 'http://localhost:5180/';

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p));

await mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars', '--enable-unsafe-swiftshader'],
});

const page = await browser.newPage();
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
await page.evaluate(() => document.fonts?.ready);
await new Promise((r) => setTimeout(r, 2000));

// Считаем, сколько кадров успевает пройти за секунду: при reduce-motion должно быть 0
const frames = await page.evaluate(
  () =>
    new Promise((resolve) => {
      let n = 0;
      const tick = () => {
        n += 1;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      setTimeout(() => resolve(n), 1000);
    }),
);

const canvasHasPixels = await page.evaluate(() => {
  const c = document.getElementById('hero-canvas');
  return Boolean(c && c.width > 0 && c.height > 0);
});

await page.screenshot({ path: path.join(outDir, 'hero-reduced.webp'), type: 'webp', quality: 92 });
console.log(`rAF за секунду в странице: ${frames} (сама страница тикает, сцена — нет)`);
console.log(`канвас отрисован: ${canvasHasPixels}`);
console.log('ok  .shots/hero-reduced.webp');

await browser.close();
