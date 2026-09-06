/**
 * Бесконечная лента-разделитель.
 *
 * Фиксированное число копий в разметке не годится: если одна копия уже́ экрана,
 * в конце цикла справа открывается пустота и лента выглядит как рывок с перезапуском.
 * Поэтому копии клонируются под фактическую ширину: K копий перекрывают экран,
 * всего их 2K, а сдвиг на -50% равен ровно K копиям — стык приходится на одинаковый
 * кусок текста, и место склейки не видно.
 */
const SPEED = 118; // пикселей в секунду, одинаково на любой ширине экрана

export function initMarquee() {
  const marquee = document.querySelector('.marquee');
  const track = marquee?.querySelector('.marquee__track');
  const proto = track?.firstElementChild;
  if (!proto) return;

  const template = proto.cloneNode(true);

  function build() {
    while (track.children.length > 1) track.lastElementChild.remove();

    const groupWidth = track.firstElementChild.getBoundingClientRect().width;
    const viewport = marquee.getBoundingClientRect().width;
    if (!groupWidth || !viewport) return;

    const covering = Math.max(1, Math.ceil(viewport / groupWidth));
    for (let i = 1; i < covering * 2; i += 1) track.append(template.cloneNode(true));

    track.style.setProperty('--marquee-duration', `${(covering * groupWidth) / SPEED}s`);
  }

  // Ширина группы зависит от того, подгрузился ли шрифт
  if (document.fonts?.ready) document.fonts.ready.then(build);
  else build();
  build();

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 200);
  });
}
