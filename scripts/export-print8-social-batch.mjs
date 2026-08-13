/**
 * Resize full AI social images to exact export sizes (v7–v9 batches).
 * Usage: PRINT8_BATCH=v7|v8|v9|v10|v10r node scripts/export-print8-social-batch.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { resolveCursorAssetsDir } from './lib/cursor-assets.mjs';

const home = process.env.USERPROFILE ?? process.env.HOME ?? '';
const BATCH = process.env.PRINT8_BATCH ?? 'v7';

const BATCH_SERVICES = {
  v7: ['hoodie', 'cap', 'bodysuit', 'puzzle'],
  v8: ['thermos', 'magnet', 'photo-stone', 'plaque'],
  v9: ['a3-posters', 'menus', 'laminating', 'thesis'],
  v10: ['gift-box', 'gift-set', 'microfiber', 'cup'],
  v10r: ['gift-case', 'cloth-bundle', 'microfiber', 'cup'],
  v11: ['wedding', 'birthday', 'polo', 'puzzle'],
  v12: ['thermos', 'magnet', 'mug-box', 'mug'],
  v13: [
    'tshirt',
    'hoodie',
    'cap',
    'bodysuit',
    'bag',
    'mug-heart',
    'mug-frosted',
    'magnet-heart',
    'magnet-glass',
    'magnet-hardboard',
    'plaque',
    'puzzle-heart',
  ],
  v14: [
    'mug',
    'cards',
    'bag',
    'tshirt',
    'hoodie',
    'cup',
    'thermos',
    'polo',
    'magnet',
    'mug-heart',
    'microfiber',
    'gift-case',
  ],
  v15: [
    'hoodie',
    'mug',
    'cup',
    'mug-heart',
    'tshirt',
    'bag',
    'cards',
    'thermos',
    'polo',
    'magnet',
    'cap',
  ],
};

const SUFFIXES = [
  { suffix: 'square', w: 1080, h: 1080, position: 'bottom' },
  { suffix: 'portrait', w: 1080, h: 1350, position: 'bottom' },
  { suffix: 'story', w: 1080, h: 1920, position: 'bottom' },
];

const FORMAT_DIRS = {
  square: 'square-1080x1080',
  portrait: 'portrait-1080x1350',
  story: 'stories-1080x1920',
};

const OUT = path.resolve(
  process.env.PRINT8_SERVICES_OUT ??
    path.join(home, 'Desktop', `print8-social-services-${BATCH}`),
);
const RAW = path.resolve(process.env.PRINT8_SERVICES_RAW ?? resolveCursorAssetsDir());

async function main() {
  const services = BATCH_SERVICES[BATCH];
  if (!services) {
    throw new Error(`Unknown batch: ${BATCH}. Use v7-v15 or v10r.`);
  }

  for (const dir of Object.values(FORMAT_DIRS)) {
    await fs.mkdir(path.join(OUT, dir), { recursive: true });
  }
  await fs.mkdir(path.join(OUT, 'raw'), { recursive: true });

  let done = 0;
  for (const service of services) {
    for (const { suffix, w, h, position } of SUFFIXES) {
      const rawName = `print8-full-${BATCH}-${service}-${suffix}.png`;
      const raw = path.join(RAW, rawName);
      try {
        await fs.access(raw);
      } catch {
        console.warn('Missing:', raw);
        continue;
      }

      await fs.copyFile(raw, path.join(OUT, 'raw', rawName));

      const outDir = FORMAT_DIRS[suffix];
      const out = path.join(
        OUT,
        outDir,
        `print8-${service}-${suffix}-${BATCH}.jpg`,
      );

      await sharp(raw)
        .resize(w, h, { fit: 'cover', position })
        .jpeg({ quality: 93, mozjpeg: true })
        .toFile(out);

      console.log('✓', path.relative(OUT, out));
      done += 1;
    }
  }

  console.log(`Done — ${done} ${BATCH} exports → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
