import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { resolveCursorAssetsDir } from './lib/cursor-assets.mjs';

const ASSETS = resolveCursorAssetsDir();
const OUT = path.join(process.cwd(), 'public/NEW_DESIGNS/trending-mk');

const FILES = [
  { raw: 'trend-skopje-1963-raw.png', out: 'skopje-1963.png', title: 'Скопје 1963' },
  { raw: 'trend-rabotam-od-kafe-raw.png', out: 'rabotam-od-kafe.png', title: 'Работам од кафе' },
  { raw: 'trend-ne-mi-se-zboruva-raw.png', out: 'ne-mi-se-zboruva.png', title: 'Не ми се зборува' },
  { raw: 'trend-makedonija-raw.png', out: 'makedonija.png', title: 'Македонија' },
  { raw: 'trend-ponedelnik-raw.png', out: 'ponedelnik.png', title: 'Понеделник не постои' },
  { raw: 'trend-od-makedonija-raw.png', out: 'od-makedonija.png', title: 'Од Македонија со љубов' },
  { raw: 'trend-100-balkan-raw.png', out: '100-balkan.png', title: '100% Балкан' },
  { raw: 'trend-kje-bide-dobro-raw.png', out: 'kje-bide-dobro.png', title: 'Ќе биде добро' },
  { raw: 'trend-ne-pitaj-raw.png', out: 'ne-pitaj.png', title: 'Не прашај' },
  { raw: 'trend-machka-raw.png', out: 'machka.png', title: 'Мачка > луѓе' },
  { raw: 'trend-energija-kafe-raw.png', out: 'energija-kafe.png', title: 'Енергија кафе' },
  { raw: 'trend-tatko-mode-raw.png', out: 'tatko-mode.png', title: 'Татко mode ON' },
  { raw: 'trend-majka-profesija-raw.png', out: 'majka-profesija.png', title: 'Мајка е професија' },
  { raw: 'trend-nokna-smena-raw.png', out: 'nokna-smena.png', title: 'Ноќна смена на мозокот' },
  { raw: 'trend-ohrid-raw.png', out: 'ohrid.png', title: 'Охрид' },
  { raw: 'trend-glavata-me-boli-raw.png', out: 'glavata-me-boli.png', title: 'Главата ме боли од идеи' },
  { raw: 'trend-od-mkd-raw.png', out: 'od-mkd.png', title: 'Јас сум од МКД' },
  { raw: 'trend-posle-kafeto-raw.png', out: 'posle-kafeto.png', title: 'После кафето се гледаме' },
  { raw: 'trend-doma-raw.png', out: 'doma.png', title: 'Дома' },
  { raw: 'trend-zhivot-raw.png', out: 'zhivot.png', title: 'Живот подобар од филм' },
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

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const catalog = [];

  for (const item of FILES) {
    const input = path.join(ASSETS, item.raw);
    if (!fs.existsSync(input)) {
      console.warn(`Skip missing: ${item.raw}`);
      continue;
    }
    const output = path.join(OUT, item.out);
    await removeWhiteBackground(input, output);
    const meta = await sharp(output).metadata();
    const kb = Math.round(fs.statSync(output).size / 1024);
    console.log(`OK ${item.out} — ${meta.width}x${meta.height}, ${kb} KB`);
    catalog.push({
      id: item.out.replace(/\.png$/, ''),
      titleMk: item.title,
      file: `/NEW_DESIGNS/trending-mk/${item.out}`,
      width: meta.width,
      height: meta.height,
    });
  }

  fs.writeFileSync(
    path.join(OUT, 'catalog.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), items: catalog }, null, 2),
  );
  console.log(`Wrote catalog.json (${catalog.length} designs)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
