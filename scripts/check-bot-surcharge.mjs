/**
 * Проверяет, что фраза про +20% исчезает ровно тогда, когда выбран мессенджер
 * «оба», а «точная стоимость — после брифа» видна всегда.
 * node scripts/check-bot-surcharge.mjs [url]
 */
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer';

const url = process.argv[2] || 'http://localhost:5195/';

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars'] });
const page = await browser.newPage();
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

let problems = 0;
let checked = 0;

async function state() {
  return page.evaluate(() => {
    const note = document.getElementById('bot-calc-surcharge-note');
    const cs = getComputedStyle(note);
    return {
      hiddenAttr: note.hidden,
      visuallyHidden: cs.display === 'none',
      text: note.textContent.trim(),
    };
  });
}

for (const messenger of ['telegram', 'max', 'both']) {
  await page.select('#bot-messenger', messenger);
  const s = await state();
  checked += 1;
  const shouldBeHidden = messenger === 'both';
  const ok = s.hiddenAttr === shouldBeHidden && s.visuallyHidden === shouldBeHidden;
  if (!ok) {
    problems += 1;
    console.log(`✗ messenger=${messenger}  hiddenAttr=${s.hiddenAttr} visuallyHidden=${s.visuallyHidden}  ожидал hidden=${shouldBeHidden}`);
  }
}

// «После брифа» должна быть видна всегда, независимо от messenger
for (const messenger of ['telegram', 'max', 'both']) {
  await page.select('#bot-messenger', messenger);
  checked += 1;
  const visible = await page.evaluate(() => {
    const spans = [...document.querySelectorAll('.calc__disclaimer span')];
    const brief = spans[1];
    return brief && getComputedStyle(brief).display !== 'none' && brief.textContent.trim().length > 0;
  });
  if (!visible) {
    problems += 1;
    console.log(`✗ «после брифа» не видна при messenger=${messenger}`);
  }
}

console.log(`\nПроверено: ${checked}. Проблем: ${problems}.`);
await browser.close();
process.exit(problems > 0 ? 1 : 0);
