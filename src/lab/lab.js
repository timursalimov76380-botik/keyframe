import { VARIANTS } from './variants.js';
import { createLabScene } from './scene.js';

const stageCanvas = document.getElementById('stage-canvas');
const nameEl = document.getElementById('variant-name');
const noteEl = document.getElementById('variant-note');
const thumbsEl = document.getElementById('thumbs');
const playBtn = document.getElementById('play');
const resetBtn = document.getElementById('reset');
const contextToggle = document.getElementById('context');
const wordmark = document.getElementById('wordmark');

const stage = createLabScene(stageCanvas, { octaves: 3, dpr: 2 });
stage.resize();

const DEFAULTS = stage.getParams();

/* ── Превью вариантов ───────────────────────────────────────────
   Все миниатюры рисует один вспомогательный рендерер, а результат копируется
   в обычный 2D-канвас. Иначе на странице открылось бы девять WebGL-контекстов,
   и браузер начал бы закрывать самые старые. */
function paintThumbnails() {
  const off = document.createElement('canvas');
  const preview = createLabScene(off, { octaves: 2, dpr: 1, lite: true, keepBuffer: true });
  preview.setSize(460, 460);

  for (const variant of VARIANTS) {
    preview.setVariant(variant);
    const target = document.querySelector(`[data-thumb="${variant.id}"]`);
    if (!target) continue;
    const ctx = target.getContext('2d');
    ctx.clearRect(0, 0, target.width, target.height);
    // Копировать нужно синхронно после отрисовки: буфер не сохраняется между кадрами
    ctx.drawImage(preview.domElement, 0, 0, target.width, target.height);
  }

  preview.dispose();
}

function buildThumbs() {
  for (const variant of VARIANTS) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'thumb';
    card.dataset.id = variant.id;
    card.innerHTML = `
      <canvas class="thumb__canvas" data-thumb="${variant.id}" width="460" height="460"></canvas>
      <span class="thumb__name"></span>
      <span class="thumb__note"></span>
    `;
    card.querySelector('.thumb__name').textContent = variant.name;
    card.querySelector('.thumb__note').textContent = variant.note;
    card.addEventListener('click', () => select(variant.id));
    thumbsEl.append(card);
  }
}

function select(id) {
  const variant = VARIANTS.find((v) => v.id === id) ?? VARIANTS[0];
  stage.setVariant(variant);
  nameEl.textContent = variant.name;
  noteEl.textContent = variant.note;

  for (const card of thumbsEl.children) {
    card.setAttribute('aria-current', String(card.dataset.id === variant.id));
  }
  if (stage.running) stage.start();
}

/* ── Ползунки ───────────────────────────────────────────────── */
for (const input of document.querySelectorAll('input[type="range"]')) {
  const output = document.querySelector(`[data-for="${input.id}"]`);
  const sync = () => {
    const value = Number(input.value);
    stage.setParam(input.dataset.param, value);
    if (output) output.textContent = value.toFixed(2);
  };
  input.addEventListener('input', sync);
  sync();
}

playBtn.addEventListener('click', () => {
  if (stage.running) {
    stage.stop();
    playBtn.textContent = 'Запустить';
  } else {
    stage.start();
    playBtn.textContent = 'Пауза';
  }
});

resetBtn.addEventListener('click', () => {
  for (const input of document.querySelectorAll('input[type="range"]')) {
    input.value = String(DEFAULTS[input.dataset.param]);
    input.dispatchEvent(new Event('input'));
  }
});

contextToggle.addEventListener('change', () => {
  wordmark.hidden = !contextToggle.checked;
});

window.addEventListener('resize', () => {
  stage.resize();
  if (!stage.running) stage.renderOnce();
});

buildThumbs();
select(VARIANTS[0].id);
paintThumbnails();
stage.start();
playBtn.textContent = 'Пауза';
