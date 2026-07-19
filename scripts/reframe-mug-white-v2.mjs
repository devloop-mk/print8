/**
 * Reframe white classic mug to match milkyblue fill, write versioned asset.
 * White-on-white makes simple thresholds miss soft ceramic edges — we use
 * luminance + edge magnitude for the white source, and color threshold for
 * the milkyblue reference.
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'public/mugs');
const REF = 'mug-milkyblue.jpg';
const CURRENT = 'mug-white-classic.jpg';
const BACKUP = 'mug-white-classic.backup.jpg';
const OUT = 'mug-white-classic-v2.jpg';
/** Keep a copy of whatever is currently live before we replace. */
const CURRENT_SNAPSHOT = 'mug-white-classic.pre-v2.jpg';

async function loadRaw(file) {
  const full = path.join(dir, file);
  const meta = await sharp(full).metadata();
  const { data, info } = await sharp(full)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { full, meta, data, info };
}

/** Colored mugs: pixels darker than near-white background. */
function colorSubjectBox(data, info, thr = 245) {
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
      if (a < 10) continue;
      if (r >= thr && g >= thr && b >= thr) continue;
      count++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (count === 0) throw new Error('No colored subject found');
  return {
    minX,
    minY,
    maxX,
    maxY,
    bw: maxX - minX + 1,
    bh: maxY - minY + 1,
    count,
    fillW: (maxX - minX + 1) / w,
    fillH: (maxY - minY + 1) / h,
    pad: {
      top: minY,
      bottom: h - 1 - maxY,
      left: minX,
      right: w - 1 - maxX,
    },
  };
}

/**
 * White mug: combine (a) not-pure-white pixels and (b) Sobel edges so soft
 * ceramic shading still counts without eating the whole canvas.
 */
function whiteSubjectBox(data, info, { edgeThr = 14, bgMax = 252 } = {}) {
  const w = info.width;
  const h = info.height;
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    lum[i] = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
  }

  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  let count = 0;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const o = i * 4;
      const r = data[o];
      const g = data[o + 1];
      const b = data[o + 2];
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const notFlatBg = !(maxC >= bgMax && minC >= bgMax - 2 && maxC - minC <= 4);

      const gx =
        -lum[i - w - 1] -
        2 * lum[i - 1] -
        lum[i + w - 1] +
        lum[i - w + 1] +
        2 * lum[i + 1] +
        lum[i + w + 1];
      const gy =
        -lum[i - w - 1] -
        2 * lum[i - w] -
        lum[i - w + 1] +
        lum[i + w - 1] +
        2 * lum[i + w] +
        lum[i + w + 1];
      const mag = Math.hypot(gx, gy);

      if (notFlatBg || mag >= edgeThr) {
        count++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (count === 0) throw new Error('No white-mug subject found');
  return {
    minX,
    minY,
    maxX,
    maxY,
    bw: maxX - minX + 1,
    bh: maxY - minY + 1,
    count,
    fillW: (maxX - minX + 1) / w,
    fillH: (maxY - minY + 1) / h,
    pad: {
      top: minY,
      bottom: h - 1 - maxY,
      left: minX,
      right: w - 1 - maxX,
    },
  };
}

function pct(n) {
  return `${(n * 100).toFixed(1)}%`;
}

function printBox(label, box, canvasW, canvasH) {
  console.log(
    `${label}: canvas ${canvasW}x${canvasH} fill=${pct(box.fillW)}×${pct(box.fillH)} ` +
      `box=${box.bw}x${box.bh} pad(t/b/l/r)=${box.pad.top}/${box.pad.bottom}/${box.pad.left}/${box.pad.right}`,
  );
}

async function main() {
  const ref = await loadRaw(REF);
  const refBox = colorSubjectBox(ref.data, ref.info, 245);
  printBox('REF milkyblue', refBox, ref.info.width, ref.info.height);

  // Prefer original backup for a single upscale; fall back to current.
  const sourceName = fs.existsSync(path.join(dir, BACKUP)) ? BACKUP : CURRENT;
  const source = await loadRaw(sourceName);
  const whiteBox = whiteSubjectBox(source.data, source.info);
  printBox(`SRC ${sourceName}`, whiteBox, source.info.width, source.info.height);

  // Snapshot current live asset before we change catalog to v2
  const currentPath = path.join(dir, CURRENT);
  const snapshotPath = path.join(dir, CURRENT_SNAPSHOT);
  if (fs.existsSync(currentPath) && !fs.existsSync(snapshotPath)) {
    fs.copyFileSync(currentPath, snapshotPath);
    console.log(`Snapshot: ${CURRENT_SNAPSHOT}`);
  }

  // Ensure backup exists
  if (!fs.existsSync(path.join(dir, BACKUP))) {
    fs.copyFileSync(currentPath, path.join(dir, BACKUP));
    console.log(`Backup written: ${BACKUP}`);
  }

  const outW = ref.info.width;
  const outH = ref.info.height;

  // Match milkyblue ~72%×64% with a small boost (soft white edges under-read on-page).
  const SCALE_BOOST = 1.06;
  const targetFillH = Math.min(0.7, refBox.fillH * SCALE_BOOST);
  const targetFillW = Math.min(0.78, refBox.fillW * SCALE_BOOST);

  const subjectAspect = whiteBox.bw / whiteBox.bh;
  let targetH = Math.round(outH * targetFillH);
  let targetW = Math.round(targetH * subjectAspect);
  const maxW = Math.round(outW * targetFillW);
  if (targetW > maxW) {
    targetW = maxW;
    targetH = Math.round(targetW / subjectAspect);
  }

  const left = whiteBox.minX;
  const top = whiteBox.minY;
  const extractW = whiteBox.bw;
  const extractH = whiteBox.bh;

  const subjectBuf = await sharp(source.full)
    .extract({ left, top, width: extractW, height: extractH })
    .resize(targetW, targetH, { fit: 'fill', kernel: 'lanczos3' })
    .toBuffer();

  // Match milkyblue padding bias (handle sits toward the right).
  const refPadTopRatio =
    refBox.pad.top / (refBox.pad.top + refBox.pad.bottom || 1);
  const refPadLeftRatio =
    refBox.pad.left / (refBox.pad.left + refBox.pad.right || 1);
  const freeH = outH - targetH;
  const freeW = outW - targetW;
  const topPad = Math.max(0, Math.round(freeH * refPadTopRatio));
  const leftPad = Math.max(0, Math.round(freeW * refPadLeftRatio));

  const bg = { r: 255, g: 255, b: 255 };

  const outPath = path.join(dir, OUT);
  const tmpPath = path.join(dir, `${OUT}.tmp`);
  await sharp({
    create: {
      width: outW,
      height: outH,
      channels: 3,
      background: bg,
    },
  })
    .composite([{ input: subjectBuf, left: leftPad, top: topPad }])
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(tmpPath);

  if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
  fs.renameSync(tmpPath, outPath);

  console.log(
    `Wrote ${OUT}: subject ${targetW}x${targetH} at (${leftPad},${topPad}) ` +
      `targetFill≈${pct(targetFillW)}×${pct(targetFillH)}`,
  );

  // Verify with same detectors
  const out = await loadRaw(OUT);
  const outWhite = whiteSubjectBox(out.data, out.info);
  const outColor = colorSubjectBox(out.data, out.info, 250);
  printBox('OUT white-edge', outWhite, out.info.width, out.info.height);
  printBox('OUT thr250', outColor, out.info.width, out.info.height);
  printBox('REF milkyblue', refBox, ref.info.width, ref.info.height);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
