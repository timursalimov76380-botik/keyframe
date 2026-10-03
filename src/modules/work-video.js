/**
 * Видео в карточках работ.
 *
 * Постер лежит в data-poster, а не в poster: атрибут poster браузер качает сразу
 * при загрузке страницы и с высоким приоритетом — кадр в 140 КБ отбирал канал
 * у шрифтов и скриптов первого экрана. Ставим его, только когда до карточки
 * остаётся около экрана прокрутки. Само видео с preload="none" до старта не качается.
 *
 * Играет только пока карточка на экране, вне экрана ставится на паузу.
 * Не запускается при prefers-reduced-motion и при включённой экономии трафика:
 * тогда остаётся постер — тот же кадр, что и у остальных работ.
 */
export function initWorkVideo() {
  const videos = [...document.querySelectorAll('video[data-autoplay]')];
  if (!videos.length) return;

  const showPoster = (video) => {
    if (video.dataset.poster && !video.poster) video.poster = video.dataset.poster;
  };

  if (!('IntersectionObserver' in window)) {
    videos.forEach(showPoster);
    return;
  }

  const nearIO = new IntersectionObserver(
    (entries) => {
      for (const { target, isIntersecting } of entries) {
        if (!isIntersecting) continue;
        showPoster(target);
        nearIO.unobserve(target);
      }
    },
    { rootMargin: '100% 0px' },
  );
  videos.forEach((v) => nearIO.observe(v));

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = navigator.connection?.saveData === true;
  if (saveData) return;

  const visible = new Set();

  const sync = (video) => {
    if (visible.has(video) && !reduceMotion.matches && !document.hidden) {
      // play() отклоняется, если браузер запретил автозапуск — постер просто остаётся
      video.play().catch(() => {});
    } else if (!video.paused) {
      video.pause();
    }
  };

  const playIO = new IntersectionObserver(
    (entries) => {
      for (const { target, isIntersecting } of entries) {
        if (isIntersecting) visible.add(target);
        else visible.delete(target);
        sync(target);
      }
    },
    { threshold: 0.25 },
  );

  for (const video of videos) {
    // muted ставим и свойством: атрибута недостаточно для автозапуска в части браузеров
    video.muted = true;
    // Страховка к атрибуту loop: если браузер всё же дошёл до конца и остановился,
    // запускаем круг заново сами
    video.addEventListener('ended', () => {
      video.currentTime = 0;
      sync(video);
    });
    playIO.observe(video);
  }

  const syncAll = () => videos.forEach(sync);
  document.addEventListener('visibilitychange', syncAll);
  reduceMotion.addEventListener?.('change', syncAll);
}
