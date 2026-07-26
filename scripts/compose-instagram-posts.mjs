/**
 * Resize IG raws to 1080×1440 and composite the exact Print 8 logo (no AI redraw).
 *
 * Usage: node scripts/compose-instagram-posts.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { resolveCursorAssetsDir } from './lib/cursor-assets.mjs';

const home = process.env.USERPROFILE ?? process.env.HOME ?? '';
const ROOT = path.resolve(
  process.env.PRINT8_IG_ROOT ?? path.join(home, 'Desktop', 'print8-instagram-posts'),
);
const ASSETS = resolveCursorAssetsDir();
const LOGO_LIGHT = path.join(ROOT, 'logos/logo-horizontal-light.png');
const LOGO_DARK = path.join(ROOT, 'logos/logo-horizontal-dark.png');
const RAW_DIR = path.join(ROOT, 'raw');
const FINAL_DIR = path.join(ROOT, 'final');

const W = 1080;
const H = 1440;
const LOGO_WIDTH = 320;

/** Optional MK captions drawn into the bottom band (SVG overlay). */
const CAPTIONS = {
  'ig-raw-couples-01-king-queen': {
    title: 'За двајца',
    subtitle: 'Matching маици за парови',
  },
  'ig-raw-couples-02-lifestyle': {
    title: 'Парски дизајни',
    subtitle: 'Печати и носете заедно',
  },
  'ig-raw-couples-03-grid': {
    title: '6+ парски пакети',
    subtitle: 'Избери го вашиот look',
  },
  'ig-raw-couples-04-gift': {
    title: 'Идеален подарок',
    subtitle: 'За годишнина или без повод',
  },
  'ig-raw-couples-05-split': {
    title: 'Тој + Таа',
    subtitle: 'Комплементарни принтови',
  },
  'ig-raw-couples-06-cafe': {
    title: 'Street couple vibes',
    subtitle: 'Нарачај online · print8.mk',
  },
  'ig-raw-couples-07-hearts': {
    title: 'Две половини',
    subtitle: 'Еден пар · два принта',
  },
  'ig-raw-family-01-stack': {
    title: 'За целото семејство',
    subtitle: 'Matching маици за сите',
  },
  'ig-raw-family-02-lifestyle': {
    title: 'Семејни дизајни',
    subtitle: 'Мама, тато, деца — заедно',
  },
  'ig-raw-family-03-newspaper': {
    title: 'Newspaper pack',
    subtitle: 'Забавни семејни принтови',
  },
  'ig-raw-family-04-generations': {
    title: 'Од баба до внук',
    subtitle: 'Подарок што се носи',
  },
  'ig-raw-family-05-promo': {
    title: 'Семеен пакет',
    subtitle: 'Ново во print8.mk',
  },
  'ig-raw-family-06-hangers': {
    title: 'Улоги во семејството',
    subtitle: 'Mama · Tato · Baba · Deda',
  },
  'ig-raw-family-07-picnic': {
    title: 'Family matching day',
    subtitle: 'Печати за целото семејство',
  },
  'ig-raw-kids-01-birthday': {
    title: 'Роденден mode: ON',
    subtitle: 'Детски роденденски маици',
  },
  'ig-raw-kids-02-grid': {
    title: 'Роденденски дизајни',
    subtitle: 'За најмалите славеници',
  },
  'ig-raw-kids-03-parent': {
    title: 'Родител + дете',
    subtitle: 'Matching роденденски маици',
  },
  'ig-raw-local-01-mugs-caps': {
    title: 'Штип & Македонија',
    subtitle: 'Шолји и капи со локален дух',
  },
  'ig-raw-local-02-lifestyle': {
    title: 'Локално од срце',
    subtitle: 'Принтови од Штип и МК',
  },
  'ig-raw-caps-01-shelf': {
    title: 'Капи со став',
    subtitle: 'Локални и минимал дизајни',
  },
  'ig-raw-offer-01-coupon': {
    title: '3.000 ден. → −500',
    subtitle: 'Купи повеќе, заштеди повеќе',
  },
  'ig-raw-offer-02-cod': {
    title: 'Плати при достава',
    subtitle: 'Низ цела Македонија',
  },
  'ig-raw-custom-01-diy': {
    title: 'Твојот дизајн',
    subtitle: 'Качи и ние печатиме',
  },
  'ig-raw-street-01-trending': {
    title: 'Тренд дизајни',
    subtitle: 'Свежи принтови секоја сезона',
  },
  'ig-raw-ready-01-catalog': {
    title: '100+ готови дизајни',
    subtitle: 'Избери · нарачај · носи',
  },
  'ig-raw-apparel-01-stack': {
    title: 'Печати го стилот',
    subtitle: 'Маици, дуксери, капи',
  },
  'ig-raw-howto-01-steps': {
    title: 'Како да нарачаш',
    subtitle: '3 чекори до твојата маица',
  },
  'ig-raw-drinkware-01-mugs': {
    title: 'Шолји & термоси',
    subtitle: 'Со твој или готов дизајн',
  },
  'ig-raw-promo-01-sale': {
    title: 'Нова понуда',
    subtitle: 'Погледни на print8.mk',
  },
  'ig-raw-brand-01-craft': {
    title: 'Рачно со внимание',
    subtitle: 'Професионален печат · Штип',
  },
};

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function captionSvg(title, subtitle) {
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#122b3d" stop-opacity="0"/>
      <stop offset="35%" stop-color="#122b3d" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#122b3d" stop-opacity="0.92"/>
    </linearGradient>
  </defs>
  <rect x="0" y="${H - 420}" width="${W}" height="420" fill="url(#fade)"/>
  <text x="54" y="${H - 168}" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="700">${escapeXml(title)}</text>
  <text x="54" y="${H - 108}" fill="#dceaf4" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="500">${escapeXml(subtitle)}</text>
  <text x="54" y="${H - 52}" fill="#f48c06" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700">print8.mk</text>
</svg>`);
}

async function sampleTopBrightness(imgBuffer) {
  const { data, info } = await sharp(imgBuffer)
    .extract({ left: 0, top: 0, width: W, height: 160 })
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
  await fs.mkdir(RAW_DIR, { recursive: true });
  await fs.mkdir(FINAL_DIR, { recursive: true });

  const assetFiles = (await fs.readdir(ASSETS)).filter((f) =>
    f.startsWith('ig-raw-') && f.endsWith('.png'),
  );

  for (const file of assetFiles) {
    await fs.copyFile(path.join(ASSETS, file), path.join(RAW_DIR, file));
  }

  const rawFiles = (await fs.readdir(RAW_DIR)).filter((f) => f.endsWith('.png'));
  const lightLogo = await prepareLogo(LOGO_LIGHT);
  const darkLogo = await prepareLogo(LOGO_DARK);

  console.log(`Compositing ${rawFiles.length} posts → ${FINAL_DIR}`);

  for (const file of rawFiles) {
    const id = file.replace(/\.png$/i, '');
    const input = path.join(RAW_DIR, file);
    const output = path.join(FINAL_DIR, file.replace(/^ig-raw-/, 'ig-'));

    let base = await sharp(input)
      .resize(W, H, { fit: 'cover', position: 'centre' })
      .png()
      .toBuffer();

    const caption = CAPTIONS[id];
    if (caption) {
      const overlay = await sharp(captionSvg(caption.title, caption.subtitle))
        .png()
        .toBuffer();
      base = await sharp(base)
        .composite([{ input: overlay, top: 0, left: 0 }])
        .png()
        .toBuffer();
    }

    const brightness = await sampleTopBrightness(base);
    const useLightLogo = brightness < 140;
    const logo = useLightLogo ? lightLogo : darkLogo;

    // Soft brand bar behind exact logo so it stays readable on any background
    const barH = 96;
    const bar = await sharp({
      create: {
        width: W,
        height: barH,
        channels: 4,
        background: useLightLogo
          ? { r: 18, g: 43, b: 61, alpha: 0.55 }
          : { r: 255, g: 255, b: 255, alpha: 0.72 },
      },
    })
      .png()
      .toBuffer();

    const logoLeft = Math.round((W - logo.info.width) / 2);
    const logoTop = Math.round((barH - logo.info.height) / 2);

    await sharp(base)
      .composite([
        { input: bar, top: 0, left: 0 },
        { input: logo.data, top: logoTop, left: logoLeft },
      ])
      .jpeg({ quality: 92, mozjpeg: true })
      .toFile(output.replace(/\.png$/i, '.jpg'));

    // Also keep PNG masters
    await sharp(base)
      .composite([
        { input: bar, top: 0, left: 0 },
        { input: logo.data, top: logoTop, left: logoLeft },
      ])
      .png()
      .toFile(output);

    console.log('✓', path.basename(output));
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
