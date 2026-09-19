import { getLang, onLangChange } from './i18n.js';

/**
 * Цены в калькуляторах хранятся в рублях. На RU-версии показываем их как есть,
 * на EN — расчётный доллар по курсу ЦБ РФ, рубли рядом не выводим.
 *
 * Курс берём с cbr-xml-daily.ru (бесплатное зеркало официального курса ЦБ, CORS открыт).
 * Он меняется раз в сутки, поэтому запрашиваем не чаще раза в 24 часа и кладём в localStorage.
 * Запрос уходит только с EN-версии: русскоязычному посетителю курс не нужен.
 * Если запрос не удался, остаётся последнее полученное значение, а при первом же
 * сбое без кэша — запасной курс ниже, так что страница не ломается ни в одном случае.
 */
const CBR_URL = 'https://www.cbr-xml-daily.ru/daily_json.js';
const STORAGE_KEY = 'keyframe:usd-rub';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 6000;

// Курс ЦБ на 19.09.2026. Нужен только пока нет ни свежего ответа, ни кэша.
const FALLBACK_RATE = 84.2;

// Отсекаем заведомо мусорные ответы: курс доллара не бывает 3 или 30 000 ₽
const isSaneRate = (n) => Number.isFinite(n) && n > 20 && n < 1000;

const rubFormat = new Intl.NumberFormat('ru-RU');
const usdFormat = new Intl.NumberFormat('en-US');

let rate = FALLBACK_RATE;
let fetchedAt = 0;
let inflight = false;
const listeners = new Set();

function readCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (cached && isSaneRate(cached.rate) && Number.isFinite(cached.fetchedAt)) return cached;
  } catch {
    // localStorage может быть недоступен или содержать чужой мусор — тогда просто без кэша
  }
  return null;
}

function writeCache() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ rate, fetchedAt }));
  } catch {
    // Приватный режим: курс останется только на время страницы, это не страшно
  }
}

async function fetchRate() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(CBR_URL, { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json();
    const usd = data?.Valute?.USD;
    const value = Number(usd?.Value) / Number(usd?.Nominal || 1);
    return isSaneRate(value) ? value : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function refreshIfStale() {
  if (getLang() !== 'en' || inflight) return;
  if (fetchedAt && Date.now() - fetchedAt < MAX_AGE_MS) return;

  inflight = true;
  const fresh = await fetchRate();
  inflight = false;
  if (fresh === null) return;

  const changed = fresh !== rate;
  rate = fresh;
  fetchedAt = Date.now();
  writeCache();
  if (changed) for (const fn of listeners) fn();
}

// До $5 округляем, чтобы цена не «плавала» на доллар от каждого сдвига курса
const roundUsd = (usd) => Math.max(5, Math.round(usd / 5) * 5);

export function formatPrice(amountRub) {
  if (getLang() !== 'en') return `${rubFormat.format(amountRub)} ₽`;
  return `$${usdFormat.format(roundUsd(amountRub / rate))}`;
}

export function onRateChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function initCurrency() {
  const cached = readCache();
  if (cached) {
    rate = cached.rate;
    fetchedAt = cached.fetchedAt;
  }
  onLangChange(refreshIfStale);
  refreshIfStale();
}
