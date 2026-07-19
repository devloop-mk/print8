import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ASSETS = path.join(
  process.env.USERPROFILE ?? '',
  '.cursor/projects/c-Users-Viktor-Karabar-Desktop-print8-mk/assets',
);
const OUT = path.join(process.cwd(), 'public/NEW_DESIGNS/kids-birthday');

const FILES = [
  { raw: 'kids-rodendensko-dete-raw.png', out: 'rodendensko-dete.png', titleMk: 'Роденденско дете', titleEn: 'Birthday kid' },
  { raw: 'kids-rodendensko-momche-raw.png', out: 'rodendensko-momche.png', titleMk: 'Роденденско момче', titleEn: 'Birthday boy' },
  { raw: 'kids-rodendensko-devojche-raw.png', out: 'rodendensko-devojche.png', titleMk: 'Роденденско девојче', titleEn: 'Birthday girl' },
  { raw: 'kids-mama-na-rodendenskoto-raw.png', out: 'mama-na-rodendenskoto.png', titleMk: 'Мама на роденденското дете', titleEn: 'Mom of the birthday kid' },
  { raw: 'kids-tato-na-rodendenskoto-raw.png', out: 'tato-na-rodendenskoto.png', titleMk: 'Тато на роденденското дете', titleEn: 'Dad of the birthday kid' },
  { raw: 'kids-dino-rodenden-raw.png', out: 'dino-rodenden.png', titleMk: 'Дино роденден', titleEn: 'Dino birthday' },
  { raw: 'kids-svemirski-rodenden-raw.png', out: 'svemirski-rodenden.png', titleMk: 'Свемирски роденден', titleEn: 'Space birthday' },
  { raw: 'kids-ednorog-rodenden-raw.png', out: 'ednorog-rodenden.png', titleMk: 'Еднорог роденден', titleEn: 'Unicorn birthday' },
  { raw: 'kids-super-heroj-raw.png', out: 'super-heroj.png', titleMk: 'Супер херој', titleEn: 'Super hero' },
  { raw: 'kids-golem-brat-raw.png', out: 'golem-brat.png', titleMk: 'Голем брат', titleEn: 'Big brother' },
  { raw: 'kids-golema-sestra-raw.png', out: 'golema-sestra.png', titleMk: 'Голема сестра', titleEn: 'Big sister' },
  { raw: 'kids-malo-chudo-raw.png', out: 'malo-chudo.png', titleMk: 'Мало чудо', titleEn: 'Little miracle' },
  { raw: 'kids-igrach-raw.png', out: 'igrach.png', titleMk: 'Играч', titleEn: 'Player' },
  { raw: 'kids-shumsko-dete-raw.png', out: 'shumsko-dete.png', titleMk: 'Шумско дете', titleEn: 'Forest kid' },
  { raw: 'kids-denes-e-moj-den-raw.png', out: 'denes-e-moj-den.png', titleMk: 'Денес е мој ден', titleEn: 'Today is my day' },
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
      titleMk: item.titleMk,
      titleEn: item.titleEn,
      file: `/NEW_DESIGNS/kids-birthday/${item.out}`,
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
