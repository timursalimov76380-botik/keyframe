/**
 * Снимает текущую сборку в нескольких размерах — рабочая обратная связь при вёрстке.
 * node scripts/shot-dev.mjs [url] [префикс]
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.shots');
const url = process.argv[2] || 'http://localhost:5180/';
const prefix = process.argv[3] || 'page';

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p));

const SIZES = [
  { name: 'desktop', width: 1440, height: 900, dpr: 1.5 },
  { name: 'tablet', width: 834, height: 1000, dpr: 1.5 },
  { name: 'mobile', width: 390, height: 844, dpr: 2 },
];

await mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars', '--force-color-profile=srgb', '--enable-unsafe-swiftshader'],
});

const logs = [];

for (const size of SIZES) {
  const page = await browser.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${size.name}] ${m.text()}`);
  });
  page.on('pageerror', (e) => logs.push(`[${size.name}] PAGEERROR ${e.message}`));

  await page.setViewport({ width: size.width, height: size.height, deviceScaleFactor: size.dpr });
  // domcontentloaded, а не networkidle0: тяжёлые по вычислениям страницы
  // (песочница с marching cubes) в строгое ожидание простоя не укладываются
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(() => document.fonts?.ready);
  await new Promise((r) => setTimeout(r, 1800));

  // Первый экран — до прокрутки, ровно как его увидит человек, открывший ссылку
  await page.screenshot({ path: path.join(outDir, `${prefix}-${size.name}-hero.webp`), type: 'webp', quality: 92 });

  // Прокручиваем всю страницу, чтобы отработали scroll-reveal, и только потом снимаем целиком
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.7;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 220));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 500));
  });

  await page.screenshot({ path: path.join(outDir, `${prefix}-${size.name}-full.webp`), type: 'webp', quality: 88, fullPage: true });
  console.log(`ok  ${size.name}`);
  await page.close();
}

await browser.close();

if (logs.length) {
  await writeFile(path.join(outDir, `${prefix}-console.log`), logs.join('\n'), 'utf8');
  console.log('\n--- console ---\n' + logs.join('\n'));
} else {
  console.log('\nконсоль чистая');
}
