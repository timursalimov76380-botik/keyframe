/**
 * Видео и превью кейса Zeparts для секции «Работы».
 * Сайт передан заказчику архивом, публичной ссылки нет, поэтому снимаем с локального
 * превью проекта (в папке ZeParts: .venv/Scripts/python tools/build.py --serve → :8080).
 * node scripts/capture-zeparts.mjs [url]
 *
 * ffmpeg не нужен: кадры берём CDP-скринкастом, а в MP4 их собирает сам Chrome —
 * кадры проигрываются на canvas в исходном темпе и пишутся через MediaRecorder.
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

// Скринкаст отдаёт кадры неравномерно и местами чаще 60 в секунду — кодировщик
// в реальном времени за таким не успевает и видео растягивается. Прореживаем
// до ровных 30 к/с: на каждый тик берём последний кадр, пришедший к этому моменту.
const FPS = 30;
const timeline = [];
for (let t = 0, i = 0; t <= span; t += 1 / FPS) {
  while (i + 1 < frames.length && frames[i + 1].t - frames[0].t <= t) i++;
  timeline.push(i);
}

// ── 3. Сборка MP4 ────────────────────────────────────────────────────────
const enc = await browser.newPage();
await enc.exposeFunction('getFrame', (i) => frames[timeline[i]]?.data ?? null);
const b64 = await enc.evaluate(
  async ({ count, fps, out, bitrate }) => {
    const canvas = document.createElement('canvas');
    canvas.width = out.width;
    canvas.height = out.height;
    document.body.append(canvas);
    const ctx = canvas.getContext('2d');

    const decode = async (i) => {
      const b = await window.getFrame(i);
      const blob = await (await fetch(`data:image/jpeg;base64,${b}`)).blob();
      return createImageBitmap(blob, { resizeWidth: out.width, resizeHeight: out.height, resizeQuality: 'high' });
    };

    const mime = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.4d002a')
      ? 'video/mp4;codecs=avc1.4d002a'
      : 'video/mp4';
    const stream = canvas.captureStream(fps);
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bitrate });
    const chunks = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const done = new Promise((r) => (rec.onstop = r));

    let next = decode(0);
    ctx.drawImage(await next, 0, 0);
    rec.start(1000);
    const t0 = performance.now();
    for (let i = 0; i < count; i++) {
      const bmp = await next;
      if (i + 1 < count) next = decode(i + 1);
      const wait = (i * 1000) / fps - (performance.now() - t0);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      ctx.drawImage(bmp, 0, 0);
      bmp.close();
    }
    await new Promise((r) => setTimeout(r, 300));
    rec.stop();
    await done;

    const buf = new Uint8Array(await new Blob(chunks, { type: mime }).arrayBuffer());
    let s = '';
    for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return btoa(s);
  },
  { count: timeline.length, fps: FPS, out: OUT, bitrate: BITRATE },
);

const file = path.join(outDir, 'zeparts.mp4');
await writeFile(file, Buffer.from(b64, 'base64'));
console.log(`ok  видео  ->  public/work/zeparts.mp4  (${(Buffer.byteLength(b64, 'base64') / 1024 / 1024).toFixed(1)} МБ)`);

await browser.close();
