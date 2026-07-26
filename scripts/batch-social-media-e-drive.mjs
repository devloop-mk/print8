/**
 * High-volume Print 8 social export → E:\print8-social-media
 * - Exact logo compositing (never AI-redrawn)
 * - Formats: square 1080, portrait 1080x1440, landscape 1440x1080, stories 1080x1920
 * - Gradient / premium frame variants + coupon / couples caption variants
 *
 * Usage: node scripts/batch-social-media-e-drive.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { resolveCursorAssetsDir } from './lib/cursor-assets.mjs';

const OUT = 'E:/print8-social-media';
const LOGO_LIGHT = path.join(OUT, 'logos/logo-horizontal-light.png');
const LOGO_DARK = path.join(OUT, 'logos/logo-horizontal-dark.png');
const LOGO_MARK = path.join(OUT, 'logos/logo-mark.png');
const RAW = path.join(OUT, 'raw');
const ASSETS = resolveCursorAssetsDir();
const home = process.env.USERPROFILE ?? process.env.HOME ?? '';
const PREV_IG = path.resolve(
  process.env.PRINT8_IG_RAW ?? path.join(home, 'Desktop', 'print8-instagram-posts', 'raw'),
);
const BANNERS = path.join(process.cwd(), 'public/banners');

const FORMATS = [
  { id: 'square', dir: 'final/square', w: 1080, h: 1080 },
  { id: 'portrait', dir: 'final/portrait-1080x1440', w: 1080, h: 1440 },
  { id: 'landscape', dir: 'final/landscape-1440x1080', w: 1440, h: 1080 },
  { id: 'stories', dir: 'final/stories-1080x1920', w: 1080, h: 1920 },
];

const STYLES = ['fade', 'gradient-frame', 'navy-panel', 'soft-glow'];

/** Theme captions — rotated across bases with matching theme prefix */
const THEME_COPY = {
  couples: [
    { title: 'За двајца', subtitle: 'Matching маици за парови', cta: 'print8.mk' },
    { title: 'Тој + Таа', subtitle: 'Комплементарни принтови', cta: 'Избери парски пакет' },
    { title: 'Идеален подарок', subtitle: 'За годишнина или без повод', cta: 'Нарачај online' },
    { title: 'Две половини', subtitle: 'Еден пар · два принта', cta: 'print8.mk' },
    { title: 'Couple goals', subtitle: 'Печати и носете заедно', cta: 'Види дизајни' },
  ],
  family: [
    { title: 'За целото семејство', subtitle: 'Matching маици за сите', cta: 'print8.mk' },
    { title: 'Мама · Тато · Деца', subtitle: 'Семејни пакети за печат', cta: 'Избери дизајн' },
    { title: 'Од баба до внук', subtitle: 'Подарок што се носи', cta: 'print8.mk' },
  ],
  kids: [
    { title: 'Роденден mode: ON', subtitle: 'Детски роденденски маици', cta: 'print8.mk' },
    { title: 'Весел роденден', subtitle: 'Дизајни за најмалите', cta: 'Погледни понуда' },
  ],
  coupon500: [
    {
      title: '−500 ден.',
      subtitle: 'на нарачка над 3.500 ден.',
      cta: 'Користи на каса · print8.mk',
    },
    {
      title: 'Заштеди 500 ден.',
      subtitle: 'Купи за 3.500+ и добиј попуст',
      cta: 'print8.mk',
    },
  ],
  coupon1000: [
    {
      title: '−1.000 ден.',
      subtitle: 'на нарачка над 6.500 ден.',
      cta: 'Користи на каса · print8.mk',
    },
    {
      title: 'Заштеди 1.000 ден.',
      subtitle: 'Купи за 6.500+ и добиј попуст',
      cta: 'print8.mk',
    },
  ],
  branding: [
    { title: 'Твојот бренд', subtitle: 'Лого на маица, шолја, капа…', cta: 'Branding пакет' },
    { title: 'Merch за бизнис', subtitle: 'Качи лого · ние печатиме', cta: 'print8.mk' },
  ],
  local: [
    { title: 'Штип & Македонија', subtitle: 'Локални мотиви на шолји и капи', cta: 'print8.mk' },
    { title: 'Локално од срце', subtitle: 'Принтови со карактер', cta: 'Види дизајни' },
  ],
  apparel: [
    { title: 'Печати го стилот', subtitle: 'Маици · дуксери · капи', cta: 'print8.mk' },
    { title: 'Твој дизајн', subtitle: 'Професионален печат', cta: 'Започни нарачка' },
  ],
  ready: [
    { title: '100+ готови дизајни', subtitle: 'Избери · нарачај · носи', cta: 'print8.mk' },
    { title: 'Готови шаблони', subtitle: 'Маици, шолји и капи', cta: 'Избери дизајн' },
  ],
  cod: [
    { title: 'Плати при достава', subtitle: 'Низ цела Македонија', cta: 'Како да нарачаш' },
  ],
  caps: [
    { title: 'Капи со став', subtitle: 'Локални и минимал дизајни', cta: 'print8.mk' },
  ],
  drinkware: [
    { title: 'Шолји & термоси', subtitle: 'Со твој или готов дизајн', cta: 'print8.mk' },
  ],
  quality: [
    { title: 'Квалитет што се гледа', subtitle: 'Професионален печат · Штип', cta: 'print8.mk' },
    { title: 'Print 8', subtitle: 'Од идеја до готов производ', cta: 'Нарачај online' },
  ],
  custom: [
    { title: 'Качи го твојот дизајн', subtitle: 'Ние се грижиме за печатот', cta: 'print8.mk' },
  ],
  street: [
    { title: 'Тренд дизајни', subtitle: 'Свежи принтови', cta: 'print8.mk' },
  ],
};

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function detectTheme(name) {
  const n = name.toLowerCase();
  // coupon1000 MUST win before generic "coupon" → coupon500
  if (
    /coupon[-_]?1000/.test(n) ||
    /\bc1000\b/.test(n) ||
    /1000[-_]?den/.test(n) ||
    n.includes('6500') ||
    (n.includes('1000') && (n.includes('coupon') || n.includes('offer') || n.includes('promo')))
  ) {
    return 'coupon1000';
  }
  if (
    /coupon[-_]?500/.test(n) ||
    /\bc500\b/.test(n) ||
    /500[-_]?den/.test(n) ||
    n.includes('3500') ||
    n.includes('coupon') ||
    n.includes('offer')
  ) {
    return 'coupon500';
  }
  if (n.includes('couple')) return 'couples';
  if (n.includes('family')) return 'family';
  if (n.includes('kid') || n.includes('birthday')) return 'kids';
  if (n.includes('brand')) return 'branding';
  if (n.includes('local') || n.includes('stip') || /(^|[^a-z])mk([^a-z]|$)/.test(n)) return 'local';
  if (n.includes('cod') || n.includes('delivery')) return 'cod';
  if (n.includes('cap')) return 'caps';
  if (n.includes('mug') || n.includes('drink')) return 'drinkware';
  if (n.includes('ready') || n.includes('catalog')) return 'ready';
  if (n.includes('street') || n.includes('trend')) return 'street';
  if (n.includes('custom') || n.includes('diy')) return 'custom';
  if (n.includes('quality') || n.includes('gradient') || n.includes('premium')) return 'quality';
  if (n.includes('apparel') || n.includes('hoodie') || n.includes('tee')) return 'apparel';
  return 'quality';
}

/** Higher = sooner. Ensures coupon1000/500 are not starved by SM_TARGET. */
function themePriority(theme) {
  if (theme === 'coupon1000') return 0;
  if (theme === 'coupon500') return 1;
  if (theme === 'couples') return 2;
  return 10;
}

function overlaySvg(w, h, style, copy, formatId) {
  const titleSize = formatId === 'landscape' ? 46 : formatId === 'square' ? 48 : formatId === 'stories' ? 56 : 52;
  const subSize = formatId === 'landscape' ? 26 : 28;
  const bottom = formatId === 'stories' ? 280 : formatId === 'landscape' ? 200 : 240;
  const titleY = h - (formatId === 'stories' ? 200 : formatId === 'landscape' ? 130 : 155);
  const subY = titleY + (formatId === 'stories' ? 52 : 42);
  const ctaY = subY + 40;

  let chrome = '';
  if (style === 'fade') {
    chrome = `<defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#122b3d" stop-opacity="0"/>
        <stop offset="45%" stop-color="#122b3d" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="#0b1f2e" stop-opacity="0.92"/>
      </linearGradient>
    </defs>
    <rect x="0" y="${h - bottom - 80}" width="${w}" height="${bottom + 80}" fill="url(#g)"/>`;
  } else if (style === 'gradient-frame') {
    chrome = `<defs>
      <linearGradient id="frame" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#2f7cb2"/>
        <stop offset="50%" stop-color="#1c435f"/>
        <stop offset="100%" stop-color="#e85d04"/>
      </linearGradient>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#122b3d" stop-opacity="0"/>
        <stop offset="100%" stop-color="#0b1f2e" stop-opacity="0.9"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="${w}" height="${h}" fill="none" stroke="url(#frame)" stroke-width="18"/>
    <rect x="0" y="${h - bottom}" width="${w}" height="${bottom}" fill="url(#g)"/>`;
  } else if (style === 'navy-panel') {
    chrome = `<rect x="0" y="${h - bottom}" width="${w}" height="${bottom}" fill="#1c435f"/>
    <rect x="0" y="${h - bottom}" width="8" height="${bottom}" fill="#e85d04"/>`;
  } else {
    // soft-glow premium
    chrome = `<defs>
      <radialGradient id="rg" cx="50%" cy="0%" r="80%">
        <stop offset="0%" stop-color="#3d8bbf" stop-opacity="0.35"/>
        <stop offset="55%" stop-color="#122b3d" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#122b3d" stop-opacity="0"/>
        <stop offset="100%" stop-color="#07151f" stop-opacity="0.94"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#rg)"/>
    <rect x="0" y="${h - bottom - 40}" width="${w}" height="${bottom + 40}" fill="url(#g)"/>`;
  }

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  ${chrome}
  <text x="48" y="${titleY}" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="${titleSize}" font-weight="700">${escapeXml(copy.title)}</text>
  <text x="48" y="${subY}" fill="#dceaf4" font-family="Arial, Helvetica, sans-serif" font-size="${subSize}" font-weight="500">${escapeXml(copy.subtitle)}</text>
  <text x="48" y="${ctaY}" fill="#f48c06" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700">${escapeXml(copy.cta)}</text>
</svg>`);
}

async function gradientBase(w, h, variant) {
  const gradients = {
    a: ['#122b3d', '#2f7cb2', '#1c435f'],
    b: ['#0f172a', '#225376', '#e85d04'],
    c: ['#1c435f', '#3d8bbf', '#122b3d'],
    d: ['#07151f', '#2f7cb2', '#0f172a'],
    e: ['#1c435f', '#e85d04', '#122b3d'],
  };
  const [c1, c2, c3] = gradients[variant] || gradients.a;
  const svg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="55%" stop-color="${c2}"/>
      <stop offset="100%" stop-color="${c3}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <circle cx="${w * 0.85}" cy="${h * 0.2}" r="${Math.min(w, h) * 0.28}" fill="#ffffff" fill-opacity="0.06"/>
  <circle cx="${w * 0.1}" cy="${h * 0.75}" r="${Math.min(w, h) * 0.22}" fill="#e85d04" fill-opacity="0.12"/>
</svg>`);
  return sharp(svg).png().toBuffer();
}

async function prepareLogo(file, width) {
  return sharp(file).resize({ width, withoutEnlargement: false }).png().toBuffer({ resolveWithObject: true });
}

async function collectRaws() {
  await fs.mkdir(RAW, { recursive: true });
  const sources = [ASSETS, PREV_IG, BANNERS];
  const patterns = [
    /^ig-raw-.*\.png$/i,
    /^banner-(desktop|mobile)-.*\.png$/i,
    /^sm-raw-.*\.png$/i,
    /^social-raw-.*\.png$/i,
  ];

  for (const dir of sources) {
    let files = [];
    try {
      files = await fs.readdir(dir);
    } catch {
      continue;
    }
    for (const f of files) {
      if (!patterns.some((re) => re.test(f))) continue;
      const dest = path.join(RAW, f.replace(/\s+/g, '-'));
      try {
        await fs.copyFile(path.join(dir, f), dest);
      } catch {
        /* skip */
      }
    }
  }

  return (await fs.readdir(RAW)).filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));
}

async function exportOne({ baseBuf, baseName, theme, copy, style, format, lightLogo, darkLogo, markLogo, index }) {
  const { w, h, dir, id: formatId } = format;
  const outDir = path.join(OUT, dir);
  await fs.mkdir(outDir, { recursive: true });

  const stem = `${theme}_${baseName}__${style}__${index}`.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 120);
  const outPath = path.join(outDir, `${stem}.jpg`);

  try {
    await fs.access(outPath);
    return { outPath, wrote: false };
  } catch {
    /* create */
  }

  // cover into target
  let canvas = await sharp(baseBuf)
    .resize(w, h, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();

  const ov = await sharp(overlaySvg(w, h, style, copy, formatId)).png().toBuffer();
  canvas = await sharp(canvas).composite([{ input: ov, top: 0, left: 0 }]).jpeg({ quality: 92, mozjpeg: true }).toBuffer();

  // sample top for logo color
  const { data, info } = await sharp(canvas)
    .extract({ left: 0, top: 0, width: w, height: Math.min(140, h) })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let sum = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  }
  const bright = sum / (info.width * info.height);
  const useLight = bright < 145;
  const logo = useLight ? lightLogo : darkLogo;
  const barH = formatId === 'stories' ? 110 : 92;
  const bar = await sharp({
    create: {
      width: w,
      height: barH,
      channels: 4,
      background: useLight
        ? { r: 18, g: 43, b: 61, alpha: 0.58 }
        : { r: 255, g: 255, b: 255, alpha: 0.75 },
    },
  })
    .png()
    .toBuffer();

  const logoW = formatId === 'landscape' ? 300 : formatId === 'stories' ? 340 : 310;
  const logoResized = await sharp(logo.data).resize({ width: logoW }).png().toBuffer({ resolveWithObject: true });
  const logoLeft = Math.round((w - logoResized.info.width) / 2);
  const logoTop = Math.round((barH - logoResized.info.height) / 2);

  // small mark bottom-right for premium feel on some styles
  const composites = [
    { input: bar, top: 0, left: 0 },
    { input: logoResized.data, top: logoTop, left: logoLeft },
  ];
  if (style === 'gradient-frame' || style === 'soft-glow') {
    const mark = await sharp(markLogo.data).resize({ width: 54 }).png().toBuffer();
    composites.push({ input: mark, top: h - 70, left: w - 70 });
  }

  await sharp(canvas).composite(composites).jpeg({ quality: 92, mozjpeg: true }).toFile(outPath);
  return { outPath, wrote: true };
}

async function ensureSyntheticCoupons() {
  const variants = [
    { name: 'sm-raw-coupon500-grad-a.png', theme: 'coupon500', g: 'a' },
    { name: 'sm-raw-coupon500-grad-b.png', theme: 'coupon500', g: 'b' },
    { name: 'sm-raw-coupon500-grad-e.png', theme: 'coupon500', g: 'e' },
    { name: 'sm-raw-coupon1000-grad-a.png', theme: 'coupon1000', g: 'a' },
    { name: 'sm-raw-coupon1000-grad-b.png', theme: 'coupon1000', g: 'b' },
    { name: 'sm-raw-coupon1000-grad-c.png', theme: 'coupon1000', g: 'c' },
    { name: 'sm-raw-quality-grad-a.png', theme: 'quality', g: 'a' },
    { name: 'sm-raw-quality-grad-c.png', theme: 'quality', g: 'c' },
    { name: 'sm-raw-quality-grad-d.png', theme: 'quality', g: 'd' },
    { name: 'sm-raw-branding-grad-b.png', theme: 'branding', g: 'b' },
    { name: 'sm-raw-couples-grad-e.png', theme: 'couples', g: 'e' },
    { name: 'sm-raw-cod-grad-d.png', theme: 'cod', g: 'd' },
  ];
  for (const v of variants) {
    const p = path.join(RAW, v.name);
    try {
      await fs.access(p);
    } catch {
      const buf = await gradientBase(1080, 1440, v.g);
      await fs.writeFile(p, buf);
    }
  }
}

async function main() {
  console.log('Collecting raws…');
  let raws = await collectRaws();
  await ensureSyntheticCoupons();
  raws = (await fs.readdir(RAW)).filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));
  console.log(`Raw bases: ${raws.length}`);

  const lightLogo = await prepareLogo(LOGO_LIGHT, 400);
  const darkLogo = await prepareLogo(LOGO_DARK, 400);
  const markLogo = await prepareLogo(LOGO_MARK, 128);

  const manifest = [];
  let written = 0;
  let skipped = 0;
  const TARGET = Number(process.env.SM_TARGET || 400);

  // Prefer coupon1000 → coupon500 → photos → gradients (avoid TARGET starving coupons)
  const sorted = [...raws].sort((a, b) => {
    const ta = detectTheme(a);
    const tb = detectTheme(b);
    const tp = themePriority(ta) - themePriority(tb);
    if (tp !== 0) return tp;
    const ag = a.includes('grad') ? 1 : 0;
    const bg = b.includes('grad') ? 1 : 0;
    return ag - bg || a.localeCompare(b);
  });

  async function exportFileVariants(file, { respectTarget = true } = {}) {
    const basePath = path.join(RAW, file);
    const baseBuf = await fs.readFile(basePath);
    const baseName = file.replace(/\.[^.]+$/, '').replace(/^(ig-raw-|sm-raw-|banner-)/, '');
    const theme = detectTheme(file);
    const copies = THEME_COPY[theme] || THEME_COPY.quality;

    for (const style of STYLES) {
      if (respectTarget && written >= TARGET) return;
      for (let ci = 0; ci < copies.length; ci++) {
        if (respectTarget && written >= TARGET) return;
        const copyLimit = file.includes('grad') ? copies.length : Math.min(2, copies.length);
        if (ci >= copyLimit) continue;
        const copy = copies[ci];

        for (const format of FORMATS) {
          if (respectTarget && written >= TARGET) return;
          if (!file.includes('grad') && style === 'soft-glow' && format.id === 'landscape' && ci > 0) {
            continue;
          }
          const result = await exportOne({
            baseBuf,
            baseName,
            theme,
            copy,
            style,
            format,
            lightLogo,
            darkLogo,
            markLogo,
            index: `${ci + 1}`,
          });
          if (result.wrote) {
            written++;
            manifest.push({
              out: result.outPath,
              theme,
              style,
              format: format.id,
              copy: copy.title,
            });
            if (written % 20 === 0) console.log(`… wrote ${written} / ${TARGET}`);
          } else {
            skipped++;
          }
        }
      }
    }
  }

  // Always finish coupon1000 (+ coupon500) bases even if TARGET would cut them off
  const couponPriorityFiles = sorted.filter((f) => {
    const t = detectTheme(f);
    return t === 'coupon1000' || t === 'coupon500';
  });
  console.log(
    `Coupon priority bases: ${couponPriorityFiles.length} (coupon1000=${couponPriorityFiles.filter((f) => detectTheme(f) === 'coupon1000').length})`,
  );
  for (const file of couponPriorityFiles) {
    await exportFileVariants(file, { respectTarget: false });
  }

  for (const file of sorted) {
    if (written >= TARGET) break;
    if (detectTheme(file) === 'coupon1000' || detectTheme(file) === 'coupon500') continue;
    await exportFileVariants(file, { respectTarget: true });
  }

  // Extra coupon variants with unique names until target
  let extra = 0;
  while (written < TARGET) {
    const couponFiles = sorted.filter((f) => {
      const t = detectTheme(f);
      return t === 'coupon1000' || t === 'coupon500';
    });
    if (!couponFiles.length) break;
    const file = couponFiles[extra % couponFiles.length];
    const baseBuf = await fs.readFile(path.join(RAW, file));
    const theme = detectTheme(file);
    const copies = THEME_COPY[theme];
    const copy = copies[extra % copies.length];
    const style = STYLES[extra % STYLES.length];
    const format = FORMATS[extra % FORMATS.length];
    const result = await exportOne({
      baseBuf,
      baseName: `extra-${extra}`,
      theme,
      copy,
      style,
      format,
      lightLogo,
      darkLogo,
      markLogo,
      index: String(extra),
    });
    extra++;
    if (result.wrote) {
      written++;
      manifest.push({
        out: result.outPath,
        theme,
        style,
        format: format.id,
        copy: copy.title,
      });
    } else {
      skipped++;
    }
    if (extra > TARGET * 3) break;
  }

  await fs.writeFile(
    path.join(OUT, 'manifests/export-manifest.json'),
    JSON.stringify(
      { generatedAt: new Date().toISOString(), written, skipped, items: manifest },
      null,
      2,
    ),
  );

  for (const f of FORMATS) {
    const files = await fs.readdir(path.join(OUT, f.dir));
    const c1000 = files.filter((name) => name.startsWith('coupon1000_')).length;
    const c500 = files.filter((name) => name.startsWith('coupon500_')).length;
    console.log(`${f.id}: ${files.length} files (coupon1000=${c1000}, coupon500=${c500})`);
  }
  console.log(`DONE. Newly written: ${written}, skipped existing: ${skipped}`);
  console.log(`Output: ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
