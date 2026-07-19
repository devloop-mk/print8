import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const dir = path.join(process.cwd(), 'public/mugs');
const WHITE = 'mug-white-classic.jpg';
const REF = 'mug-milkyblue.jpg'; // best-framed reference from admin screenshot
const BACKUP = 'mug-white-classic.backup.jpg';

async function subjectBox(file, threshold = 245) {
  const p = path.join(dir, file);
  const meta = await sharp(p).metadata();
  const { data, info } = await sharp(p)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  let count = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      const isBg = a < 10 || (r >= threshold && g >= threshold && b >= threshold);
      if (!isBg) {
        count++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (count === 0) throw new Error(`No subject found in ${file}`);
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  return {
    file,
    bytes: fs.statSync(p).size,
    width: meta.width,
    height: meta.height,
    subject: { minX, minY, maxX, maxY, bw, bh },
    fillPct: { w: +(bw / w * 100).toFixed(1), h: +(bh / h * 100).toFixed(1) },
    pad: { top: minY, bottom: h - 1 - maxY, left: minX, right: w - 1 - maxX },
  };
}

function printBox(label, box) {
  console.log(
    `${label}: ${box.width}x${box.height} fill=${box.fillPct.w}%x${box.fillPct.h}% ` +
      `pad(t/b/l/r)=${box.pad.top}/${box.pad.bottom}/${box.pad.left}/${box.pad.right} ` +
      `subject=${box.subject.bw}x${box.subject.bh}`,
  );
}

/**
 * Crop white mug subject and place it on a white canvas matching reference
 * fill percentage / padding proportions.
 */
async function reframeWhiteToMatchRef(whiteBox, refBox) {
  const sourcePath = path.join(dir, BACKUP);
  const outPath = path.join(dir, WHITE);

  if (!fs.existsSync(sourcePath)) {
    // First run: back up current asset, then use it as source
    fs.copyFileSync(outPath, sourcePath);
    console.log(`Backup written: ${BACKUP}`);
  } else {
    console.log(`Using backup source: ${BACKUP}`);
  }

  // Match reference canvas size (1000x1000 for blue/black)
  const outW = refBox.width;
  const outH = refBox.height;

  // Slightly overshoot fill so soft white ceramic edges read similarly to colored mugs
  const SCALE_BOOST = 1.06;
  const targetFillH = Math.min(0.78, (refBox.fillPct.h / 100) * SCALE_BOOST);
  const targetFillW = Math.min(0.86, (refBox.fillPct.w / 100) * SCALE_BOOST);

  const subjectAspect = whiteBox.subject.bw / whiteBox.subject.bh;
  let targetSubjectH = Math.round(outH * targetFillH);
  let targetSubjectW = Math.round(targetSubjectH * subjectAspect);
  const maxSubjectW = Math.round(outW * targetFillW);
  if (targetSubjectW > maxSubjectW) {
    targetSubjectW = maxSubjectW;
    targetSubjectH = Math.round(targetSubjectW / subjectAspect);
  }

  // Extract subject with a tiny margin so soft edges aren't clipped
  const margin = 6;
  const left = Math.max(0, whiteBox.subject.minX - margin);
  const top = Math.max(0, whiteBox.subject.minY - margin);
  const right = Math.min(whiteBox.width - 1, whiteBox.subject.maxX + margin);
  const bottom = Math.min(whiteBox.height - 1, whiteBox.subject.maxY + margin);
  const extractW = right - left + 1;
  const extractH = bottom - top + 1;

  const subjectBuf = await sharp(sourcePath)
    .extract({ left, top, width: extractW, height: extractH })
    .resize(targetSubjectW, targetSubjectH, { fit: 'fill', kernel: 'lanczos3' })
    .toBuffer();

  // Match ref padding bias (colored mugs sit slightly left so handle approaches right edge)
  const refPadTopRatio =
    refBox.pad.top / (refBox.pad.top + refBox.pad.bottom || 1);
  const refPadLeftRatio =
    refBox.pad.left / (refBox.pad.left + refBox.pad.right || 1);
  const freeH = outH - targetSubjectH;
  const freeW = outW - targetSubjectW;
  const topPad = Math.max(0, Math.round(freeH * refPadTopRatio));
  const leftPad = Math.max(0, Math.round(freeW * refPadLeftRatio));

  const tmpPath = path.join(dir, 'mug-white-classic.reframed.tmp.jpg');
  await sharp({
    create: {
      width: outW,
      height: outH,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([{ input: subjectBuf, left: leftPad, top: topPad }])
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(tmpPath);

  // Windows often locks the public asset; rename swap is more reliable than overwrite
  const swapOld = path.join(dir, 'mug-white-classic.swap-old.jpg');
  if (fs.existsSync(outPath)) {
    try {
      fs.renameSync(outPath, swapOld);
    } catch {
      // If rename fails, try unlink
      try {
        fs.unlinkSync(outPath);
      } catch {
        /* keep going — final rename may still work */
      }
    }
  }
  fs.renameSync(tmpPath, outPath);
  if (fs.existsSync(swapOld)) {
    try {
      fs.unlinkSync(swapOld);
    } catch {
      console.warn('Could not delete swap-old; safe to remove manually.');
    }
  }

  console.log(
    `Wrote reframed ${WHITE}: canvas ${outW}x${outH}, subject ${targetSubjectW}x${targetSubjectH}, ` +
      `offset (${leftPad},${topPad})`,
  );
}

const mode = process.argv[2] || 'measure';

const files = [
  'mug-white-classic.jpg',
  'mug-milkyblue.jpg',
  'mug-black.jpg',
  'mug-white.jpg',
  'mug-frosted.jpg',
];

const boxes = {};
for (const f of files) {
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) {
    console.log(`MISSING ${f}`);
    continue;
  }
  // White mug needs slightly lower threshold so pale ceramic still counts as subject
  const thr = f.includes('white') || f.includes('frosted') ? 250 : 245;
  boxes[f] = await subjectBox(f, thr);
  printBox(f, boxes[f]);
}

if (mode === 'fix') {
  // Always analyze the original backup for subject bounds (not a previously reframed file)
  const sourceForDetect = fs.existsSync(path.join(dir, BACKUP))
    ? path.join(dir, BACKUP)
    : path.join(dir, WHITE);
  let whiteBox = await subjectBox(path.basename(sourceForDetect), 250);
  whiteBox.file = WHITE;
  // Re-detect white with threshold that captures soft shadows/edges of white ceramic
  const { data, info } = await sharp(sourceForDetect)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  let count = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Subject = not pure white / near-white flat bg. Keep pixels that are slightly off-white
      // (shadows, ceramic shading) OR have noticeable channel difference.
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const isBg = maxC >= 252 && minC >= 250 && maxC - minC <= 3;
      if (!isBg) {
        count++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  whiteBox = {
    ...whiteBox,
    subject: {
      minX,
      minY,
      maxX,
      maxY,
      bw: maxX - minX + 1,
      bh: maxY - minY + 1,
    },
    fillPct: {
      w: +(((maxX - minX + 1) / w) * 100).toFixed(1),
      h: +(((maxY - minY + 1) / h) * 100).toFixed(1),
    },
    pad: {
      top: minY,
      bottom: h - 1 - maxY,
      left: minX,
      right: w - 1 - maxX,
    },
  };
  console.log('--- refined white subject ---');
  printBox(WHITE + ' (refined)', whiteBox);
  console.log(`subject pixels: ${count}`);

  await reframeWhiteToMatchRef(whiteBox, boxes[REF]);

  // Verify after
  const after = await subjectBox(WHITE, 250);
  // refined verify
  console.log('--- after ---');
  printBox(WHITE + ' (after thr250)', after);
  printBox(REF + ' (ref)', boxes[REF]);
  printBox('mug-black.jpg (ref2)', boxes['mug-black.jpg']);
}
