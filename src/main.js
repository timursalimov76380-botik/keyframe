import { initI18n } from './modules/i18n.js';
import { initCurrency } from './modules/currency.js';
import { initCalculator } from './modules/calculator.js';
import { initBotCalculator } from './modules/bot-calculator.js';
import { initReveal } from './modules/reveal.js';
import { initMarquee } from './modules/marquee.js';

initI18n();
initCurrency();
initCalculator();
initBotCalculator();
initReveal();
initMarquee();

/* ── Навигация ─────────────────────────────────────────────── */
const nav = document.getElementById('nav');
const burger = document.querySelector('.nav__burger');
const mobileMenu = document.getElementById('mobile-menu');

const onScroll = () => {
  nav.dataset.scrolled = String(window.scrollY > 24);
};
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

burger?.addEventListener('click', () => {
  const open = mobileMenu.dataset.open !== 'true';
  mobileMenu.dataset.open = String(open);
  burger.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
});

function closeMenu({ returnFocus = false } = {}) {
  if (!mobileMenu || mobileMenu.dataset.open !== 'true') return;
  mobileMenu.dataset.open = 'false';
  burger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
  // Фокус возвращаем только при закрытии с клавиатуры: после клика по ссылке
  // он должен уйти к якорю, а не прыгнуть обратно на кнопку меню
  if (returnFocus) burger.focus();
}

mobileMenu?.addEventListener('click', (e) => {
  if (e.target.closest('a')) closeMenu();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMenu({ returnFocus: true });
});

/* ── 3D-объект в хиро ──────────────────────────────────────────
   three.js с постпроцессингом — это почти весь вес скриптов страницы.
   Грузим их отдельным чанком после первой отрисовки: до его прихода
   в центре хиро уже светится CSS-подложка, так что пустоты не видно. */
async function mountHero() {
  const canvas = document.getElementById('hero-canvas');
  const stage = document.getElementById('hero-stage');
  if (!canvas) return;

  let hero = null;

  try {
    const { createHeroObject, pickQuality } = await import('./scene/hero-object.js');
    hero = createHeroObject(canvas, pickQuality());
    hero.init();
    stage.dataset.ready = 'true';
  } catch (err) {
    // Нет WebGL, контекст не создался или чанк не догрузился — остаётся
    // CSS-подложка со свечением, хиро при этом не разваливается
    console.warn('[keyframe] 3D-сцена недоступна:', err);
    stage?.setAttribute('data-fallback', 'true');
    return;
  }

  // ResizeObserver на канвасе, а не 'resize' на window: размер канваса зависит
  // от em/clamp внутри .wordmark, а не напрямую от ширины окна, и на брейкпоинте
  // 760px flex-direction переключается row→column одним скачком. При быстром
  // перетаскивании (например, в devtools) window-события могли идти чаще, чем
  // успевал отработать полный ресайз three.js, — буфер канваса на кадр отставал
  // от уже перестроившегося CSS, и объект визуально «отлетал» от текста.
  // rAF ниже гарантирует не больше одного тяжёлого ресайза за кадр отрисовки.
  let resizeQueued = false;
  const resizeObserver = new ResizeObserver(() => {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(() => {
      resizeQueued = false;
      hero.resize();
      if (!hero.animated) hero.init();
    });
  });
  resizeObserver.observe(canvas);

  if (!hero.animated) return;

  // Не крутим сцену, когда хиро ушёл из вида — это заметно по батарее на ноутбуках
  const io = new IntersectionObserver(
    ([entry]) => (entry.isIntersecting ? hero.start() : hero.stop()),
    { threshold: 0.05 },
  );
  io.observe(canvas);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) hero.stop();
    else if (canvas.getBoundingClientRect().bottom > 0) hero.start();
  });

  window.addEventListener(
    'pointermove',
    (e) => {
      hero.setPointer(
        (e.clientX / window.innerWidth) * 2 - 1,
        (e.clientY / window.innerHeight) * 2 - 1,
      );
    },
    { passive: true },
  );
}

mountHero();
