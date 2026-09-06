/**
 * Варианты формы хиро-объекта.
 *
 * Перебирается СИЛУЭТ, а не рисунок на поверхности: в прошлой версии базовой
 * геометрией везде был икосаэдр, менялась только функция смещения — и все восемь
 * вариантов читались как один и тот же шар с разной текстурой.
 *
 * Свет, камера, блум и цветовая раскладка общие, чтобы сравнивалась именно форма.
 * build(ctx) возвращает { object, update(ctx) }; update необязателен.
 */
import {
  BoxGeometry,
  Color,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  OctahedronGeometry,
  PlaneGeometry,
  TorusGeometry,
  TorusKnotGeometry,
} from 'three';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';
import { crestMaterial, edgesOf, ramp, surface } from './toolkit.js';

export const VARIANTS = [
  /* ── 1. Клякса ─────────────────────────────────────────────
     Единственный вариант, где силуэт меняется сам по себе: поле метасфер,
     пересобираемое каждый кадр. Доли сходятся, сливаются и снова расходятся —
     смещением вершин шара такое не изобразить, там силуэт всегда остаётся шаром. */
  {
    id: 'blob',
    name: 'Клякса',
    note: 'Метасферы в поле marching cubes: доли перетекают друг в друга, сливаются и разделяются. Силуэт всё время разный.',
    build({ lite }) {
      const material = crestMaterial({ roughness: 0.18, metalness: 0.78 });
      const blob = new MarchingCubes(lite ? 28 : 52, material, true, true, 160000);
      blob.isolation = 65;
      blob.scale.setScalar(1.95);

      // Каждая капля живёт по своим частотам — узор не повторяется на глаз
      const seeds = [
        { r: 0.17, a: 0.51, b: 0.37, c: 0.29, phase: 0.0, power: 1.0 },
        { r: 0.19, a: -0.33, b: 0.47, c: 0.41, phase: 1.7, power: 0.92 },
        { r: 0.14, a: 0.44, b: -0.29, c: 0.53, phase: 3.1, power: 1.06 },
        { r: 0.2, a: 0.27, b: 0.61, c: -0.35, phase: 4.4, power: 0.85 },
        { r: 0.13, a: -0.58, b: 0.31, c: 0.44, phase: 5.6, power: 1.12 },
        { r: 0.18, a: 0.39, b: -0.52, c: 0.33, phase: 2.4, power: 0.95 },
      ];

      // Сила подобрана так, чтобы капли перекрывались и сливались в одно тело.
      // При меньшей они остаются отдельными шариками, при большей — сплошным комом.
      const STRENGTH = 1.15 / ((Math.sqrt(seeds.length) - 1) / 4 + 1);
      const tint = new Color();

      return {
        object: blob,
        update({ t, amp }) {
          blob.reset();
          const spread = 0.85 + amp * 0.3;

          for (let i = 0; i < seeds.length; i += 1) {
            const s = seeds[i];
            const x = 0.5 + Math.cos(t * s.a + s.phase) * s.r * spread;
            const y = 0.5 + Math.sin(t * s.b + s.phase * 1.3) * s.r * spread;
            const z = 0.5 + Math.sin(t * s.c + s.phase * 0.7) * s.r * spread;

            // Пульсация силы: капля то набухает, то почти растворяется в соседях
            const pulse = 0.82 + 0.18 * Math.sin(t * 0.9 + i);
            ramp(0.55 + 0.4 * Math.sin(t * 0.6 + i * 1.1), tint);
            blob.addBall(x, y, z, STRENGTH * s.power * pulse, 12, tint);
          }

          blob.update();
        },
      };
    },
  },

  /* ── 2. Ромб ───────────────────────────────────────────── */
  {
    id: 'diamond',
    name: 'Ромб',
    note: 'Октаэдр с плоскими гранями и подсвеченными рёбрами — та же фигура, что в логотипе и на таймлайне анимации.',
    build() {
      const group = new Group();
      const geo = new OctahedronGeometry(1.3, 0);

      const { mesh, update } = surface(geo, {
        index: false,
        material: { flatShading: true, roughness: 0.24, metalness: 0.76 },
        deform(x, y, z, ctx, out) {
          out[0] = 0;
          // Ярче к вершинам по вертикали — грани читаются как огранка
          out[1] = 0.2 + Math.abs(y / 1.3) * 0.78;
        },
      });

      group.add(mesh);
      group.add(edgesOf(geo, 0.7));

      return {
        object: group,
        update(ctx) {
          update(ctx);
          const pulse = 1 + Math.sin(ctx.t * 1.1) * 0.03 * ctx.amp;
          group.scale.setScalar(pulse);
        },
      };
    },
  },

  /* ── 3. Стопка кадров ──────────────────────────────────── */
  {
    id: 'frames',
    name: 'Стопка кадров',
    note: 'Семь тонких пластин, развёрнутых веером. Буквальная отсылка к кадрам на монтажной линейке.',
    build() {
      const group = new Group();
      // Наклон обязателен: строго горизонтальные пластины камера видит с торца,
      // грани не ловят свет и стопка читается как россыпь линий
      group.rotation.x = 0.42;

      const plateMat = new MeshStandardMaterial({
        color: 0x0f4139,
        roughness: 0.24,
        metalness: 0.86,
      });

      const plates = [];
      const N = 7;
      for (let i = 0; i < N; i += 1) {
        const k = i / (N - 1);
        const shrink = 1 - Math.abs(k - 0.5) * 0.7;
        const geo = new BoxGeometry(1.75 * shrink, 0.07, 1.75 * shrink);

        const mesh = new Mesh(geo, plateMat);
        const edges = edgesOf(geo, 0.32);
        const baseY = (k - 0.5) * 1.35;
        const baseRot = k * 0.95;

        mesh.position.y = baseY;
        mesh.rotation.y = baseRot;
        edges.position.y = baseY;
        edges.rotation.y = baseRot;

        group.add(mesh, edges);
        plates.push({ mesh, edges, baseY, baseRot, i });
      }

      return {
        object: group,
        update({ t, amp }) {
          for (const p of plates) {
            const rot = p.baseRot + Math.sin(t * 0.7 + p.i * 0.5) * 0.18 * amp;
            const y = p.baseY + Math.sin(t * 0.9 + p.i * 0.6) * 0.035 * amp;
            p.mesh.rotation.y = rot;
            p.edges.rotation.y = rot;
            p.mesh.position.y = y;
            p.edges.position.y = y;
          }
        },
      };
    },
  },

  /* ── 4. Кольцо ─────────────────────────────────────────── */
  {
    id: 'ring',
    name: 'Кольцо',
    note: 'Тор с рябью по поверхности. Единственный вариант с дыркой — сквозь неё видно буквы за объектом.',
    build({ fbm }) {
      const group = new Group();
      const { mesh, update } = surface(new TorusGeometry(0.95, 0.17, 24, 200), {
        material: { roughness: 0.26, metalness: 0.74 },
        deform(x, y, z, ctx, out) {
          const n = fbm(x * ctx.freq * 2.1, y * ctx.freq * 2.1, z * ctx.freq * 2.1, ctx.t);
          const ridge = (1 - Math.abs(n)) ** 3;
          out[0] = (n * 0.03 + ridge * 0.05) * ctx.amp;
          out[1] = ridge;
        },
      });

      mesh.rotation.set(1.0, 0, 0.35);
      group.add(mesh);
      return { object: group, update };
    },
  },

  /* ── 5. Кристалл ───────────────────────────────────────── */
  {
    id: 'crystal',
    name: 'Кристалл',
    note: 'Вытянутый по вертикали октаэдр с гранями. Высокий узкий силуэт — противоположность шару.',
    build({ fbm }) {
      const group = new Group();
      const geo = new OctahedronGeometry(1, 1);

      const { mesh, update } = surface(geo, {
        index: false,
        material: { flatShading: true, roughness: 0.2, metalness: 0.8 },
        deform(x, y, z, ctx, out) {
          const n = fbm(x * ctx.freq, y * ctx.freq, z * ctx.freq, ctx.t);
          out[0] = n * 0.08 * ctx.amp;
          out[1] = 0.25 + Math.abs(y) * 0.7 + n * 0.12;
        },
      });

      mesh.scale.set(0.62, 1.62, 0.62);
      group.add(mesh);

      const edges = edgesOf(geo, 0.4);
      edges.scale.copy(mesh.scale);
      group.add(edges);

      return { object: group, update };
    },
  },

  /* ── 6. Рельеф ─────────────────────────────────────────── */
  {
    id: 'relief',
    name: 'Рельеф',
    note: 'Наклонённая плоскость с волнами. Силуэт прямоугольный, объект читается как пласт, а не как тело.',
    build({ fbm, lite }) {
      const group = new Group();
      const seg = lite ? 60 : 150;

      const { mesh, update } = surface(new PlaneGeometry(2.9, 2.9, seg, seg), {
        material: { roughness: 0.34, metalness: 0.6, side: 2 },
        deform(x, y, z, ctx, out) {
          const n = fbm(x * ctx.freq * 0.9, y * ctx.freq * 0.9, 0.4, ctx.t);
          const ridge = (1 - Math.abs(n)) ** 2.6;
          out[0] = (n * 0.26 + ridge * 0.12) * ctx.amp;
          out[1] = ridge * 0.75 + (n + 1) * 0.12;
        },
      });

      mesh.rotation.set(-1.02, 0, 0.22);
      group.add(mesh);
      return { object: group, update };
    },
  },

  /* ── 7. Проволочный узел ───────────────────────────────── */
  {
    id: 'wire',
    name: 'Проволочный узел',
    note: 'Тот же тор-узел, но трубка втрое тоньше. Толстая с органическим шумом выглядела как внутренности — тонкая читается как гнутая проволока.',
    build({ fbm }) {
      const { mesh, update } = surface(new TorusKnotGeometry(0.68, 0.075, 420, 16), {
        material: { roughness: 0.18, metalness: 0.85 },
        deform(x, y, z, ctx, out) {
          const n = fbm(x * ctx.freq * 2.4, y * ctx.freq * 2.4, z * ctx.freq * 2.4, ctx.t);
          out[0] = n * 0.02 * ctx.amp;
          out[1] = 0.45 + n * 0.45;
        },
      });
      return { object: mesh, update };
    },
  },

  /* ── 8. Резные гребни (контроль) ───────────────────────── */
  {
    id: 'ridged',
    name: 'Резные гребни',
    note: 'То, что стоит на сайте сейчас. Оставлен для сравнения — остальные варианты меряются с ним.',
    build({ fbm, lite }) {
      const { mesh, update } = surface(new IcosahedronGeometry(1, lite ? 14 : 32), {
        material: { roughness: 0.34, metalness: 0.62 },
        deform(x, y, z, ctx, out) {
          const n = fbm(x * ctx.freq, y * ctx.freq, z * ctx.freq, ctx.t);
          const ridge = (1 - Math.abs(n)) ** 2.4;
          out[0] = (n * 0.17 + ridge * 0.15) * ctx.amp;
          out[1] = ridge;
        },
      });
      return { object: mesh, update };
    },
  },
];
