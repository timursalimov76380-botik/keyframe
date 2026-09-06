/**
 * Появление блоков при скролле.
 *
 * rootMargin снизу ПОЛОЖИТЕЛЬНЫЙ: область наблюдения продлевается под экран,
 * и блок начинает проявляться ещё до того, как въедет в кадр. С отрицательным
 * значением было наоборот — запуск откладывался, и при быстром скролле ловилось
 * окно около 130 мс, где вся секция висела прозрачной.
 */
export function initReveal() {
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;

  if (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    !('IntersectionObserver' in window)
  ) {
    for (const el of items) el.classList.add('is-revealed');
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;
        // Соседи внутри одной сетки проявляются друг за другом, а не разом
        const siblings = [...(el.parentElement?.children ?? [])].filter((n) =>
          n.hasAttribute('data-reveal'),
        );
        const index = Math.max(0, siblings.indexOf(el));
        // Задержка каскада укорочена: при 90 мс и четырёх соседях последняя карточка
        // трогалась только через 360 мс после запуска — это и был «пустой» кадр
        el.style.transitionDelay = `${Math.min(index, 3) * 55}ms`;
        el.classList.add('is-revealed');
        observer.unobserve(el);
      }
    },
    { threshold: 0, rootMargin: '0px 0px 18% 0px' },
  );

  for (const el of items) observer.observe(el);
}
