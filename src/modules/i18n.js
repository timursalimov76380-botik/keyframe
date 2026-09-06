import { dict } from '../i18n/dict.js';

const STORAGE_KEY = 'keyframe:lang';
const SUPPORTED = ['ru', 'en'];

let current = 'ru';
const listeners = new Set();

export function t(key) {
  return dict[current]?.[key] ?? dict.ru[key] ?? key;
}

export function getLang() {
  return current;
}

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function detect() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (SUPPORTED.includes(stored)) return stored;
  // Кириллические локали ведут на русскую версию, всё остальное — на английскую
  const nav = (navigator.language || 'ru').toLowerCase();
  return /^(ru|uk|be|kk|ky|uz|tg)/.test(nav) ? 'ru' : 'en';
}

function apply() {
  document.documentElement.lang = current;

  for (const el of document.querySelectorAll('[data-i18n]')) {
    const value = t(el.dataset.i18n);
    if (typeof value === 'string') el.textContent = value;
  }

  for (const el of document.querySelectorAll('[data-i18n-html]')) {
    const value = t(el.dataset.i18nHtml);
    if (typeof value === 'string') el.innerHTML = value;
  }

  for (const el of document.querySelectorAll('[data-i18n-alt]')) {
    const value = t(el.dataset.i18nAlt);
    if (typeof value === 'string') el.setAttribute('alt', value);
  }

  document.title = t('meta.title');
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'));
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', t('meta.title'));
  document
    .querySelector('meta[property="og:description"]')
    ?.setAttribute('content', t('meta.description'));

  for (const btn of document.querySelectorAll('.lang__btn')) {
    btn.setAttribute('aria-pressed', String(btn.dataset.lang === current));
  }

  for (const fn of listeners) fn(current);
}

export function setLang(lang) {
  if (!SUPPORTED.includes(lang) || lang === current) return;
  current = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  apply();
}

export function initI18n() {
  current = detect();
  apply();

  for (const btn of document.querySelectorAll('.lang__btn')) {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  }
}
