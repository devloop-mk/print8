/**
 * Print 8 service social v2 — no logo (top safe zone), richer caption styling.
 *
 * Raw files: print8-svc-v2-{tshirt|mug|bag|cards}-{square|portrait|story}.png
 *
 * Usage: node scripts/compose-print8-services-social-v2.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { resolveCursorAssetsDir } from './lib/cursor-assets.mjs';

const home = process.env.USERPROFILE ?? process.env.HOME ?? '';
const OUT = path.resolve(
  process.env.PRINT8_SERVICES_OUT ??
    path.join(home, 'Desktop', 'print8-social-services-v2'),
);
const RAW_DIR = path.resolve(
  process.env.PRINT8_SERVICES_RAW ?? resolveCursorAssetsDir(),
);

/** Reserved at top for user-placed logo (no logo composited). */
const LOGO_SAFE_TOP = 130;

const FORMATS = [
  {
    id: 'square',
    suffix: 'square',
    w: 1080,
    h: 1080,
    outDir: 'square-1080x1080',
    cropPosition: 'bottom',
  },
  {
    id: 'portrait',
    suffix: 'portrait',
    w: 1080,
    h: 1350,
    outDir: 'portrait-1080x1350',
    cropPosition: 'bottom',
  },
  {
    id: 'story',
    suffix: 'story',
    w: 1080,
    h: 1920,
    outDir: 'stories-1080x1920',
    cropPosition: 'bottom',
  },
];

const SERVICES = ['tshirt', 'mug', 'bag', 'cards'];

const CAPTIONS = {
  tshirt: {
    title: 'Печат на маици',
    subtitle: 'Твој дизајн · остро и трајно',
    tag: 'Персонализирани маици',
  },
  mug: {
    title: 'Печат на шолји',
    subtitle: 'Сублимација и фото принт',
    tag: 'Совршен подарок',
  },
  bag: {
    title: 'Печат на торби',
    subtitle: 'Памучни торби со твој дизајн',
    tag: 'За секојдневно носење',
  },
  cards: {
    title: 'Визит карти',
    subtitle: 'Професионален бизнис печат',
    tag: 'Премиум квалитет',
  },
};

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function captionSvg(w, h, { title, subtitle, tag }) {
  const isStory = h >= 1600;
  const bandH = isStory ? 520 : h >= 1200 ? 420 : 380;
  const panelTop = h - bandH;
  const padX = 48;
  const accentX = padX;
  const textX = padX + 22;
  const tagY = panelTop + (isStory ? 118 : 100);
  const titleY = tagY + (isStory ? 52 : 46);
  const subY = titleY + (isStory ? 58 : 50);
  const pillY = h - (isStory ? 72 : 64);
  const titleSize = isStory ? 54 : 48;
  const subSize = isStory ? 30 : 26;
  const tagSize = isStory ? 22 : 20;
  const pillW = 200;
  const pillH = 44;

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="baseFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0c1f2e" stop-opacity="0"/>
      <stop offset="35%" stop-color="#0c1f2e" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#0a1824" stop-opacity="0.92"/>
    </linearGradient>
    <linearGradient id="warmGlow" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f48c06" stop-opacity="0.35"/>
      <stop offset="55%" stop-color="#2f7cb2" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#0a1824" stop-opacity="0"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <!-- Bottom atmosphere -->
  <rect x="0" y="${panelTop - 40}" width="${w}" height="${bandH + 40}" fill="url(#baseFade)"/>
  <rect x="0" y="${panelTop}" width="${w}" height="${bandH}" fill="url(#warmGlow)"/>
  <!-- Soft panel edge -->
  <path d="M ${padX - 8} ${panelTop + 24} Q ${w / 2} ${panelTop - 6} ${w - padX + 8} ${panelTop + 24}" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="1"/>
  <!-- Accent bar -->
  <rect x="${accentX}" y="${tagY - 8}" width="6" height="${subY - tagY + 36}" rx="3" fill="#f48c06"/>
  <!-- Tag pill -->
  <rect x="${textX}" y="${tagY - 28}" width="${tag.length * 11 + 36}" height="32" rx="16" fill="#ffffff" fill-opacity="0.12"/>
  <text x="${textX + 18}" y="${tagY - 6}" fill="#e8f4fc" font-family="Arial, Helvetica, sans-serif" font-size="${tagSize}" font-weight="600" letter-spacing="0.04em">${escapeXml(tag.toUpperCase())}</text>
  <!-- Title + subtitle -->
  <text x="${textX}" y="${titleY}" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="${titleSize}" font-weight="700" filter="url(#softShadow)">${escapeXml(title)}</text>
  <text x="${textX}" y="${subY}" fill="#c8dce8" font-family="Arial, Helvetica, sans-serif" font-size="${subSize}" font-weight="400">${escapeXml(subtitle)}</text>
  <!-- CTA pill -->
  <rect x="${textX}" y="${pillY - pillH}" width="${pillW}" height="${pillH}" rx="22" fill="#f48c06" fill-opacity="0.22" stroke="#f48c06" stroke-opacity="0.55" stroke-width="1.5"/>
  <text x="${textX + 24}" y="${pillY - 14}" fill="#ffb347" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700">print8.mk</text>
</svg>`);
}

async function main() {
  for (const fmt of FORMATS) {
    await fs.mkdir(path.join(OUT, fmt.outDir), { recursive: true });
  }

  let composed = 0;

  for (const service of SERVICES) {
    for (const fmt of FORMATS) {
      const rawName = `print8-svc-v2-${service}-${fmt.suffix}.png`;
      const rawPath = path.join(RAW_DIR, rawName);
      try {
        await fs.access(rawPath);
      } catch {
        console.warn('Skip (missing):', rawPath);
        continue;
      }

      const { w, h, cropPosition } = fmt;
      const caption = CAPTIONS[service];

      let base = await sharp(rawPath)
        .resize(w, h, { fit: 'cover', position: cropPosition })
        .png()
        .toBuffer();

      const overlay = await sharp(captionSvg(w, h, caption))
        .png()
        .toBuffer();

      base = await sharp(base)
        .composite([{ input: overlay, top: 0, left: 0 }])
        .png()
        .toBuffer();

      const outPath = path.join(
        OUT,
        fmt.outDir,
        `print8-${service}-${fmt.id}-v2.jpg`,
      );

      await sharp(base)
        .jpeg({ quality: 93, mozjpeg: true })
        .toFile(outPath);

      console.log('✓', path.relative(OUT, outPath));
      composed += 1;
    }
  }

  console.log(`Done — ${composed} images → ${OUT}`);
  console.log(`Top ~${LOGO_SAFE_TOP}px kept clear for your logo (no logo embedded).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
