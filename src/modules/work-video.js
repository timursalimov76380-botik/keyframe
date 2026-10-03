/**
 * Видео в карточках работ. В разметке у <video> стоит preload="none" и постер,
 * поэтому до прокрутки к секции файл не качается вовсе.
 *
 * Играет только пока карточка на экране, вне экрана ставится на паузу.
 * Не запускается при prefers-reduced-motion и при включённой экономии трафика:
 * тогда остаётся постер — тот же кадр, что и у остальных работ.
 */
export function initWorkVideo() {
  const videos = [...document.querySelectorAll('video[data-autoplay]')];
  if (!videos.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = navigator.connection?.saveData === true;
  if (saveData || !('IntersectionObserver' in window)) return;

  const visible = new Set();

  const sync = (video) => {
    if (visible.has(video) && !reduceMotion.matches && !document.hidden) {
      // play() отклоняется, если браузер запретил автозапуск — постер просто остаётся
      video.play().catch(() => {});
    } else if (!video.paused) {
      video.pause();
    }
  };

  const io = new IntersectionObserver(
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
    io.observe(video);
  }

  const syncAll = () => videos.forEach(sync);
  document.addEventListener('visibilitychange', syncAll);
  reduceMotion.addEventListener?.('change', syncAll);
}
