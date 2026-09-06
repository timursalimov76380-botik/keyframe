/**
 * Хиро-объект: икосаэдр, вершины которого смещаются 4D-симплекс-шумом.
 * Четвёртое измерение — время, поэтому поверхность «дышит» непрерывно,
 * без склейки петли: любой случайный стоп-кадр выглядит одинаково законченным
 * (тест замороженного кадра, принцип 10.5).
 */
import {
  ACESFilmicToneMapping,
  AmbientLight,
  Color,
  DirectionalLight,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
  WireframeGeometry,
} from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createNoise4D } from 'simplex-noise';
import { BloomEffect, EffectComposer, EffectPass, RenderPass } from 'postprocessing';

const PROFILES = {
  // detail 32 → ~10 900 уникальных вершин после склейки: шум считается на CPU,
  // поэтому важна именно индексированная геометрия, а не 100k дублей
  full: { detail: 32, octaves: 3, bloom: 1, maxDpr: 2, antialias: true, wireframe: true },
  // Блум оставлен и на слабом профиле, но в половинном разрешении: без него объект
  // теряет свечение и перестаёт быть источником акцентного цвета для всей страницы
  lite: { detail: 14, octaves: 2, bloom: 0.5, maxDpr: 1.5, antialias: false, wireframe: false },
};

const COLOR_DEEP = new Color('#04231f');
const COLOR_MID = new Color('#0a7364');
const COLOR_CREST = new Color('#7dffe9');

/**
 * Выбирает профиль по возможностям устройства и настройкам пользователя.
 */
export function pickQuality() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const narrow = window.innerWidth < 820;
  const weak =
    (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;

  return {
    profile: narrow || weak ? 'lite' : 'full',
    // При reduce-motion сцена всё равно строится и рендерится — но ровно один кадр.
    // Статичная картинка-заглушка тут была бы хуже: пропала бы глубина и блум.
    animate: !reduced,
  };
}

function createFbm(octaves) {
  const noise4D = createNoise4D();
  return (x, y, z, w) => {
    let amp = 1;
    let freq = 1;
    let sum = 0;
    let norm = 0;
    for (let o = 0; o < octaves; o += 1) {
      sum += amp * noise4D(x * freq, y * freq, z * freq, w * freq);
      norm += amp;
      amp *= 0.5;
      freq *= 2.05;
    }
    return sum / norm;
  };
}

export function createHeroObject(canvas, { profile = 'full', animate = true } = {}) {
  const cfg = PROFILES[profile] ?? PROFILES.full;
  const fbm = createFbm(cfg.octaves);

  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: cfg.antialias,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 100);
  // Объект занимает ~64% кадра: остаток нужен, чтобы круглая CSS-маска на канвасе
  // срезала квадратные края (следствие непрозрачного вывода EffectPass), не задев саму форму
  camera.position.set(0, 0, 6);

  const group = new Group();
  scene.add(group);

  // Индексируем геометрию: без этого IcosahedronGeometry отдаёт несшитые треугольники
  // и шум пришлось бы считать примерно для 100 000 вершин вместо 11 000.
  const geometry = mergeVertices(new IcosahedronGeometry(1, cfg.detail));
  const position = geometry.attributes.position;
  const count = position.count;

  // Исходные направления вершин — от них считаем смещение каждый кадр
  const base = new Float32Array(count * 3);
  base.set(position.array);

  geometry.setAttribute('color', new Float32BufferAttribute(new Float32Array(count * 3), 3));
  const colorAttr = geometry.attributes.color;

  const material = new MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.34,
    metalness: 0.62,
    envMapIntensity: 1,
  });
  const mesh = new Mesh(geometry, material);
  group.add(mesh);

  // Тонкий каркас чуть большего радиуса — «резной» слой поверх органики.
  // Он же держит силуэт объекта на стоп-кадре, когда гребни уходят в тень.
  let wire = null;
  if (cfg.wireframe) {
    wire = new LineSegments(
      new WireframeGeometry(new IcosahedronGeometry(1.34, 1)),
      new LineBasicMaterial({ color: 0x1cd9c0, transparent: true, opacity: 0.1 }),
    );
    group.add(wire);
  }

  scene.add(new AmbientLight(0x1d4a45, 1.1));

  const key = new DirectionalLight(0xdfffff, 2.6);
  key.position.set(2.4, 3.1, 2.2);
  scene.add(key);

  const rim = new PointLight(0x00e0c0, 26, 14, 2);
  rim.position.set(-2.6, -1.2, -2.4);
  scene.add(rim);

  const fill = new PointLight(0x0a6f9b, 9, 16, 2);
  fill.position.set(3.1, -2.2, 1.6);
  scene.add(fill);

  let composer = null;
  if (cfg.bloom) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(
      new EffectPass(
        camera,
        new BloomEffect({
          intensity: 1.25,
          luminanceThreshold: 0.28,
          luminanceSmoothing: 0.4,
          mipmapBlur: true,
          radius: 0.76,
          resolutionScale: cfg.bloom,
        }),
      ),
    );
  }

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let raf = 0;
  let running = false;
  let time = 0;
  let last = 0;

  function deform(t) {
    const pos = position.array;
    const col = colorAttr.array;
    const tmp = new Color();

    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3;
      const bx = base[i3];
      const by = base[i3 + 1];
      const bz = base[i3 + 2];

      const n = fbm(bx * 1.45, by * 1.45, bz * 1.45, t);
      // Гребневой шум: |n| даёт острые складки вместо ровных волн — «резаная» поверхность
      const ridge = (1 - Math.abs(n)) ** 2.4;
      const scale = 1 + n * 0.17 + ridge * 0.15;

      pos[i3] = bx * scale;
      pos[i3 + 1] = by * scale;
      pos[i3 + 2] = bz * scale;

      // Гребни светятся, впадины уходят в почти чёрный — блум цепляет только вершины складок
      if (ridge < 0.55) {
        tmp.lerpColors(COLOR_DEEP, COLOR_MID, ridge / 0.55);
      } else {
        tmp.lerpColors(COLOR_MID, COLOR_CREST, (ridge - 0.55) / 0.45);
      }
      col[i3] = tmp.r;
      col[i3 + 1] = tmp.g;
      col[i3 + 2] = tmp.b;
    }

    position.needsUpdate = true;
    colorAttr.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  function draw() {
    if (composer) composer.render();
    else renderer.render(scene, camera);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cfg.maxDpr));
    renderer.setSize(w, h, false);
    composer?.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000 || 0, 0.05);
    last = now;
    time += dt;

    // Медленное «дыхание»: за полный оборот форма успевает смениться пару раз
    deform(time * 0.14);

    pointer.x += (pointer.tx - pointer.x) * 0.045;
    pointer.y += (pointer.ty - pointer.y) * 0.045;

    group.rotation.y = time * 0.11 + pointer.x * 0.4;
    group.rotation.x = Math.sin(time * 0.16) * 0.09 + pointer.y * 0.28;
    if (wire) wire.rotation.y = -time * 0.06;

    draw();
  }

  return {
    /** Первый кадр: собирает форму в осмысленном состоянии, а не в идеальной сфере */
    init() {
      resize();
      // Стартовое время не нулевое — при t=0 шум даёт слишком ровную поверхность,
      // и «нулевой кадр» выглядел бы как обычный шар
      time = 12.5;
      deform(time * 0.14);
      group.rotation.set(0.14, -0.5, 0.06);
      draw();
    },
    start() {
      if (running || !animate) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    resize,
    setPointer(nx, ny) {
      pointer.tx = nx;
      pointer.ty = ny;
    },
    get animated() {
      return animate;
    },
    dispose() {
      this.stop();
      geometry.dispose();
      material.dispose();
      wire?.geometry.dispose();
      wire?.material.dispose();
      composer?.dispose();
      renderer.dispose();
    },
  };
}
