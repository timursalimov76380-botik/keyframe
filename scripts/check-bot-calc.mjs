/**
 * Проверяет калькулятор ботов: тариф×мессенджер×язык — цена, срок, текст
 * «для кого», и главное — что MAX/«оба» реально пропадают в EN и messenger
 * откатывается на telegram, если был выбран max/both перед переключением языка.
 * node scripts/check-bot-calc.mjs [url]
 */
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer';

const url = process.argv[2] || 'http://localhost:5195/';
const TIERS = ['base', 'standard', 'premium'];
const EXPECTED = {
  base: { days: '2–3', price: 12000 },
  standard: { days: '4–6', price: 25000 },
  premium: { days: '7–10', price: 45000 },
};

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars'] });
const page = await browser.newPage();
page.on('pageerror', (e) => console.error(`PAGEERROR ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') console.error(`CONSOLE ${m.text()}`);
});

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.evaluate(() => document.fonts?.ready);

let problems = 0;
let checked = 0;

async function setTier(tier) {
  await page.evaluate((t) => {
    const el = document.querySelector(`#bot-calc input[name="tier"][value="${t}"]`);
    el.checked = true;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, tier);
}

async function setMessenger(value) {
  await page.select('#bot-messenger', value);
}

function money(n) {
  return `${n.toLocaleString('ru-RU')} ₽`;
}

// ── RU: базовые числа и надбавка за «оба» ──────────────────────
await page.click('.lang__btn[data-lang="ru"]');
for (const tier of TIERS) {
  await setTier(tier);
  for (const messenger of ['telegram', 'max', 'both']) {
    await setMessenger(messenger);
    const state = await page.evaluate(() => ({
      price: document.getElementById('bot-calc-price').textContent,
      term: document.getElementById('bot-calc-term').textContent,
      forWhom: document.getElementById('bot-calc-for-whom').textContent,
    }));
    checked += 1;

    const exp = EXPECTED[tier];
    const expPrice = messenger === 'both' ? Math.round(exp.price * 1.2) : exp.price;
    const issues = [];
    if (state.price !== money(expPrice)) issues.push(`цена «${state.price}», ожидал «${money(expPrice)}»`);
    if (state.term !== exp.days) issues.push(`срок «${state.term}», ожидал «${exp.days}»`);
    if (!state.forWhom || state.forWhom.startsWith('bot.')) issues.push('пустой/непереведённый текст «для кого»');

    if (issues.length) {
      problems += issues.length;
      console.log(`✗ ru / ${tier} / ${messenger}  →  ${issues.join('; ')}`);
    }
  }
}

// ── Переключение языка: MAX/«оба» должны пропасть и сброситься ─
await setMessenger('both');
await page.click('.lang__btn[data-lang="en"]');
checked += 1;
const afterSwitch = await page.evaluate(() => {
  const sel = document.getElementById('bot-messenger');
  const opts = [...sel.options].map((o) => ({ value: o.value, hidden: o.hidden }));
  return { value: sel.value, opts, price: document.getElementById('bot-calc-price').textContent };
});
{
  const issues = [];
  if (afterSwitch.value !== 'telegram') issues.push(`messenger остался «${afterSwitch.value}», ожидал сброс на telegram`);
  const max = afterSwitch.opts.find((o) => o.value === 'max');
  const both = afterSwitch.opts.find((o) => o.value === 'both');
  if (!max?.hidden) issues.push('option[max] не скрыт в EN');
  if (!both?.hidden) issues.push('option[both] не скрыт в EN');
  // На premium тарифе (последний выбранный) без надбавки должно быть 45 000 ₽
  if (issues.length) {
    problems += issues.length;
    console.log(`✗ смена языка ru→en (был выбран «both»)  →  ${issues.join('; ')}`);
  }
}

// ── EN: цены и переводы по тарифам (messenger уже сброшен на telegram) ─
for (const tier of TIERS) {
  await setTier(tier);
  const state = await page.evaluate(() => ({
    price: document.getElementById('bot-calc-price').textContent,
    term: document.getElementById('bot-calc-term').textContent,
    forWhom: document.getElementById('bot-calc-for-whom').textContent,
  }));
  checked += 1;
  const exp = EXPECTED[tier];
  const issues = [];
  if (state.price !== money(exp.price)) issues.push(`цена «${state.price}», ожидал «${money(exp.price)}»`);
  if (state.term !== exp.days) issues.push(`срок «${state.term}», ожидал «${exp.days}»`);
  if (!state.forWhom || state.forWhom.startsWith('bot.')) issues.push('пустой/непереведённый текст «для кого»');
  if (issues.length) {
    problems += issues.length;
    console.log(`✗ en / ${tier}  →  ${issues.join('; ')}`);
  }
}

// ── Обратное переключение en→ru: MAX должен вернуться ──────────
await page.click('.lang__btn[data-lang="ru"]');
const backToRu = await page.evaluate(() => {
  const sel = document.getElementById('bot-messenger');
  return [...sel.options].map((o) => ({ value: o.value, hidden: o.hidden }));
});
checked += 1;
{
  const max = backToRu.find((o) => o.value === 'max');
  const both = backToRu.find((o) => o.value === 'both');
  if (max?.hidden || both?.hidden) {
    problems += 1;
    console.log('✗ смена языка en→ru  →  MAX/«оба» не вернулись в список');
  }
}

console.log(`\nПроверено: ${checked}. Проблем: ${problems}.`);
await browser.close();
process.exit(problems > 0 ? 1 : 0);
