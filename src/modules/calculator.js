import { t, onLangChange } from './i18n.js';

/**
 * Цифры взяты из действующих коммерческих предложений студии, а не выдуманы:
 * лендинг / многостраничник / дизайн-макет / интернет-магазин, три тарифа в каждом.
 * Сроки — в рабочих днях, [минимум, максимум].
 *
 * plan.cms:
 *   null              — панели не бывает (дизайн-макет сдаётся до разработки)
 *   { price, days }   — платная опция, добавляется чекбоксом
 *   { included: true } — уже входит в тариф, чекбокс заблокирован во включённом виде
 */
const PRICING = {
  landing: {
    cms: { price: 3000, days: [1, 2] },
    tiers: {
      base: { price: 9000, days: [2, 2] },
      standard: { price: 16000, days: [3, 4] },
      premium: { price: 27000, days: [5, 6] },
    },
  },
  multipage: {
    cms: { price: 5000, days: [2, 3] },
    tiers: {
      base: { price: 18000, days: [4, 5] },
      standard: { price: 30000, days: [6, 7] },
      premium: { price: 45000, days: [9, 11] },
    },
  },
  design: {
    // Макет сдаётся до разработки, панели редактирования у него быть не может
    cms: null,
    tiers: {
      base: { price: 5000, days: [1, 1] },
      standard: { price: 12000, days: [3, 3] },
      premium: { price: 25000, days: [5, 5] },
    },
  },
  shop: {
    // Простая CMS входит в магазин на любом тарифе — в КП это не опция, а часть тарифа
    cms: { included: true },
    tiers: {
      base: { price: 35000, days: [6, 7] },
      standard: { price: 55000, days: [8, 10] },
      premium: { price: 85000, days: [11, 15] },
    },
  },
};

const money = new Intl.NumberFormat('ru-RU');

function formatDays([min, max]) {
  return min === max ? String(min) : `${min}–${max}`;
}

export function initCalculator() {
  const form = document.getElementById('calc');
  if (!form) return;

  const kindEl = document.getElementById('calc-kind');
  const cmsEl = document.getElementById('calc-cms');
  const cmsRow = document.getElementById('calc-cms-row');
  const cmsNote = cmsRow?.querySelector('small');
  const priceEl = document.getElementById('calc-price');
  const termEl = document.getElementById('calc-term');
  const includesEl = document.getElementById('calc-includes');
  const excludesBox = document.getElementById('calc-excludes');
  const excludesEl = document.getElementById('calc-excludes-list');

  function renderList(el, lines) {
    el.replaceChildren(
      ...lines.map((text) => {
        const li = document.createElement('li');
        li.textContent = text;
        return li;
      }),
    );
  }

  function render() {
    const kind = kindEl.value;
    const tier = form.elements.tier.value;
    const plan = PRICING[kind];
    const base = plan.tiers[tier];
    const cms = plan.cms;

    // 'optional' — платная опция, переключается чекбоксом
    // 'included' — уже в тарифе, чекбокс заблокирован во включённом виде
    // 'off'      — панели не бывает, чекбокс заблокирован в выключенном виде
    const state = !cms ? 'off' : cms.included ? 'included' : 'optional';

    cmsRow.dataset.state = state;
    cmsEl.disabled = state !== 'optional';
    if (state === 'included') cmsEl.checked = true;
    if (state === 'off') cmsEl.checked = false;
    if (cmsNote) {
      cmsNote.textContent =
        state === 'off'
          ? t('calc.cmsNoteOff')
          : state === 'included'
            ? t('calc.cmsNoteIncluded')
            : t('calc.cmsNote');
    }

    const withCmsAddon = state === 'optional' && cmsEl.checked;
    const price = base.price + (withCmsAddon ? cms.price : 0);
    const days = withCmsAddon
      ? [base.days[0] + cms.days[0], base.days[1] + cms.days[1]]
      : base.days;

    priceEl.textContent = `${money.format(price)} ₽`;
    termEl.textContent = formatDays(days);

    const items = t(`calc.inc.${kind}.${tier}`);
    const lines = Array.isArray(items) ? [...items] : [];
    if (withCmsAddon) lines.push(t('calc.inc.cms'));
    renderList(includesEl, lines);

    // Список того, что тариф не покрывает по умолчанию — показывается,
    // только если для типа услуги он вообще есть (сейчас — только магазин)
    const excluded = t(`calc.excl.${kind}`);
    const hasExcluded = Array.isArray(excluded) && excluded.length > 0;
    if (excludesBox) excludesBox.hidden = !hasExcluded;
    if (hasExcluded) renderList(excludesEl, excluded);
  }

  form.addEventListener('change', render);
  form.addEventListener('submit', (e) => e.preventDefault());
  onLangChange(render);
  render();
}
