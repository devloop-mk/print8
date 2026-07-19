import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ASSETS = path.join(
  process.env.USERPROFILE ?? '',
  '.cursor/projects/c-Users-Viktor-Karabar-Desktop-print8-mk/assets',
);
const OUT = path.join(process.cwd(), 'public/NEW_DESIGNS/couple-street');
const DESKTOP = path.join(
  process.env.USERPROFILE ?? '',
  'Desktop',
  'print8-couple-street-designs',
);

const WHITE_BG = [
  'couple-born-driver-raw.png',
  'couple-born-passenger-raw.png',
  'couple-mk-vozach-raw.png',
  'couple-mk-princeza-raw.png',
  'couple-always-yours-raw.png',
  'couple-forever-mine-raw.png',
  'street-berry-sportscar-raw.png',
  'street-coffee-stack-raw.png',
];

const BLACK_BG = [
  'couple-the-boss-raw.png',
  'couple-the-real-boss-raw.png',
  'couple-shefot-raw.png',
  'couple-vistinski-shefot-raw.png',
  'couple-me-too-cat-raw.png',
  'couple-only-you-mouse-raw.png',
  'street-track-beast-raw.png',
  'street-racer-stack-raw.png',
];

async function removeNearColor(inputPath, outputPath, mode) {
  const threshold = 245;
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixels = Buffer.from(data);

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    if (mode === 'white') {
      if (r >= threshold && g >= threshold && b >= threshold) pixels[i + 3] = 0;
    } else if (r <= 255 - threshold && g <= 255 - threshold && b <= 255 - threshold) {
      pixels[i + 3] = 0;
    }
  }

  await sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 8 })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(outputPath);
}

async function processList(list, mode) {
  for (const raw of list) {
    const input = path.join(ASSETS, raw);
    if (!fs.existsSync(input)) {
      console.warn('Skip missing', raw);
      continue;
    }
    const outName = raw.replace(/-raw\.png$/i, '.png');
    const output = path.join(OUT, outName);
    await removeNearColor(input, output, mode);
    fs.copyFileSync(output, path.join(DESKTOP, outName));
    const meta = await sharp(output).metadata();
    console.log(`OK ${outName} ${meta.width}x${meta.height} (${mode})`);
  }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(DESKTOP, { recursive: true });
  await processList(WHITE_BG, 'white');
  await processList(BLACK_BG, 'black');

  const readme = `Print 8 — Couple & streetwear print designs
========================================

Transparent PNGs for DTG / print.

COUPLE SETS
- born-to-be driver + passenger princess (EN)
- роден да биде возач + родена да биде принцеза совозач (MK)
- THE BOSS + THE Real BOSS (dark shirts)
- ШЕФОТ + Вистинскиот ШЕФОТ (dark shirts)
- ME TOO cat + ONLY YOU mouse (original characters, not Tom & Jerry)
- always yours + forever mine

STREET / GRAPHIC
- Berry Sports Car (original car art — no brand logos)
- Track Beast tech sheet (original — no Porsche)
- COFFEE stacked collage
- RACER stacked collage

NOTE: Trademarked designs from your references (Porsche, Tom & Jerry,
Hello Kitty, Spider-Man) were NOT copied. Original lookalikes were made instead.

Website folder: public/NEW_DESIGNS/couple-street/
`;
  fs.writeFileSync(path.join(DESKTOP, 'README.txt'), readme, 'utf8');
  console.log('Desktop:', DESKTOP);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
