import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.shots');
const selector = process.argv[2] || '#process';
const name = process.argv[3] || 'section';
const width = Number(process.argv[4] || 1280);
const url = process.argv[5] || 'http://localhost:5195/';

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p));

await mkdir(outDir, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars'] });
const page = await browser.newPage();
await page.setViewport({ width, height: 900, deviceScaleFactor: 1.5 });
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.evaluate(() => document.fonts?.ready);
await new Promise((r) => setTimeout(r, 500));
const el = await page.$(selector);
await el.screenshot({ path: path.join(outDir, `${name}.webp`), type: 'webp', quality: 92 });
console.log(`ok  .shots/${name}.webp`);
await browser.close();
