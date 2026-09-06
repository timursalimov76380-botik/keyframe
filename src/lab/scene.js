/**
 * Общая сцена песочницы. Свет, камера и блум одинаковы для всех вариантов —
 * различается только то, что вариант собирает в build().
 */
import {
  ACESFilmicToneMapping,
  AmbientLight,
  DirectionalLight,
  Group,
  PerspectiveCamera,
  PointLight,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';
import { createNoise4D } from 'simplex-noise';
import { BloomEffect, EffectComposer, EffectPass, RenderPass } from 'postprocessing';

const noise4D = createNoise4D();

function makeFbm(octaves) {
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

export function createLabScene(canvas, { octaves = 3, dpr = 1.5, lite = false, keepBuffer = false } = {}) {
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    // Нужно только вспомогательному рендереру миниатюр: без этого содержимое
    // буфера пропадает раньше, чем его успевают скопировать в 2D-канвас
    preserveDrawingBuffer: keepBuffer,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  const group = new Group();
  scene.add(group);

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

  const bloom = new BloomEffect({
    intensity: 1.25,
    luminanceThreshold: 0.28,
    luminanceSmoothing: 0.4,
    mipmapBlur: true,
    radius: 0.76,
  });
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new EffectPass(camera, bloom));

  const buildCtx = { fbm: makeFbm(octaves), lite };
  const params = { amp: 1, freq: 1.45, speed: 0.14, bloom: 1.25 };
  const frameCtx = { t: 0, amp: 1, freq: 1.45 };

  let current = null;
  let raf = 0;
  let running = false;
  let time = 12.5;
  let last = 0;

  function disposeCurrent() {
    if (!current) return;
    group.remove(current.object);
    current.object.traverse?.((node) => {
      node.geometry?.dispose?.();
      if (Array.isArray(node.material)) node.material.forEach((m) => m.dispose());
      else node.material?.dispose?.();
    });
    current = null;
  }

  function tick() {
    frameCtx.t = time * params.speed;
    frameCtx.amp = params.amp;
    frameCtx.freq = params.freq;
    current?.update?.(frameCtx);
  }

  function draw() {
    bloom.intensity = params.bloom;
    composer.render();
  }

  function setSize(w, h) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dpr));
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function resize() {
    // Для канваса вне документа прямоугольник нулевой — размер нужно задавать явно
    const rect = canvas.getBoundingClientRect();
    setSize(Math.max(1, Math.round(rect.width)), Math.max(1, Math.round(rect.height)));
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000 || 0, 0.05);
    last = now;
    time += dt;

    tick();
    group.rotation.y = time * 0.11;
    group.rotation.x = Math.sin(time * 0.16) * 0.09;

    draw();
  }

  return {
    setVariant(variant) {
      disposeCurrent();
      current = variant.build(buildCtx);
      group.add(current.object);
      group.rotation.set(0.14, -0.5, 0.06);
      tick();
      draw();
    },
    setParam(key, value) {
      params[key] = value;
      // Пульт инициализируется раньше, чем выбран вариант
      if (!current || running) return;
      tick();
      draw();
    },
    getParams: () => ({ ...params }),
    renderOnce() {
      if (!current) return;
      tick();
      group.rotation.set(0.14, -0.5, 0.06);
      draw();
    },
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    get running() {
      return running;
    },
    resize,
    setSize,
    domElement: renderer.domElement,
    dispose() {
      this.stop();
      disposeCurrent();
      composer.dispose();
      renderer.dispose();
    },
  };
}
