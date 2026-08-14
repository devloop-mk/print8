import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const dir = process.argv[2];
if (!dir) throw new Error('usage: node check-image-alpha.mjs <dir>');

for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.png'))) {
  const p = path.join(dir, f);
  const meta = await sharp(p).metadata();
  const { data, info } = await sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let notFull = 0;
  let veryLow = 0;
  for (let i = 0; i < info.width * info.height; i++) {
    const a = data[i * 4 + 3];
    if (a < 255) notFull++;
    if (a < 128) veryLow++;
  }
  console.log(
    `${f}: ${meta.width}x${meta.height} channels=${meta.channels} hasAlpha=${meta.hasAlpha} alpha<255=${notFull} alpha<128=${veryLow}`,
  );
}
