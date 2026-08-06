import sharp from 'sharp';
import path from 'node:path';

const ROOT = process.cwd();
const THUMBS = path.join(ROOT, 'public', 'NEW_DESIGNS', 'gallery-thumbs');
const SRC = path.join(THUMBS, 'mockup-src');
const MENU_MOCKUPS = path.join(ROOT, 'public', 'NEW_DESIGNS', 'menus', 'mockups');

const jobs = [
  {
    id: 'menu-finedining',
    src: path.join(SRC, 'svg-menu-finedining.spiral.mockup-src.png'),
    out: path.join(THUMBS, 'svg-menu-finedining.webp'),
    width: 640,
    height: 960,
  },
  {
    id: 'menu-open-spread',
    src: path.join(SRC, 'menu-a5-spiral-open.mockup-src.png'),
    out: path.join(MENU_MOCKUPS, 'menu-a5-spiral-open.webp'),
    width: 1280,
    height: 960,
  },
  {
    id: 'bday-dino',
    src: path.join(SRC, 'svg-bday-dino.mockup-src.png'),
    out: path.join(THUMBS, 'svg-bday-dino.webp'),
    width: 640,
    height: 896,
  },
];

// Optional job ids as CLI args so a single thumb can be reprocessed without
// re-encoding the others.
const requested = process.argv.slice(2);
const selected = requested.length
  ? jobs.filter((job) => requested.includes(job.id))
  : jobs;

for (const job of selected) {
  await sharp(job.src)
    .resize(job.width, job.height, { fit: 'cover', position: 'attention' })
    .webp({ quality: 86, effort: 6 })
    .toFile(job.out);
  const meta = await sharp(job.out).metadata();
  console.log(`${path.basename(job.out)} -> ${meta.width}x${meta.height}, ${meta.size ?? 'n/a'} bytes`);
}
