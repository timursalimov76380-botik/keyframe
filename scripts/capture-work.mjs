/**
 * Снимает превью готовых работ для секции Featured work.
 * Служебный скрипт — в сборку сайта не попадает, запускается вручную: npm run shots
 * Использует уже установленный в системе Chrome, чтобы не тянуть отдельный бинарник.
 */
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'work');

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];

const SITES = [
  { slug: 'dark-glass', url: 'https://dark-glass.netlify.app' },
  { slug: 'boss-volos', url: 'https://yulia-barber.netlify.app' },
  { slug: 'maki-maki', url: 'https://cerulean-hotteok-b17006.netlify.app' },
  { slug: 'nagaichenko', url: 'https://webinar.nagaichenkopsy.com' },
];

const VIEWPORT = { width: 1440, height: 900, deviceScaleFactor: 1.5 };
const SETTLE_MS = 4000;

const executablePath = CHROME_CANDIDATES.find((p) => p && existsSync(p));
if (!executablePath) {
  console.error('Не нашёл Chrome или Edge — укажи путь вручную в CHROME_CANDIDATES.');
  process.exit(1);
}

await mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ['--hide-scrollbars', '--force-color-profile=srgb'],
});

for (const { slug, url } of SITES) {
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.evaluate(() => document.fonts?.ready);
    // Даём отыграть анимациям появления, чтобы в кадр не попало промежуточное состояние
    await new Promise((r) => setTimeout(r, SETTLE_MS));
    const file = path.join(outDir, `${slug}.webp`);
    await page.screenshot({ path: file, type: 'webp', quality: 90 });
    console.log(`ok  ${slug}  ->  ${path.relative(root, file)}`);
  } catch (err) {
    console.error(`fail ${slug}: ${err.message}`);
  } finally {
    await page.close();
  }
}

await browser.close();
