/**
 * Compose Print 8 service showcase social images with exact logo + MK captions.
 *
 * Expects raw PNGs in RAW_DIR named:
 *   print8-svc-{tshirt|mug|bag|cards}-{square|portrait|story}.png
 *
 * Outputs to Desktop:
 *   square-1080x1080, portrait-1080x1350, stories-1080x1920
 *
 * Usage: node scripts/compose-print8-services-social.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { resolveCursorAssetsDir } from './lib/cursor-assets.mjs';

const home = process.env.USERPROFILE ?? process.env.HOME ?? '';
const OUT = path.resolve(
  process.env.PRINT8_SERVICES_OUT ??
    path.join(home, 'Desktop', 'print8-social-services'),
);
const IG_LOGOS = path.join(home, 'Desktop', 'print8-instagram-posts', 'logos');
const LOGO_LIGHT = path.join(IG_LOGOS, 'logo-horizontal-light.png');
const LOGO_DARK = path.join(IG_LOGOS, 'logo-horizontal-dark.png');
const RAW_DIR = path.resolve(process.env.PRINT8_SERVICES_RAW ?? resolveCursorAssetsDir());

const FORMATS = [
  { id: 'square', suffix: 'square', w: 1080, h: 1080, outDir: 'square-1080x1080' },
  { id: 'portrait', suffix: 'portrait', w: 1080, h: 1350, outDir: 'portrait-1080x1350' },
  { id: 'story', suffix: 'story', w: 1080, h: 1920, outDir: 'stories-1080x1920' },
];

const SERVICES = ['tshirt', 'mug', 'bag', 'cards'];

const CAPTIONS = {
  tshirt: {
    title: 'Печат на маици',
    subtitle: 'Персонализирани маици · DTG печат',
  },
  mug: {
    title: 'Печат на шолји',
    subtitle: 'Сублимација и фото принт',
  },
  bag: {
    title: 'Печат на торби',
    subtitle: 'Памучни торби со твој дизајн',
  },
  cards: {
    title: 'Визит карти',
    subtitle: 'Професионален бизнис печат',
  },
};

const LOGO_WIDTH = 300;

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function captionSvg(w, h, title, subtitle) {
  const bandH = h >= 1600 ? 480 : h >= 1200 ? 400 : 360;
  const titleY = h - bandH + (h >= 1600 ? 200 : 168);
  const subY = titleY + 56;
  const ctaY = h - 52;
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#122b3d" stop-opacity="0"/>
      <stop offset="40%" stop-color="#122b3d" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#122b3d" stop-opacity="0.94"/>
    </linearGradient>
  </defs>
  <rect x="0" y="${h - bandH}" width="${w}" height="${bandH}" fill="url(#fade)"/>
  <text x="54" y="${titleY}" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="${h >= 1600 ? 56 : 50}" font-weight="700">${escapeXml(title)}</text>
  <text x="54" y="${subY}" fill="#dceaf4" font-family="Arial, Helvetica, sans-serif" font-size="${h >= 1600 ? 32 : 28}" font-weight="500">${escapeXml(subtitle)}</text>
  <text x="54" y="${ctaY}" fill="#f48c06" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700">print8.mk</text>
</svg>`);
}

async function sampleTopBrightness(imgBuffer, w) {
  const { data, info } = await sharp(imgBuffer)
    .extract({ left: 0, top: 0, width: w, height: 160 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let sum = 0;
  const pixels = info.width * info.height;
  for (let i = 0; i < data.length; i += info.channels) {
    sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  }
  return sum / pixels;
}

async function prepareLogo(logoPath) {
  return sharp(logoPath)
    .resize({ width: LOGO_WIDTH, withoutEnlargement: false })
    .png()
    .toBuffer({ resolveWithObject: true });
}

async function main() {
  for (const fmt of FORMATS) {
    await fs.mkdir(path.join(OUT, fmt.outDir), { recursive: true });
  }

  const lightLogo = await prepareLogo(LOGO_LIGHT);
  const darkLogo = await prepareLogo(LOGO_DARK);

  let composed = 0;

  for (const service of SERVICES) {
    for (const fmt of FORMATS) {
      const rawName = `print8-svc-${service}-${fmt.suffix}.png`;
      const rawPath = path.join(RAW_DIR, rawName);
      try {
        await fs.access(rawPath);
      } catch {
        console.warn('Skip (missing):', rawPath);
        continue;
      }

      const { w, h } = fmt;
      const caption = CAPTIONS[service];

      let base = await sharp(rawPath)
        .resize(w, h, { fit: 'cover', position: 'centre' })
        .png()
        .toBuffer();

      const overlay = await sharp(
        captionSvg(w, h, caption.title, caption.subtitle),
      )
        .png()
        .toBuffer();

      base = await sharp(base)
        .composite([{ input: overlay, top: 0, left: 0 }])
        .png()
        .toBuffer();

      const brightness = await sampleTopBrightness(base, w);
      const useLightLogo = brightness < 140;
      const logo = useLightLogo ? lightLogo : darkLogo;

      const barH = 96;
      const bar = await sharp({
        create: {
          width: w,
          height: barH,
          channels: 4,
          background: useLightLogo
            ? { r: 18, g: 43, b: 61, alpha: 0.58 }
            : { r: 255, g: 255, b: 255, alpha: 0.75 },
        },
      })
        .png()
        .toBuffer();

      const logoLeft = Math.round((w - logo.info.width) / 2);
      const logoTop = Math.round((barH - logo.info.height) / 2);

      const outBase = path.join(
        OUT,
        fmt.outDir,
        `print8-${service}-${fmt.id}.jpg`,
      );

      await sharp(base)
        .composite([
          { input: bar, top: 0, left: 0 },
          { input: logo.data, top: logoTop, left: logoLeft },
        ])
        .jpeg({ quality: 93, mozjpeg: true })
        .toFile(outBase);

      console.log('✓', path.relative(OUT, outBase));
      composed += 1;
    }
  }

  console.log(`Done — ${composed} images → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
