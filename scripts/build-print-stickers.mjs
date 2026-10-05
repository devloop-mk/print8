/**
 * Build storefront stickers:
 *  - Microsoft Fluent Emoji Color (MIT) as die-cut PNGs
 *  - Round flag stickers from flag-icons
 *  - Vinyl-style text badges
 *
 * Run: node scripts/build-print-stickers.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'stickers');
const FLAG_SOURCE = path.join(ROOT, 'node_modules', 'flag-icons', 'flags', '1x1');
const FLUENT_BASE =
  'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/';

const SIZE = 1024;
const BORDER = 52;

/** Sticker id → Fluent Emoji Color SVG path under assets/. */
const FLUENT_STICKERS = {
  fire: 'Fire/Color/fire_color.svg',
  hundred: 'Hundred points/Color/hundred_points_color.svg',
  'thumbs-up': 'Thumbs up/Default/Color/thumbs_up_color_default.svg',
  lol: 'Face with tears of joy/Color/face_with_tears_of_joy_color.svg',
  wow: 'Astonished face/Color/astonished_face_color.svg',
  clap: 'Clapping hands/Default/Color/clapping_hands_color_default.svg',
  muscle: 'Flexed biceps/Default/Color/flexed_biceps_color_default.svg',
  thinking: 'Thinking face/Color/thinking_face_color.svg',
  cry: 'Loudly crying face/Color/loudly_crying_face_color.svg',
  eyes: 'Eyes/Color/eyes_color.svg',
  heart: 'Red heart/Color/red_heart_color.svg',
  'heart-eyes':
    'Smiling face with heart-eyes/Color/smiling_face_with_heart-eyes_color.svg',
  hearts: 'Sparkling heart/Color/sparkling_heart_color.svg',
  kiss: 'Kiss mark/Color/kiss_mark_color.svg',
  ring: 'Ring/Color/ring_color.svg',
  sparkles: 'Sparkles/Color/sparkles_color.svg',
  star: 'Glowing star/Color/glowing_star_color.svg',
  rainbow: 'Rainbow/Color/rainbow_color.svg',
  butterfly: 'Butterfly/Color/butterfly_color.svg',
  sun: 'Sun/Color/sun_color.svg',
  music: 'Musical notes/Color/musical_notes_color.svg',
  party: 'Party popper/Color/party_popper_color.svg',
  crown: 'Crown/Color/crown_color.svg',
  lightning: 'High voltage/Color/high_voltage_color.svg',
  cool: 'Smiling face with sunglasses/Color/smiling_face_with_sunglasses_color.svg',
  pizza: 'Pizza/Color/pizza_color.svg',
  camera: 'Camera/Color/camera_color.svg',
  cloud: 'Cloud/Color/cloud_color.svg',
  flower: 'Cherry blossom/Color/cherry_blossom_color.svg',
  moon: 'Crescent moon/Color/crescent_moon_color.svg',
  'bubble-tea': 'Bubble tea/Color/bubble_tea_color.svg',
  cat: 'Cat face/Color/cat_face_color.svg',
  paw: 'Paw prints/Color/paw_prints_color.svg',
};

const FLAG_MAP = {
  'flag-mk': 'mk',
  'flag-al': 'al',
  'flag-rs': 'rs',
  'flag-bg': 'bg',
  'flag-gr': 'gr',
  'flag-hr': 'hr',
  'flag-xk': 'xk',
  'flag-eu': 'eu',
  'flag-us': 'us',
  'flag-gb': 'gb',
  'flag-de': 'de',
  'flag-tr': 'tr',
  'flag-it': 'it',
  'flag-si': 'si',
  'flag-me': 'me',
  'flag-ba': 'ba',
  'flag-ro': 'ro',
  'flag-fr': 'fr',
  'flag-es': 'es',
  'flag-nl': 'nl',
  'flag-ch': 'ch',
  'flag-at': 'at',
  'flag-pl': 'pl',
  'flag-pt': 'pt',
  'flag-ua': 'ua',
  'flag-ca': 'ca',
  'flag-au': 'au',
  'flag-br': 'br',
  'flag-jp': 'jp',
  'flag-in': 'in',
  'flag-kr': 'kr',
  'flag-cn': 'cn',
  'flag-ae': 'ae',
  'flag-mx': 'mx',
};

const TEXT_STICKERS = [
  { id: 'text-love', label: 'LOVE', fill: '#E11D48', size: 54 },
  { id: 'text-omg', label: 'OMG', fill: '#EA580C', size: 56 },
  { id: 'text-yes', label: 'YES', fill: '#16A34A', size: 58 },
  { id: 'text-vip', label: 'VIP', fill: '#111827', size: 62 },
  { id: 'text-bff', label: 'BFF', fill: '#DB2777', size: 58 },
  { id: 'text-thanks', label: 'THANKS', fill: '#0F766E', size: 40 },
  { id: 'text-slay', label: 'SLAY', fill: '#7C3AED', size: 54 },
  { id: 'text-goat', label: 'GOAT', fill: '#D97706', size: 52 },
  { id: 'text-da', label: 'ДА', fill: '#2563EB', size: 72 },
  { id: 'text-ljubov', label: 'ЉУБОВ', fill: '#E11D48', size: 42 },
  { id: 'text-bravo', label: 'БРАВО', fill: '#0D9488', size: 42 },
];

function fluentUrl(assetPath) {
  return FLUENT_BASE + assetPath.split('/').map(encodeURIComponent).join('/');
}

async function svgToArtworkPng(svgBuffer, innerSize) {
  return sharp(svgBuffer, { density: 2200 })
    .resize(innerSize, innerSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function addDieCutBorder(artworkPng, border = BORDER) {
  const padded = await sharp(artworkPng)
    .ensureAlpha()
    .extend({
      top: border,
      bottom: border,
      left: border,
      right: border,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const { width, height } = await sharp(padded).metadata();
  const dilatedAlpha = await sharp(padded)
    .extractChannel('alpha')
    .blur(Math.max(4, border * 0.38))
    .threshold(8)
    .toBuffer();

  const white = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .joinChannel(dilatedAlpha)
    .png()
    .toBuffer();

  return sharp(white)
    .composite([{ input: padded, blend: 'over' }])
    .trim({ threshold: 8 })
    .png({ compressionLevel: 9, effort: 8 })
    .toBuffer();
}

async function writeStickerPng(id, png) {
  const out = path.join(OUT_DIR, `${id}.png`);
  fs.writeFileSync(out, png);
  const kb = Math.round(png.length / 1024);
  console.log(`✓ ${id}.png (${kb} KB)`);
}

async function buildFluentStickers() {
  const inner = SIZE - BORDER * 2;
  for (const [id, assetPath] of Object.entries(FLUENT_STICKERS)) {
    const url = fluentUrl(assetPath);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Fluent fetch failed ${res.status} ${url}`);
    }
    const svg = Buffer.from(await res.arrayBuffer());
    const artwork = await svgToArtworkPng(svg, inner);
    const dieCut = await addDieCutBorder(artwork);
    await writeStickerPng(id, dieCut);

    const oldSvg = path.join(OUT_DIR, `${id}.svg`);
    if (fs.existsSync(oldSvg)) fs.unlinkSync(oldSvg);
  }
}

function extractSvgInner(svg) {
  const openEnd = svg.indexOf('>');
  const closeStart = svg.lastIndexOf('</svg>');
  if (openEnd === -1 || closeStart === -1) {
    throw new Error('Invalid SVG markup');
  }
  return svg.slice(openEnd + 1, closeStart).trim();
}

function getViewBox(svg) {
  return svg.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 512 512';
}

async function buildFlagStickers() {
  const inner = SIZE - BORDER * 2;
  for (const [id, code] of Object.entries(FLAG_MAP)) {
    const sourcePath = path.join(FLAG_SOURCE, `${code}.svg`);
    if (!fs.existsSync(sourcePath)) {
      console.warn(`Skip missing flag: ${code}`);
      continue;
    }
    const source = fs.readFileSync(sourcePath, 'utf8');
    const innerMarkup = extractSvgInner(source);
    const viewBox = getViewBox(source);
    const clipId = `${code}-clip`;
    const needsXlink =
      innerMarkup.includes('xlink:') || innerMarkup.includes('href="#');

    const flagSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"${
      needsXlink ? ' xmlns:xlink="http://www.w3.org/1999/xlink"' : ''
    } viewBox="0 0 200 200">
  <defs>
    <clipPath id="${clipId}"><circle cx="100" cy="100" r="84"/></clipPath>
  </defs>
  <circle cx="102" cy="104" r="86" fill="#000" opacity="0.12"/>
  <g clip-path="url(#${clipId})">
    <svg x="16" y="16" width="168" height="168" viewBox="${viewBox}">
${innerMarkup}
    </svg>
  </g>
  <circle cx="100" cy="100" r="84" fill="none" stroke="#fff" stroke-width="16"/>
</svg>`;

    const artwork = await svgToArtworkPng(Buffer.from(flagSvg, 'utf8'), inner);
    const dieCut = await addDieCutBorder(artwork);
    await writeStickerPng(id, dieCut);

    const oldSvg = path.join(OUT_DIR, `${id}.svg`);
    if (fs.existsSync(oldSvg)) fs.unlinkSync(oldSvg);
  }
}

function textBadgeSvg({ label, fill, size }) {
  const escaped = label
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160">
  <defs>
    <filter id="s" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="4" flood-color="#000" flood-opacity="0.18"/>
    </filter>
  </defs>
  <g filter="url(#s)">
    <rect x="18" y="28" width="204" height="104" rx="36" fill="#fff"/>
    <rect x="28" y="38" width="184" height="84" rx="28" fill="${fill}"/>
    <text x="120" y="96" text-anchor="middle"
      font-family="Segoe UI Black, Arial Black, Arial, sans-serif"
      font-size="${size}" font-weight="900" fill="#fff">${escaped}</text>
  </g>
</svg>`;
}

async function buildTextStickers() {
  const inner = SIZE - BORDER * 2;
  for (const item of TEXT_STICKERS) {
    const svg = Buffer.from(textBadgeSvg(item), 'utf8');
    const artwork = await svgToArtworkPng(svg, inner);
    const dieCut = await addDieCutBorder(artwork, 36);
    await writeStickerPng(item.id, dieCut);

    const oldSvg = path.join(OUT_DIR, `${item.id}.svg`);
    if (fs.existsSync(oldSvg)) fs.unlinkSync(oldSvg);
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log('Building Fluent Emoji stickers…');
  await buildFluentStickers();
  console.log('Building flag stickers…');
  await buildFlagStickers();
  console.log('Building text stickers…');
  await buildTextStickers();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
