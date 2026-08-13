/**
 * Resize full AI social images (v4 batch) to exact export sizes.
 * Input: print8-full-v4-{service}-{square|portrait|story}.png in CURSOR_ASSETS
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { resolveCursorAssetsDir } from './lib/cursor-assets.mjs';

const home = process.env.USERPROFILE ?? process.env.HOME ?? '';
const OUT = path.resolve(
  process.env.PRINT8_SERVICES_OUT ??
    path.join(home, 'Desktop', 'print8-social-services-v4'),
);
const RAW = path.resolve(process.env.PRINT8_SERVICES_RAW ?? resolveCursorAssetsDir());

const JOBS = [
  { service: 'tshirt', suffix: 'square', w: 1080, h: 1080, position: 'bottom' },
  { service: 'tshirt', suffix: 'portrait', w: 1080, h: 1350, position: 'bottom' },
  { service: 'tshirt', suffix: 'story', w: 1080, h: 1920, position: 'bottom' },
  { service: 'mug', suffix: 'square', w: 1080, h: 1080, position: 'bottom' },
  { service: 'mug', suffix: 'portrait', w: 1080, h: 1350, position: 'bottom' },
  { service: 'mug', suffix: 'story', w: 1080, h: 1920, position: 'bottom' },
  { service: 'bag', suffix: 'square', w: 1080, h: 1080, position: 'bottom' },
  { service: 'bag', suffix: 'portrait', w: 1080, h: 1350, position: 'bottom' },
  { service: 'bag', suffix: 'story', w: 1080, h: 1920, position: 'bottom' },
  { service: 'cards', suffix: 'square', w: 1080, h: 1080, position: 'bottom' },
  { service: 'cards', suffix: 'portrait', w: 1080, h: 1350, position: 'bottom' },
  { service: 'cards', suffix: 'story', w: 1080, h: 1920, position: 'bottom' },
];

const FORMAT_DIRS = {
  square: 'square-1080x1080',
  portrait: 'portrait-1080x1350',
  story: 'stories-1080x1920',
};

async function main() {
  for (const dir of Object.values(FORMAT_DIRS)) {
    await fs.mkdir(path.join(OUT, dir), { recursive: true });
  }
  await fs.mkdir(path.join(OUT, 'raw'), { recursive: true });

  let done = 0;
  for (const job of JOBS) {
    const rawName = `print8-full-v4-${job.service}-${job.suffix}.png`;
    const raw = path.join(RAW, rawName);
    try {
      await fs.access(raw);
    } catch {
      console.warn('Missing:', raw);
      continue;
    }

    await fs.copyFile(raw, path.join(OUT, 'raw', rawName));

    const outDir = FORMAT_DIRS[job.suffix];
    const out = path.join(
      OUT,
      outDir,
      `print8-${job.service}-${job.suffix}-v4.jpg`,
    );

    await sharp(raw)
      .resize(job.w, job.h, { fit: 'cover', position: job.position })
      .jpeg({ quality: 93, mozjpeg: true })
      .toFile(out);

    console.log('✓', path.relative(OUT, out));
    done += 1;
  }

  console.log(`Done — ${done} full-AI v4 exports → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
