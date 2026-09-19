/**
 * Прогоняет калькулятор по всем комбинациям тип×тариф×язык и проверяет,
 * что цена/срок/список входящего/список исключений не пустые и не «дыра» —
 * не NaN, не пустая строка, не остаток data-i18n ключа вместо текста.
 * node scripts/check-calc.mjs [url]
 */
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer';

const url = process.argv[2] || 'http://localhost:5195/';
const KINDS = ['landing', 'multipage', 'design', 'shop'];
const TIERS = ['base', 'standard', 'premium'];
const LANGS = ['ru', 'en'];

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars'],
});

const page = await browser.newPage();
page.on('pageerror', (e) => console.error(`PAGEERROR ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') console.error(`CONSOLE ${m.text()}`);
});

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.evaluate(() => document.fonts?.ready);

let problems = 0;
let checked = 0;

for (const lang of LANGS) {
  await page.click(`.lang__btn[data-lang="${lang}"]`);

  for (const kind of KINDS) {
    await page.select('#calc-kind', kind);

    for (const tier of TIERS) {
      await page.evaluate((t) => {
        const el = document.querySelector(`input[name="tier"][value="${t}"]`);
        el.checked = true;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, tier);

      // Дважды: сначала CMS выключен, затем (если доступен) включён
      for (const wantCms of [false, true]) {
        await page.evaluate((want) => {
          const el = document.getElementById('calc-cms');
          if (el.disabled) return;
          if (el.checked !== want) {
            el.checked = want;
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, wantCms);

        const state = await page.evaluate(() => {
          const price = document.getElementById('calc-price').textContent;
          const term = document.getElementById('calc-term').textContent;
          const includes = [...document.querySelectorAll('#calc-includes li')].map((li) => li.textContent);
          const excludesBox = document.getElementById('calc-excludes');
          // Проверяем и DOM-свойство, и то, что реально отрисуется: CSS-специфичность
          // однажды перебила атрибут hidden, а свойство при этом оставалось true
          const excludesHidden =
            excludesBox.hidden && getComputedStyle(excludesBox).display === 'none';
          const excludes = [...document.querySelectorAll('#calc-excludes-list li')].map((li) => li.textContent);
          const cmsRow = document.getElementById('calc-cms-row');
          const cmsChecked = document.getElementById('calc-cms').checked;
          const cmsDisabled = document.getElementById('calc-cms').disabled;
          const cmsNote = cmsRow.querySelector('small').textContent;
          return {
            price,
            term,
            includes,
            excludesHidden,
            excludes,
            cmsState: cmsRow.dataset.state,
            cmsChecked,
            cmsDisabled,
            cmsNote,
          };
        });

        checked += 1;
        const issues = [];

        // RU показывает рубли, EN — расчётный доллар без рублей рядом
        const priceOk =
          lang === 'en' ? /^\$\d[\d,]*$/.test(state.price) : /^\d[\d\s\u00a0]*\s*₽$/.test(state.price);
        if (!priceOk) issues.push(`цена «${state.price}»`);
        if (!/^\d+(–\d+)?$/.test(state.term)) issues.push(`срок «${state.term}»`);
        if (state.includes.length === 0) issues.push('пустой список входящего');
        if (state.includes.some((t) => /^calc\./.test(t))) issues.push('непереведённая строка в includes');
        if (state.cmsNote.startsWith('calc.')) issues.push('непереведённая заметка CMS');
        if (kind === 'shop' && state.excludesHidden) issues.push('блок исключений скрыт для магазина');
        if (kind !== 'shop' && !state.excludesHidden) issues.push('блок исключений показан там, где не должен');
        if (kind === 'shop' && !state.excludesHidden && state.excludes.length !== 3) {
          issues.push(`ожидал 3 пункта исключений, получил ${state.excludes.length}`);
        }
        if (kind === 'shop' && (!state.cmsChecked || !state.cmsDisabled || state.cmsState !== 'included')) {
          issues.push(`CMS магазина должна быть checked+disabled+included, а не ${JSON.stringify(state)}`);
        }
        if (kind === 'design' && (state.cmsChecked || !state.cmsDisabled || state.cmsState !== 'off')) {
          issues.push(`CMS дизайна должна быть unchecked+disabled+off`);
        }

        if (issues.length) {
          problems += issues.length;
          console.log(
            `✗ ${lang} / ${kind} / ${tier} / cms=${wantCms}  →  ${issues.join('; ')}`,
          );
        }

        // Для типов без переключаемого CMS второй проход (wantCms=true) не нужен
        const cmsToggleable = await page.evaluate(() => !document.getElementById('calc-cms').disabled);
        if (!cmsToggleable) break;
      }
    }
  }
}

console.log(`\nПроверено комбинаций: ${checked}. Проблем: ${problems}.`);
await browser.close();
process.exit(problems > 0 ? 1 : 0);
