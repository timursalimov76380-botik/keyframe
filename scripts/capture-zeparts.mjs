/**
 * Видео и превью кейса Zeparts для секции «Работы».
 * Сайт передан заказчику архивом, публичной ссылки нет, поэтому снимаем с локального
 * превью проекта (в папке ZeParts: .venv/Scripts/python tools/build.py --serve → :8080).
 * node scripts/capture-zeparts.mjs [url]
 *
 * ffmpeg не нужен: кадры берём CDP-скринкастом, кодируем в H.264 через WebCodecs
 * в самом Chrome, а в MP4 упаковывает mp4-muxer (devDependency).
 *
 * Сценарий: курсор ходит по хиро (слои двигаются за мышью, бегут линии),
 * затем плавная прокрутка к карте и пауза, пока не пройдёт волна из Москвы.
 */
import { writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'work');
const url = process.argv[2] || 'http://localhost:8080/';

const VIEWPORT = { width: 1440, height: 900 };
const OUT = { width: 1280, height: 800 }; // 16:10, как остальные превью работ
const BITRATE = 1_500_000;

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars', '--force-color-profile=srgb', '--enable-unsafe-swiftshader'],
});

async function openSite(dpr) {
  const page = await browser.newPage();
  await page.setViewport({ ...VIEWPORT, deviceScaleFactor: dpr });
  // плашка cookies закрывала бы низ кадра — считаем, что согласие уже дано
  await page.setCookie({ name: 'cookies_ok', value: '1', url });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.evaluate(() => document.fonts?.ready);
  await sleep(2500);
  return page;
}

// ── 1. Статичное превью: оно же постер видео и замена при reduced-motion ──
{
  const page = await openSite(1.5);
  await page.screenshot({ path: path.join(outDir, 'zeparts.webp'), type: 'webp', quality: 90 });
  await page.close();
  console.log('ok  постер  ->  public/work/zeparts.webp');
}

// ── 2. Запись кадров ─────────────────────────────────────────────────────
const page = await openSite(1);

const fine = await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches);
if (!fine) console.warn('! браузер не считает указатель «мышью» — параллакс хиро может не включиться');

// В headless курсор не рисуется, а без него движение слоёв выглядит случайным
await page.evaluate(() => {
  const c = document.createElement('div');
  c.innerHTML =
    '<svg width="26" height="26" viewBox="0 0 24 24"><path d="M4 2l15 11-6.5 1.2L16.5 21l-3 1.4-3.6-6.8L4 20z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  Object.assign(c.style, {
    position: 'fixed', left: '0', top: '0', zIndex: '2147483647', pointerEvents: 'none',
    transform: 'translate(-100px,-100px)', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.35))',
  });
  document.body.append(c);
  addEventListener('mousemove', (e) => (c.style.transform = `translate(${e.clientX - 4}px,${e.clientY - 2}px)`), { passive: true });
});

const mapTop = await page.evaluate(() => {
  const el = document.querySelector('[data-map-section]');
  return el.getBoundingClientRect().top + scrollY;
});

const frames = [];
const cdp = await page.createCDPSession();
cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
  frames.push({ data, t: metadata.timestamp });
  cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});

let mouse = { x: 720, y: 520 };
await page.mouse.move(mouse.x, mouse.y);
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: VIEWPORT.width, maxHeight: VIEWPORT.height });

// хиро: курсор по плавной «восьмёрке», чтобы слои уходили во все стороны
{
  const start = Date.now();
  const DUR = 6000;
  while (Date.now() - start < DUR) {
    const k = (Date.now() - start) / DUR;
    const a = k * Math.PI * 2;
    const fade = Math.min(1, k * 4); // плавно разгоняемся из центра
    mouse = { x: 720 + Math.sin(a) * 520 * fade, y: 470 + Math.sin(a * 2) * 230 * fade };
    await page.mouse.move(mouse.x, mouse.y);
    await sleep(16);
  }
}

// док иконок под поиском: иконки увеличиваются под курсором, проводим слева направо
{
  const dock = await page.evaluate(() => {
    const el = document.querySelector('.dock__bar');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x1: r.left + 40, x2: r.right - 40, y: r.top + r.height / 2 };
  });
  if (dock) {
    for (const [target, dur] of [[{ x: dock.x1, y: dock.y }, 700], [{ x: dock.x2, y: dock.y }, 2200]]) {
      const s = { ...mouse };
      const start = Date.now();
      while (Date.now() - start < dur) {
        const k = ease(Math.min(1, (Date.now() - start) / dur));
        mouse = { x: s.x + (target.x - s.x) * k, y: s.y + (target.y - s.y) * k };
        await page.mouse.move(mouse.x, mouse.y);
        await sleep(16);
      }
    }
  }
}

// прокрутка к карте, курсор едет вместе с ней
{
  const from = 0;
  const to = mapTop - 80; // под шапкой
  const startMouse = { ...mouse };
  const start = Date.now();
  const DUR = 1400;
  while (Date.now() - start < DUR) {
    const k = ease(Math.min(1, (Date.now() - start) / DUR));
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), from + (to - from) * k);
    mouse = { x: startMouse.x + (980 - startMouse.x) * k, y: startMouse.y + (600 - startMouse.y) * k };
    await page.mouse.move(mouse.x, mouse.y);
    await sleep(16);
  }
}

// карта: ждём, пока пройдёт волна, курсор медленно дрейфует (на карте есть подсветка под ним)
{
  const start = Date.now();
  const DUR = 6800;
  const base = { ...mouse };
  while (Date.now() - start < DUR) {
    const a = ((Date.now() - start) / DUR) * Math.PI;
    mouse = { x: base.x - Math.sin(a) * 260, y: base.y - Math.sin(a * 0.5) * 120 };
    await page.mouse.move(mouse.x, mouse.y);
    await sleep(33);
  }
}

await cdp.send('Page.stopScreencast');
await page.close();

const span = frames.at(-1).t - frames[0].t;
console.log(`кадров ${frames.length} за ${span.toFixed(1)} с (~${(frames.length / span).toFixed(0)} к/с)`);

// Скринкаст отдаёт кадры неравномерно и местами чаще 60 в секунду. Приводим к ровным
// 30 к/с: на каждый тик берём последний кадр, пришедший к этому моменту.
const FPS = 30;
const timeline = [];
for (let t = 0, i = 0; t <= span; t += 1 / FPS) {
  while (i + 1 < frames.length && frames[i + 1].t - frames[0].t <= t) i++;
  timeline.push(i);
}

// ── 3. Сборка MP4 ────────────────────────────────────────────────────────
// WebCodecs кодирует кадры по одному с точными метками времени (не в реальном времени,
// поэтому видео не растягивается), а mp4-muxer пишет обычный MP4 с длительностью
// и индексом в начале файла. Раньше здесь был MediaRecorder, но он пишет
// фрагментированный MP4 с нулевой длительностью в заголовке: Chrome это прощает,
// а Safari и Firefox не находят конец ролика, и loop не срабатывает.
const enc = await browser.newPage();
await enc.goto(url, { waitUntil: 'domcontentloaded' }); // WebCodecs работает только в защищённом контексте, localhost подходит
await enc.addScriptTag({ path: path.join(root, 'node_modules', 'mp4-muxer', 'build', 'mp4-muxer.js') });
await enc.exposeFunction('getFrame', (i) => frames[timeline[i]]?.data ?? null);
const b64 = await enc.evaluate(
  async ({ count, fps, out, bitrate }) => {
    const { Muxer, ArrayBufferTarget } = window.Mp4Muxer;

    const decode = async (i) => {
      const b = await window.getFrame(i);
      const blob = await (await fetch(`data:image/jpeg;base64,${b}`)).blob();
      return createImageBitmap(blob, { resizeWidth: out.width, resizeHeight: out.height, resizeQuality: 'high' });
    };

    let config = null;
    for (const codec of ['avc1.4d002a', 'avc1.42002a']) {
      const c = { codec, width: out.width, height: out.height, bitrate, framerate: fps, avc: { format: 'avc' } };
      if ((await VideoEncoder.isConfigSupported(c)).supported) { config = c; break; }
    }
    if (!config) throw new Error('H.264 в WebCodecs недоступен');

    const muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: { codec: 'avc', width: out.width, height: out.height, frameRate: fps },
      fastStart: 'in-memory',
    });
    let failure = null;
    const encoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => (failure = e),
    });
    encoder.configure(config);

    const step = 1e6 / fps;
    for (let i = 0; i < count; i++) {
      const bmp = await decode(i);
      const frame = new VideoFrame(bmp, { timestamp: Math.round(i * step), duration: Math.round(step) });
      // ключевой кадр раз в 2 секунды и обязательно на первом — с него начинается каждый круг
      encoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
      frame.close();
      bmp.close();
      if (failure) throw failure;
      while (encoder.encodeQueueSize > 8) await new Promise((r) => setTimeout(r, 5));
    }
    await encoder.flush();
    if (failure) throw failure;
    muxer.finalize();

    const buf = new Uint8Array(muxer.target.buffer);
    let s = '';
    for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return { b64: btoa(s), codec: config.codec };
  },
  { count: timeline.length, fps: FPS, out: OUT, bitrate: BITRATE },
);

const file = path.join(outDir, 'zeparts.mp4');
const bytes = Buffer.from(b64.b64, 'base64');
await writeFile(file, bytes);
console.log(`ok  видео  ->  public/work/zeparts.mp4  (${(bytes.length / 1024 / 1024).toFixed(1)} МБ, ${b64.codec}, ${(timeline.length / FPS).toFixed(1)} с)`);

await browser.close();
