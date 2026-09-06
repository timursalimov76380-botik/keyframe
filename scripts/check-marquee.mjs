/**
 * Проверяет, что лента непрерывна: после сдвига на -50% оставшейся длины
 * должно хватать, чтобы перекрыть экран, иначе в цикле появится пустота.
 * node scripts/check-marquee.mjs [url]
 */
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer';

const url = process.argv[2] || 'http://localhost:5190/';

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars', '--enable-unsafe-swiftshader'],
});

for (const width of [1280, 1440, 1920, 2560]) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => document.fonts?.ready);
  await new Promise((r) => setTimeout(r, 900));

  const info = await page.evaluate(() => {
    const m = document.querySelector('.marquee');
    const t = m.querySelector('.marquee__track');
    const gw = t.children[0].getBoundingClientRect().width;
    const tw = t.getBoundingClientRect().width;
    const mw = m.getBoundingClientRect().width;
    const dur = parseFloat(getComputedStyle(t).animationDuration);
    return {
      groups: t.children.length,
      groupWidth: Math.round(gw),
      trackWidth: Math.round(tw),
      ribbonWidth: Math.round(mw),
      shift: Math.round(tw / 2),
      duration: Number(dur.toFixed(1)),
      speed: Math.round(tw / 2 / dur),
    };
  });

  const seamless = info.shift >= info.ribbonWidth;
  console.log(
    `${String(width).padStart(4)}px  групп ${info.groups}  лента ${info.trackWidth}px  ` +
      `сдвиг ${info.shift}px  цикл ${info.duration}с  ${info.speed}px/с  ` +
      `${seamless ? 'без разрыва' : 'РАЗРЫВ'}`,
  );
  await page.close();
}

await browser.close();
