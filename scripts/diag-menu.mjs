/**
 * Открывает мобильное меню и меряет кнопку внутри него: размер шрифта,
 * число строк и запас до краёв. Проверяет оба языка.
 * node scripts/diag-menu.mjs [url]
 */
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.shots');
const url = process.argv[2] || 'http://localhost:5190/';

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

for (const lang of ['ru', 'en']) {
  console.log(`\n=== ${lang.toUpperCase()} ===`);
  for (const width of [880, 700, 560, 475, 430, 390, 360, 320]) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 820, deviceScaleFactor: 2 });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.evaluate(() => document.fonts?.ready);
    await page.click(`.lang__btn[data-lang="${lang}"]`);
    await page.click('.nav__burger');
    await new Promise((r) => setTimeout(r, 400));

    const info = await page.evaluate(() => {
      const menu = document.getElementById('mobile-menu');
      const btn = menu.querySelector('.btn');
      const cs = getComputedStyle(btn);
      const r = btn.getBoundingClientRect();

      const range = document.createRange();
      range.selectNodeContents(btn);
      const lines = range.getClientRects().length;
      const tr = range.getBoundingClientRect();

      const item = menu.querySelector('a:not(.btn)');

      return {
        font: Math.round(parseFloat(cs.fontSize)),
        itemFont: Math.round(parseFloat(getComputedStyle(item).fontSize)),
        btnWidth: Math.round(r.width),
        textWidth: Math.round(tr.width),
        inner: Math.round(r.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)),
        lines,
        leftGap: Math.round(tr.left - r.left),
        rightGap: Math.round(r.right - tr.right),
      };
    });

    const slack = info.inner - info.textWidth;
    const ok = info.lines === 1 && slack >= 0;
    console.log(
      `${String(width).padStart(4)}px  кнопка ${String(info.font).padStart(2)}px / пункт ${info.itemFont}px  ` +
        `текст ${String(info.textWidth).padStart(3)} из ${String(info.inner).padStart(3)}  ` +
        `запас ${String(slack).padStart(3)}  строк ${info.lines}  ` +
        `поля ${info.leftGap}/${info.rightGap}  ${ok ? '' : '← ПРОБЛЕМА'}`,
    );

    if (lang === 'ru' && (width === 390 || width === 320)) {
      await page.screenshot({ path: path.join(outDir, `menu-${width}.webp`), type: 'webp', quality: 92 });
    }
    await page.close();
  }
}

await browser.close();
