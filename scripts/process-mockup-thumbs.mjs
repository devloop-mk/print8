import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const THUMBS = path.join(ROOT, 'public', 'NEW_DESIGNS', 'gallery-thumbs');
const SRC = path.join(THUMBS, 'mockup-src');
const ASSETS = path.join(ROOT, 'assets');

const MENU_IDS = [
  'svg-menu-rustic',
  'svg-menu-sushi',
  'svg-menu-seafood',
  'svg-menu-cafe',
];

const BDAY_IDS = [
  'svg-bday-gold',
  'svg-bday-rosegold',
  'svg-bday-princess',
  'svg-bday-champagne',
  'svg-bday-unicorn',
  'svg-bday-bbq',
  'svg-bday-retro',
  'svg-bday-construction',
  'svg-bday-mermaid',
  'svg-bday-safari',
  'svg-bday-space',
];

const WEDDING_IDS = [
  'svg-wedding-modern-arch',
  'svg-wedding-romantic-blush',
  'svg-wedding-classic-navy-gold',
  'svg-wedding-botanical-boho',
  'svg-wedding-print-beach',
  'svg-wedding-print-autumn',
  'svg-wedding-print-celestial',
  'svg-wedding-print-terracotta',
  'svg-wedding-print-watercolor',
  'svg-wedding-print-winter',
  'svg-wedding-watercolor-daisy',
  'svg-wedding-lemon-tiles',
];

const jobs = [
  ...MENU_IDS.map((id) => ({ id, width: 640, height: 960 })),
  ...BDAY_IDS.map((id) => ({ id, width: 640, height: 896 })),
  ...WEDDING_IDS.map((id) => ({ id, width: 640, height: 896 })),
  {
    id: 'svg-menu-finedining',
    width: 640,
    height: 960,
    src: path.join(SRC, 'svg-menu-finedining.spiral.mockup-src.png'),
  },
  {
    id: 'svg-bday-dino',
    width: 640,
    height: 896,
    src: path.join(SRC, 'svg-bday-dino.mockup-src.png'),
  },
];

function resolveSrc(job) {
  if (job.src) return job.src;
  const inSrc = path.join(SRC, `${job.id}.mockup-src.png`);
  const inAssets = path.join(ASSETS, `${job.id}.mockup-src.png`);
  if (fs.existsSync(inSrc)) return inSrc;
  if (fs.existsSync(inAssets)) return inAssets;
  return null;
}

fs.mkdirSync(SRC, { recursive: true });

const requested = process.argv.slice(2);
const selected = requested.length
  ? jobs.filter((job) => requested.includes(job.id))
  : jobs;

for (const job of selected) {
  const src = resolveSrc(job);
  if (!src) {
    console.warn(`Skip ${job.id} — source PNG missing`);
    continue;
  }

  if (src.startsWith(ASSETS)) {
    const dest = path.join(SRC, `${job.id}.mockup-src.png`);
    if (!fs.existsSync(dest) || fs.statSync(src).mtimeMs > fs.statSync(dest).mtimeMs) {
      fs.copyFileSync(src, dest);
    }
  }

  const out = path.join(THUMBS, `${job.id}.webp`);
  const flat = out.replace(/\.webp$/, '.flat.webp');
  if (!fs.existsSync(flat) && fs.existsSync(out)) {
    fs.copyFileSync(out, flat);
  }

  await sharp(src)
    .resize(job.width, job.height, { fit: 'cover', position: 'attention' })
    .webp({ quality: 86, effort: 6 })
    .toFile(out);

  const meta = await sharp(out).metadata();
  console.log(`${job.id} -> ${meta.width}x${meta.height}, ${meta.size ?? 'n/a'} bytes`);
}

console.log(`\nDone: ${selected.length} jobs requested.`);
