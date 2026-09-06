/**
 * Проверяет ссылки на ботов-кейсы под калькулятором ботов: правильные имена,
 * правильные url, target=_blank+rel=noopener, непустые aria-label, и что состав
 * меняется вместе с тарифом. node scripts/check-bot-proof.mjs [url]
 */
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer';

const url = process.argv[2] || 'http://localhost:5195/';

// Имя Маки-Маки — единственное, которое переключается по языку (кириллица → Maki-Maki),
// остальные три бренда латиницей и так, одинаковы в обоих языках
const EXPECTED_BY_LANG = {
  ru: {
    base: [
      ['Dark Glass', 'https://t.me/Ddark_glasss_bot'],
      ['Boss Volos', 'https://t.me/Boss_volos_bot'],
    ],
    standard: [['Маки-Маки', 'https://t.me/Makii_Makii_bot']],
    premium: [['Groq Assistant', 'https://t.me/Groq_Assisstantt_bot']],
  },
  en: {
    base: [
      ['Dark Glass', 'https://t.me/Ddark_glasss_bot'],
      ['Boss Volos', 'https://t.me/Boss_volos_bot'],
    ],
    standard: [['Maki-Maki', 'https://t.me/Makii_Makii_bot']],
    premium: [['Groq Assistant', 'https://t.me/Groq_Assisstantt_bot']],
  },
};

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars'] });
const page = await browser.newPage();
page.on('pageerror', (e) => console.error(`PAGEERROR ${e.message}`));
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

let problems = 0;
let checked = 0;

for (const lang of ['ru', 'en']) {
  await page.click(`.lang__btn[data-lang="${lang}"]`);
  const EXPECTED = EXPECTED_BY_LANG[lang];
  for (const tier of Object.keys(EXPECTED)) {
    await page.evaluate((t) => {
      const el = document.querySelector(`#bot-calc input[name="tier"][value="${t}"]`);
      el.checked = true;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, tier);

    const links = await page.evaluate(() => {
      const label = document.querySelector('#bot-calc-proof .calc__proof-label');
      const anchors = [...document.querySelectorAll('#bot-calc-proof a')];
      return {
        labelText: label?.textContent ?? null,
        anchors: anchors.map((a) => ({
          href: a.getAttribute('href'),
          target: a.target,
          rel: a.rel,
          ariaLabel: a.getAttribute('aria-label'),
          text: a.textContent.trim(),
        })),
      };
    });

    checked += 1;
    const exp = EXPECTED[tier];
    const issues = [];

    if (!links.labelText || links.labelText.startsWith('bot.')) issues.push('подпись «Уже работает» пустая/непереведённая');
    if (links.anchors.length !== exp.length) {
      issues.push(`ссылок ${links.anchors.length}, ожидал ${exp.length}`);
    } else {
      exp.forEach(([name, href], i) => {
        const a = links.anchors[i];
        if (!a.text.includes(name)) issues.push(`ссылка ${i}: текст «${a.text}», ожидал имя «${name}»`);
        if (a.href !== href) issues.push(`ссылка ${i}: href «${a.href}», ожидал «${href}»`);
        if (a.target !== '_blank') issues.push(`ссылка ${i}: target «${a.target}», ожидал _blank`);
        if (!a.rel.includes('noopener')) issues.push(`ссылка ${i}: rel «${a.rel}» без noopener`);
        if (!a.ariaLabel || !a.ariaLabel.includes(name)) issues.push(`ссылка ${i}: aria-label не содержит имя`);
      });
    }

    if (issues.length) {
      problems += issues.length;
      console.log(`✗ ${lang} / ${tier}  →  ${issues.join('; ')}`);
    }
  }
}

console.log(`\nПроверено: ${checked}. Проблем: ${problems}.`);
await browser.close();
process.exit(problems > 0 ? 1 : 0);
