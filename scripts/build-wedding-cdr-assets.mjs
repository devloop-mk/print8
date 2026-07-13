import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const publicRoot = path.join(process.cwd(), 'public');
const weddingDir = path.join(publicRoot, 'NEW_DESIGNS', 'wedding');
const artDir = path.join(weddingDir, 'cdr-art');
const thumbDir = path.join(weddingDir, 'gallery-thumbs');

const ART_WIDTH = 1500;
const ART_HEIGHT = 2100;
const THUMB_WIDTH = 640;
const THUMB_HEIGHT = 896;

function toPublicPath(absPath) {
  return `/${path.relative(publicRoot, absPath).replace(/\\/g, '/')}`;
}

async function convertArtToWebp(svgName) {
  const input = path.join(artDir, svgName);
  const output = path.join(artDir, svgName.replace(/\.svg$/i, '.webp'));
  const svgStat = fs.statSync(input);
  if (fs.existsSync(output) && fs.statSync(output).mtimeMs >= svgStat.mtimeMs) {
    return output;
  }

  await sharp(input, { density: 150 })
    .resize(ART_WIDTH, ART_HEIGHT, {
      fit: 'inside',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .webp({ quality: 85, effort: 6 })
    .toFile(output);

  const kb = Math.round(fs.statSync(output).size / 1024);
  console.log(`Art  ${svgName} -> ${path.basename(output)} (${kb} KB)`);
  return output;
}

function patchWrapperToWebp(wrapperPath) {
  const original = fs.readFileSync(wrapperPath, 'utf8');
  const patched = original.replace(
    /(\/NEW_DESIGNS\/wedding\/cdr-art\/cdr-art-\d+)\.svg/g,
    '$1.webp',
  );
  if (patched !== original) {
    fs.writeFileSync(wrapperPath, patched);
    console.log(`Wrapper updated: ${path.basename(wrapperPath)}`);
  }
  return patched;
}

function textOnlyWrapperSvg(svg) {
  return svg
    .replace(/<rect[^>]*\/>/i, '')
    .replace(/<image\b[^>]*\/?>/i, '')
    .replace(/@import url\([^)]+\);?/g, '');
}

async function buildGalleryThumb(wrapperFile) {
  const wrapperPath = path.join(weddingDir, wrapperFile);
  const thumbName = wrapperFile.replace(/\.svg$/i, '.webp');
  const output = path.join(thumbDir, thumbName);

  const svg = patchWrapperToWebp(wrapperPath);
  const artMatch = svg.match(/href="(\/NEW_DESIGNS\/wedding\/cdr-art\/cdr-art-\d+\.webp)"/);
  if (!artMatch) {
    throw new Error(`No art reference in ${wrapperFile}`);
  }

  const artPath = path.join(publicRoot, artMatch[1].replace(/^\//, ''));
  const artLayer = await sharp(artPath)
    .resize(THUMB_WIDTH, THUMB_HEIGHT, { fit: 'fill' })
    .png()
    .toBuffer();

  const textSvg = textOnlyWrapperSvg(svg);
  const textLayer = await sharp(Buffer.from(textSvg), { density: 150 })
    .resize(THUMB_WIDTH, THUMB_HEIGHT, { fit: 'fill' })
    .png()
    .toBuffer();

  await sharp(artLayer)
    .composite([{ input: textLayer, top: 0, left: 0 }])
    .webp({ quality: 85, effort: 6 })
    .toFile(output);

  const kb = Math.round(fs.statSync(output).size / 1024);
  console.log(`Thumb ${wrapperFile} -> gallery-thumbs/${thumbName} (${kb} KB)`);
  return toPublicPath(output);
}

async function main() {
  fs.mkdirSync(thumbDir, { recursive: true });

  const artFiles = fs
    .readdirSync(artDir)
    .filter((file) => file.endsWith('.svg'))
    .sort();

  for (const artFile of artFiles) {
    await convertArtToWebp(artFile);
  }

  const wrappers = fs
    .readdirSync(weddingDir)
    .filter((file) => file.startsWith('wedding-cdr-') && file.endsWith('.svg'))
    .sort();

  const galleryPaths = {};
  for (const wrapper of wrappers) {
    galleryPaths[wrapper.replace(/\.svg$/i, '')] = await buildGalleryThumb(wrapper);
  }

  console.log('\nGallery image paths (for catalog.ts):');
  for (const [slug, publicPath] of Object.entries(galleryPaths)) {
    console.log(`  ${slug}: '${publicPath}',`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
