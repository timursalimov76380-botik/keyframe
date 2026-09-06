/**
 * Гоняет ширину окна через точку разрыва 760px маленькими шагами (эмулирует
 * перетаскивание в devtools) и на каждом шаге сравнивает реальный CSS-размер
 * канваса с тем, под который его в последний раз отресайзил three.js —
 * если буфер отстаёт от бокса, это и есть «разлёт» текста и объекта.
 * node scripts/diag-hero-resize.mjs [url]
 */
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer';

const url = process.argv[2] || 'http://localhost:5195/';

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 800, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.evaluate(() => document.fonts?.ready);
await new Promise((r) => setTimeout(r, 1500)); // дать 3D-чанку догрузиться

let mismatches = 0;
let steps = 0;

// От 900 до 600 маленькими шагами без задержки — так devtools шлёт resize при перетаскивании
for (let w = 900; w >= 600; w -= 4) {
  await page.setViewport({ width: w, height: 800, deviceScaleFactor: 1 });
  steps += 1;

  const info = await page.evaluate(() => {
    const canvas = document.getElementById('hero-canvas');
    const stage = document.getElementById('hero-stage');
    if (!canvas || !stage) return null;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const box = canvas.getBoundingClientRect();
    const stageBox = stage.getBoundingClientRect();
    // canvas.width/height — актуальный буфер рендера, выставленный three.js в последний resize()
    const bufferW = canvas.width / dpr;
    const bufferH = canvas.height / dpr;
    return {
      vw: window.innerWidth,
      boxW: Math.round(box.width),
      boxH: Math.round(box.height),
      bufferW: Math.round(bufferW),
      bufferH: Math.round(bufferH),
      stageLeft: Math.round(stageBox.left),
      stageTop: Math.round(stageBox.top),
      boxLeft: Math.round(box.left),
      boxTop: Math.round(box.top),
    };
  });

  if (!info) continue;

  const driftW = Math.abs(info.boxW - info.bufferW);
  const driftH = Math.abs(info.boxH - info.bufferH);
  const posDriftX = Math.abs(info.stageLeft - info.boxLeft);
  const posDriftY = Math.abs(info.stageTop - info.boxTop);

  if (driftW > 3 || driftH > 3) {
    mismatches += 1;
    console.log(
      `✗ vw=${info.vw}  бокс ${info.boxW}×${info.boxH}  буфер ${info.bufferW}×${info.bufferH}  ` +
        `расхождение ${driftW}×${driftH}px`,
    );
  }
  if (posDriftX > 1 || posDriftY > 1) {
    console.log(
      `  (канвас смещён относительно .wordmark__stage: ${posDriftX}×${posDriftY}px на vw=${info.vw})`,
    );
  }
}

console.log(`\nШагов: ${steps}. Расхождений буфера с боксом: ${mismatches}.`);
await browser.close();
