import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { resolveCursorAssetsDir } from './lib/cursor-assets.mjs';

const ASSETS = resolveCursorAssetsDir();

const MUG_OUT = path.join(process.cwd(), 'public/NEW_DESIGNS/drinkware');
const CAP_OUT = path.join(process.cwd(), 'public/NEW_DESIGNS/caps');

const MUG_FILES = [
  { match: /^mug-stip-isar-raw\.png$/i, out: 'mug-stip-isar.png', titleMk: 'Штип — Исар', titleEn: 'Štip — Isar' },
  { match: /^mug-stip-stamp-raw\.png$/i, out: 'mug-stip-stamp.png', titleMk: 'Штип печат', titleEn: 'Štip stamp' },
  { match: /^mug-stip-pastrmajlija-raw\.png$/i, out: 'mug-stip-pastrmajlija.png', titleMk: 'Штипска пастрмајлија', titleEn: 'Štip pastrmajlija' },
  { match: /^mug-stip-karakter-raw\.png$/i, out: 'mug-stip-karakter.png', titleMk: 'Штип — од исток со карактер', titleEn: 'Štip — east with character' },
  { match: /^mug-od-stip-ljubov-raw\.png$/i, out: 'mug-od-stip-ljubov.png', titleMk: 'Од Штип со љубов', titleEn: 'From Štip with love' },
  { match: /^mug-makedonija-src/i, out: 'mug-makedonija-srce.png', titleMk: 'Македонија од срце', titleEn: 'Macedonia from the heart' },
  { match: /^mug-skopje-raw\.png$/i, out: 'mug-skopje.png', titleMk: 'Скопје', titleEn: 'Skopje' },
  { match: /^mug-ohrid-raw\.png$/i, out: 'mug-ohrid.png', titleMk: 'Охрид', titleEn: 'Ohrid' },
  { match: /^mug-kafe-od-stip-raw\.png$/i, out: 'mug-kafe-od-stip.png', titleMk: 'Кафе од Штип', titleEn: 'Coffee from Štip' },
];

const CAP_FILES = [
  { match: /^cap-makedonija-raw\.png$/i, out: 'cap-makedonija.png', titleMk: 'Македонија', titleEn: 'Macedonia' },
  { match: /^cap-stip-raw\.png$/i, out: 'cap-stip.png', titleMk: 'Штип', titleEn: 'Štip' },
  { match: /^cap-mkd-raw\.png$/i, out: 'cap-mkd.png', titleMk: 'МКД', titleEn: 'MKD' },
  { match: /^cap-100-balkan-raw\.png$/i, out: 'cap-100-balkan.png', titleMk: '100% Балкан', titleEn: '100% Balkan' },
  { match: /^cap-skopje-raw\.png$/i, out: 'cap-skopje.png', titleMk: 'Скопје', titleEn: 'Skopje' },
  { match: /^cap-ohrid-raw\.png$/i, out: 'cap-ohrid.png', titleMk: 'Охрид', titleEn: 'Ohrid' },
  { match: /^cap-istok-stip-raw\.png$/i, out: 'cap-istok-stip.png', titleMk: 'Исток — Штип', titleEn: 'East — Štip' },
];

async function removeWhiteBackground(inputPath, outputPath, threshold = 245) {
  const image = sharp(inputPath).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const pixels = Buffer.from(data);

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    if (r >= threshold && g >= threshold && b >= threshold) {
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

function resolveRaw(match) {
  const files = fs.readdirSync(ASSETS);
  return files.find((name) => match.test(name));
}

async function processGroup(specs, outDir, prefix) {
  fs.mkdirSync(outDir, { recursive: true });
  const catalog = [];

  for (const item of specs) {
    const rawName = resolveRaw(item.match);
    if (!rawName) {
      console.warn(`Skip missing: ${item.match}`);
      continue;
    }
    const input = path.join(ASSETS, rawName);
    const output = path.join(outDir, item.out);
    await removeWhiteBackground(input, output);
    const meta = await sharp(output).metadata();
    const kb = Math.round(fs.statSync(output).size / 1024);
    console.log(`OK ${prefix}/${item.out} — ${meta.width}x${meta.height}, ${kb} KB`);
    catalog.push({
      id: item.out.replace(/\.png$/, ''),
      titleMk: item.titleMk,
      titleEn: item.titleEn,
      file: `/NEW_DESIGNS/${prefix}/${item.out}`,
    });
  }

  return catalog;
}

async function main() {
  const mugs = await processGroup(MUG_FILES, MUG_OUT, 'drinkware');
  const caps = await processGroup(CAP_FILES, CAP_OUT, 'caps');

  fs.writeFileSync(
    path.join(MUG_OUT, 'local-mk-catalog.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), items: mugs }, null, 2),
  );
  fs.writeFileSync(
    path.join(CAP_OUT, 'catalog.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), items: caps }, null, 2),
  );

  console.log(`Mugs: ${mugs.length}, Caps: ${caps.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
