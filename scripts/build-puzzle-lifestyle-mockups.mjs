/**
 * Lifestyle puzzle mockups — composited onto reference scenes (marble / wood)
 * using the real supplier puzzle piece grids + a family-style sample print.
 *
 *   node scripts/build-puzzle-lifestyle-mockups.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const SUPPLIER_DIR = path.join(ROOT, 'public', 'supplier', 'koni');
const OUT_DIR = path.join(ROOT, 'public', 'puzzles');
const SCENES_DIR = path.join(OUT_DIR, 'scenes');
const SAMPLES_DIR = path.join(OUT_DIR, 'samples');

const MARBLE_SCENE = path.join(SCENES_DIR, 'marble-table-ref.png');
const WOOD_HEART_SCENE = path.join(SCENES_DIR, 'wood-heart-ref.png');

const MARBLE_W = 556;
const MARBLE_H = 359;

const PUZZLES = [
  {
    id: 'puzzle-a4',
    sku: 'PTA4',
    scene: 'marble',
    layout: { width: 500, top: 22, left: 26 },
    shaped: false,
  },
  {
    id: 'puzzle-a5',
    sku: 'PTA5',
    scene: 'marble',
    layout: { width: 500, top: 22, left: 26 },
    shaped: false,
  },
  {
    id: 'puzzle-heart',
    sku: 'PTA8',
    scene: 'heart',
    layout: { width: 265, top: 92, left: 91 },
    shaped: true,
  },
  {
    id: 'puzzle-a4-wood',
    sku: 'PTA4-M1',
    scene: 'marble',
    layout: { width: 500, top: 22, left: 26 },
    shaped: false,
  },
];

function supplierPath(sku) {
  const file = `${sku.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-')}.jpg`;
  return path.join(SUPPLIER_DIR, file);
}

async function trimWhiteMargin(inputBuf) {
  return sharp(inputBuf)
    .trim({ background: '#ffffff', threshold: 14 })
    .toBuffer();
}

async function ensureFamilySample() {
  fs.mkdirSync(SAMPLES_DIR, { recursive: true });
  const out = path.join(SAMPLES_DIR, 'family-portrait.jpg');
  if (fs.existsSync(out)) return out;

  await sharp(MARBLE_SCENE)
    .extract({ left: 90, top: 55, width: 360, height: 240 })
    .jpeg({ quality: 92 })
    .toFile(out);
  return out;
}

/** Flood-fill exterior white on a blank supplier image → alpha mask (opaque = puzzle). */
async function puzzleMaskFromBlank(blankPath) {
  const { data, info } = await sharp(blankPath)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const visited = new Uint8Array(w * h);
  const queue = [];

  function isExteriorWhite(px) {
    return data[px] > 238;
  }

  for (let x = 0; x < w; x++) {
    queue.push(x, 0, x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    queue.push(0, y, w - 1, y);
  }

  for (let i = 0; i < queue.length; i += 2) {
    const x = queue[i];
    const y = queue[i + 1];
    if (x < 0 || x >= w || y < 0 || y >= h) continue;
    const idx = y * w + x;
    if (visited[idx]) continue;
    if (!isExteriorWhite(idx)) continue;
    visited[idx] = 1;
    queue.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }

  const rgba = Buffer.alloc(w * h * 4);
  for (let idx = 0; idx < w * h; idx++) {
    const v = visited[idx] ? 0 : 255;
    rgba[idx * 4] = v;
    rgba[idx * 4 + 1] = v;
    rgba[idx * 4 + 2] = v;
    rgba[idx * 4 + 3] = v;
  }

  return sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toBuffer();
}

async function applyPuzzleMask(printedBuf, maskBuf) {
  return sharp(printedBuf)
    .composite([{ input: maskBuf, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

async function buildPrintedFromBlank(blankPath, samplePath, outPath, shaped) {
  const meta = await sharp(blankPath).metadata();
  const width = meta.width ?? 1200;
  const height = meta.height ?? 1200;

  const sampleBuf = await sharp(samplePath)
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .toBuffer();

  const blankBuf = await sharp(blankPath).ensureAlpha().toBuffer();

  let printedBuf = await sharp(sampleBuf)
    .composite([{ input: blankBuf, blend: 'multiply' }])
    .png()
    .toBuffer();

  if (shaped) {
    const maskBuf = await puzzleMaskFromBlank(blankPath);
    printedBuf = await applyPuzzleMask(printedBuf, maskBuf);
    await sharp(printedBuf).png().toFile(outPath);
    return;
  }

  await sharp(printedBuf)
    .jpeg({ quality: 94, mozjpeg: true })
    .toFile(outPath);
}

async function resizeTrimmedPuzzle(puzzlePath, targetWidth, shaped) {
  let buf = await sharp(puzzlePath).png().toBuffer();
  if (!shaped) {
    buf = await trimWhiteMargin(buf);
  }

  return sharp(buf)
    .resize(targetWidth, null, {
      fit: 'inside',
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();
}

async function fitPuzzleBuffer(puzzleBuf, maxWidth, maxHeight) {
  return sharp(puzzleBuf)
    .resize(maxWidth, maxHeight, {
      fit: 'inside',
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();
}

async function sceneTexturePatch(scenePath, extract, targetW, targetH) {
  return sharp(scenePath)
    .extract(extract)
    .resize(targetW, targetH, { fit: 'cover', position: 'centre' })
    .blur(0.35)
    .toBuffer();
}

async function puzzleShadow(puzzleBuf, blur = 10, brightness = 0.38) {
  return sharp(puzzleBuf)
    .ensureAlpha()
    .blur(blur)
    .modulate({ brightness })
    .toBuffer();
}

async function buildMarbleBackground() {
  return sceneTexturePatch(
    MARBLE_SCENE,
    { left: 2, top: 2, width: 120, height: 60 },
    MARBLE_W,
    MARBLE_H,
  );
}

async function buildMarbleScene(puzzleBuf, layout) {
  const marbleBg = await buildMarbleBackground();

  const maxH = MARBLE_H - layout.top - 6;
  const fitted = await fitPuzzleBuffer(puzzleBuf, layout.width, maxH);

  const puzzleMeta = await sharp(fitted).metadata();
  const pw = puzzleMeta.width ?? layout.width;
  const ph = puzzleMeta.height ?? layout.width;

  const left = layout.left ?? Math.round((MARBLE_W - pw) / 2);
  const top = layout.top ?? Math.round((MARBLE_H - ph) / 2);

  const shadowBuf = await puzzleShadow(fitted);

  return sharp(marbleBg)
    .composite([
      { input: shadowBuf, left: left + 5, top: top + 7 },
      { input: fitted, left, top },
    ])
    .jpeg({ quality: 93, mozjpeg: true });
}

async function buildHeartScene(puzzleBuf, layout) {
  const w = 447;
  const h = 447;

  const woodBg = await sceneTexturePatch(
    WOOD_HEART_SCENE,
    { left: 155, top: 8, width: 130, height: 32 },
    w,
    h,
  );

  const cornerProps = [
  { input: await sharp(WOOD_HEART_SCENE).extract({ left: 0, top: 0, width: 140, height: 130 }).toBuffer(), left: 0, top: 0 },
  { input: await sharp(WOOD_HEART_SCENE).extract({ left: w - 140, top: 0, width: 140, height: 130 }).toBuffer(), left: w - 140, top: 0 },
  { input: await sharp(WOOD_HEART_SCENE).extract({ left: w - 120, top: h - 120, width: 120, height: 120 }).toBuffer(), left: w - 120, top: h - 120 },
  ];

  const maxH = h - layout.top - 10;
  const fitted = await fitPuzzleBuffer(puzzleBuf, layout.width, maxH);

  const puzzleMeta = await sharp(fitted).metadata();
  const pw = puzzleMeta.width ?? layout.width;
  const ph = puzzleMeta.height ?? layout.width;

  const left = layout.left ?? Math.round((w - pw) / 2);
  const top = layout.top ?? Math.round((h - ph) / 2);

  const shadowBuf = await puzzleShadow(fitted, 8, 0.32);

  const handLeft = await sharp(WOOD_HEART_SCENE)
    .extract({ left: 0, top: 58, width: 72, height: 115 })
    .toBuffer();
  const handRight = await sharp(WOOD_HEART_SCENE)
    .extract({ left: w - 78, top: 58, width: 78, height: 115 })
    .toBuffer();

  return sharp(woodBg)
    .composite([
      ...cornerProps,
      { input: shadowBuf, left: left + 4, top: top + 6 },
      { input: fitted, left, top },
      { input: handLeft, left: 0, top: 58 },
      { input: handRight, left: w - 78, top: 58 },
    ])
    .jpeg({ quality: 93, mozjpeg: true });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  if (!fs.existsSync(MARBLE_SCENE) || !fs.existsSync(WOOD_HEART_SCENE)) {
    throw new Error(
      'Missing reference scenes in public/puzzles/scenes/ (marble-table-ref.png, wood-heart-ref.png)',
    );
  }

  const familySample = await ensureFamilySample();

  for (const puzzle of PUZZLES) {
    const blankPath = supplierPath(puzzle.sku);
    if (!fs.existsSync(blankPath)) {
      console.warn(`Skip ${puzzle.id} — missing ${blankPath}`);
      continue;
    }

    const printedPath = path.join(
      OUT_DIR,
      `${puzzle.id}-printed${puzzle.shaped ? '.png' : '.jpg'}`,
    );
    const lifestylePath = path.join(OUT_DIR, `${puzzle.id}-lifestyle.jpg`);

    await buildPrintedFromBlank(
      blankPath,
      familySample,
      printedPath,
      puzzle.shaped,
    );

    const puzzleBuf = await resizeTrimmedPuzzle(
      printedPath,
      puzzle.layout.width,
      puzzle.shaped,
    );

    if (puzzle.scene === 'heart') {
      await (await buildHeartScene(puzzleBuf, puzzle.layout)).toFile(
        lifestylePath,
      );
    } else {
      await (await buildMarbleScene(puzzleBuf, puzzle.layout)).toFile(
        lifestylePath,
      );
    }

    console.log(`${puzzle.id} -> ${path.relative(ROOT, lifestylePath)}`);
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
