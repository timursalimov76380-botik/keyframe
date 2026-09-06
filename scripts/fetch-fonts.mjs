/**
 * Скачивает шрифты с Google Fonts и кладёт их локально в public/fonts.
 * Служебный скрипт, запускается вручную: node scripts/fetch-fonts.mjs
 *
 * Зачем локально, а не через CDN: сайт двуязычный и целится в том числе в РФ —
 * лишняя зависимость от стороннего домена на критическом пути рендера тут не нужна.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fontDir = path.join(root, 'public', 'fonts');
const cssOut = path.join(root, 'src', 'styles', 'fonts.css');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const FAMILIES = [
  { name: 'Unbounded', url: 'https://fonts.googleapis.com/css2?family=Unbounded:wght@400..900&display=swap' },
  { name: 'Manrope', url: 'https://fonts.googleapis.com/css2?family=Manrope:wght@300..800&display=swap' },
  { name: 'JetBrains Mono', url: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400..600&display=swap' },
];

// Греческий и вьетнамский на этом сайте не нужны — не тащим лишние килобайты
const KEEP_SUBSETS = new Set(['cyrillic', 'cyrillic-ext', 'latin', 'latin-ext']);

await mkdir(fontDir, { recursive: true });

const chunks = ['/* Шрифты выкачаны scripts/fetch-fonts.mjs — править вручную не нужно */\n'];

for (const family of FAMILIES) {
  const res = await fetch(family.url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${family.name}: ${res.status}`);
  const css = await res.text();

  // Google отдаёт блоки вида: /* cyrillic */ @font-face { ... }
  const blocks = css.split('/*').slice(1);
  for (const block of blocks) {
    const subset = block.slice(0, block.indexOf('*/')).trim();
    if (!KEEP_SUBSETS.has(subset)) continue;

    const face = block.slice(block.indexOf('@font-face'));
    const remote = face.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
    if (!remote) continue;

    const slug = `${family.name.toLowerCase().replace(/\s+/g, '-')}-${subset}.woff2`;
    const bin = await (await fetch(remote, { headers: { 'User-Agent': UA } })).arrayBuffer();
    await writeFile(path.join(fontDir, slug), Buffer.from(bin));

    chunks.push(face.replace(/url\(https:[^)]+\.woff2\)/, `url('/fonts/${slug}')`).trim() + '\n');
    console.log(`ok  ${family.name} / ${subset}  ->  ${slug}  (${Math.round(bin.byteLength / 1024)} KB)`);
  }
}

await writeFile(cssOut, chunks.join('\n'), 'utf8');
console.log(`\nwritten ${path.relative(root, cssOut)}`);
