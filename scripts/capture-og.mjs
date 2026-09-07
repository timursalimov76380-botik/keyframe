/**
 * Снимает баннер для og:image/twitter:image — экран хиро в стандартном
 * соцсетевом размере 1200×630, чтобы ссылки на сайт в мессенджерах и
 * соцсетях показывали сам Keyframe, а не первую попавшуюся картинку со
 * страницы (так было до этого скрипта — подставлялось превью Маки-Маки).
 * node scripts/capture-og.mjs [url]
 */
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outFile = path.join(root, 'public', 'og-image.jpg');
const url = process.argv[2] || 'http://localhost:5173/';

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];

const executablePath = CHROME_CANDIDATES.find((p) => p && existsSync(p));
if (!executablePath) {
  console.error('Не нашёл Chrome или Edge — укажи путь вручную в CHROME_CANDIDATES.');
  process.exit(1);
}

await mkdir(path.dirname(outFile), { recursive: true });

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ['--hide-scrollbars', '--force-color-profile=srgb', '--enable-unsafe-swiftshader'],
});

const page = await browser.newPage();
// 1200×630 — стандартный og:image, ширина заведомо выше брейкпоинтов хиро (760/980px),
// поэтому снимается именно десктопная раскладка, а не мобильная колонка
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.evaluate(() => document.fonts?.ready);
// Даём отыграть анимациям появления и 3D-объекту хиро
await new Promise((r) => setTimeout(r, 3500));

await page.screenshot({ path: outFile, type: 'jpeg', quality: 92 });
console.log(`ok  og-image  ->  ${path.relative(root, outFile)}`);

await browser.close();
