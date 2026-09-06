/**
 * Общие кирпичи для вариантов формы: цветовая раскладка, материалы
 * и обёртка над деформируемой поверхностью.
 */
import {
  BufferAttribute,
  Color,
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshStandardMaterial,
} from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const DEEP = new Color('#04231f');
const MID = new Color('#0a7364');
const CREST = new Color('#7dffe9');

/** 0 — впадина, 1 — светящийся гребень. Одна раскладка на все варианты, чтобы сравнивалась форма. */
export function ramp(value, out) {
  const c = value < 0 ? 0 : value > 1 ? 1 : value;
  return c < 0.55
    ? out.lerpColors(DEEP, MID, c / 0.55)
    : out.lerpColors(MID, CREST, (c - 0.55) / 0.45);
}

export function crestMaterial(opts = {}) {
  return new MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.32,
    metalness: 0.62,
    ...opts,
  });
}

export function edgeMaterial(opacity = 0.55) {
  return new LineBasicMaterial({ color: 0x5cffe4, transparent: true, opacity });
}

export function edgesOf(geometry, opacity) {
  return new LineSegments(new EdgesGeometry(geometry), edgeMaterial(opacity));
}

/**
 * Поверхность, вершины которой смещаются вдоль нормалей.
 *
 * deform(x, y, z, ctx, out) пишет в out[0] смещение, в out[1] — яркость гребня.
 * Через массив, а не через возвращаемый объект: функция зовётся десятки тысяч раз
 * за кадр, и лишние аллокации тут дают заметный мусор для сборщика.
 */
export function surface(rawGeometry, { deform, material = {}, index = true } = {}) {
  const geometry = index ? mergeVertices(rawGeometry) : rawGeometry;
  geometry.computeVertexNormals();

  const position = geometry.attributes.position;
  const count = position.count;
  const base = Float32Array.from(position.array);
  const normal = Float32Array.from(geometry.attributes.normal.array);

  geometry.setAttribute('color', new BufferAttribute(new Float32Array(count * 3), 3));
  const color = geometry.attributes.color;

  const mesh = new Mesh(geometry, crestMaterial(material));
  const tmp = new Color();
  const out = [0, 0];

  function update(ctx) {
    const p = position.array;
    const c = color.array;

    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3;
      const bx = base[i3];
      const by = base[i3 + 1];
      const bz = base[i3 + 2];

      deform(bx, by, bz, ctx, out);

      p[i3] = bx + normal[i3] * out[0];
      p[i3 + 1] = by + normal[i3 + 1] * out[0];
      p[i3 + 2] = bz + normal[i3 + 2] * out[0];

      ramp(out[1], tmp);
      c[i3] = tmp.r;
      c[i3 + 1] = tmp.g;
      c[i3 + 2] = tmp.b;
    }

    position.needsUpdate = true;
    color.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  return { mesh, geometry, update };
}
