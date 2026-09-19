import { t, getLang, onLangChange } from './i18n.js';
import { formatPrice, onRateChange } from './currency.js';

/**
 * Второй калькулятор, независимый от сайтового (см. calculator.js).
 * Оси другие — мессенджер × сложность, с надбавкой за оба мессенджера сразу,
 * а не чекбоксом-опцией — поэтому не переиспользует PRICING-модель сайтового
 * калькулятора, только его CSS-классы (.calc, .cap-card--calc и т.д.).
 *
 * Сроки — не из КП (для ботов их пока нет), собственная оценка по плотности
 * ₽/рабочий день у остальных тарифов сайта: 12 000 / 25 000 / 45 000 ₽
 * при типичной плотности ~4500–5000 ₽/день дают 2–3 / 4–6 / 7–10 дней.
 */
const PRICING = {
  base: { price: 12000, days: [2, 3] },
  standard: { price: 25000, days: [4, 6] },
  premium: { price: 45000, days: [7, 10] },
};

const BOTH_SURCHARGE = 0.2;

/**
 * Реальные боты из портфолио — ссылки прислал Тимур 15 августа 2026, все четыре
 * резолвятся в зарегистрированных ботов Telegram (страница запуска, а не «не найден»).
 * Groq Assistant закрывает премиум-тариф, для которого раньше не было ни одного
 * подходящего кейса — остальные три сайта в портфолио не делают ИИ-диалог.
 *
 * name — литерал, если имя одинаковое на обоих языках (Dark Glass, Boss Volos,
 * Groq Assistant — латиницей и так). nameKey — ключ словаря, если нужен разный
 * текст по языкам: у Маки-Маки бренд-имя кириллическое, в EN должно стать Maki-Maki.
 */
const PROOF = {
  base: [
    { name: 'Dark Glass', url: 'https://t.me/Ddark_glasss_bot' },
    { name: 'Boss Volos', url: 'https://t.me/Boss_volos_bot' },
  ],
  standard: [{ nameKey: 'brand.makiMaki', url: 'https://t.me/Makii_Makii_bot' }],
  premium: [{ name: 'Groq Assistant', url: 'https://t.me/Groq_Assisstantt_bot' }],
};

function formatDays([min, max]) {
  return min === max ? String(min) : `${min}–${max}`;
}

export function initBotCalculator() {
  const form = document.getElementById('bot-calc');
  if (!form) return;

  const messengerEl = document.getElementById('bot-messenger');
  const maxOption = messengerEl.querySelector('option[value="max"]');
  const bothOption = messengerEl.querySelector('option[value="both"]');
  const priceEl = document.getElementById('bot-calc-price');
  const termEl = document.getElementById('bot-calc-term');
  const forWhomEl = document.getElementById('bot-calc-for-whom');
  const proofEl = document.getElementById('bot-calc-proof');
  const surchargeNoteEl = document.getElementById('bot-calc-surcharge-note');

  function renderProof(tier) {
    const bots = PROOF[tier] ?? [];
    proofEl.replaceChildren();
    if (!bots.length) return;

    const label = document.createElement('span');
    label.className = 'calc__proof-label';
    label.textContent = t('bot.proofLabel');
    proofEl.append(label);

    for (const bot of bots) {
      const botName = bot.name ?? t(bot.nameKey);

      const a = document.createElement('a');
      a.className = 'calc__proof-link';
      a.href = bot.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.setAttribute('aria-label', `${botName}: ${t('bot.proofOpen')}`);

      const name = document.createElement('span');
      name.textContent = botName;
      const arrow = document.createElement('span');
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '↗';

      a.append(name, arrow);
      proofEl.append(a);
    }
  }

  function syncMessengerOptions() {
    // MAX — нишевый российский мессенджер: англоязычному посетителю (LaborX)
    // объяснять его в паре слов неуместно, проще убрать вариант из EN-версии
    const ruOnly = getLang() === 'ru';
    maxOption.hidden = !ruOnly;
    bothOption.hidden = !ruOnly;
    if (!ruOnly && messengerEl.value !== 'telegram') {
      messengerEl.value = 'telegram';
    }
  }

  function render() {
    syncMessengerOptions();

    const tier = form.elements.tier.value;
    const plan = PRICING[tier];
    const both = messengerEl.value === 'both';
    const price = Math.round(plan.price * (both ? 1 + BOTH_SURCHARGE : 1));

    priceEl.textContent = formatPrice(price);
    termEl.textContent = formatDays(plan.days);
    forWhomEl.textContent = t(`bot.tier.${tier}.forWhom`);
    renderProof(tier);

    // Надбавка уже учтена в цене выше — повторять правило, по которому она
    // взялась, после того как выбор уже сделан, было бы просто шумом
    surchargeNoteEl.hidden = both;
  }

  form.addEventListener('change', render);
  form.addEventListener('submit', (e) => e.preventDefault());
  onLangChange(render);
  onRateChange(render);
  render();
}
