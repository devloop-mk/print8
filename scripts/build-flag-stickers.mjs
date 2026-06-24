import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const FLAG_MAP = {
  'flag-mk': 'mk',
  'flag-al': 'al',
  'flag-rs': 'rs',
  'flag-bg': 'bg',
  'flag-gr': 'gr',
  'flag-hr': 'hr',
  'flag-xk': 'xk',
  'flag-eu': 'eu',
  'flag-us': 'us',
  'flag-gb': 'gb',
  'flag-de': 'de',
  'flag-tr': 'tr',
  'flag-it': 'it',
  'flag-si': 'si',
  'flag-me': 'me',
  'flag-ba': 'ba',
  'flag-ro': 'ro',
  'flag-fr': 'fr',
  'flag-es': 'es',
  'flag-nl': 'nl',
  'flag-ch': 'ch',
  'flag-at': 'at',
  'flag-pl': 'pl',
  'flag-pt': 'pt',
  'flag-ua': 'ua',
  'flag-ca': 'ca',
  'flag-au': 'au',
  'flag-br': 'br',
  'flag-jp': 'jp',
  'flag-in': 'in',
  'flag-kr': 'kr',
  'flag-cn': 'cn',
  'flag-ae': 'ae',
  'flag-mx': 'mx',
};

const sourceDir = path.join(root, 'node_modules', 'flag-icons', 'flags', '1x1');
const outDir = path.join(root, 'public', 'stickers');

function extractSvgInner(svg) {
  const openEnd = svg.indexOf('>');
  const closeStart = svg.lastIndexOf('</svg>');
  if (openEnd === -1 || closeStart === -1) {
    throw new Error('Invalid SVG markup');
  }
  return svg.slice(openEnd + 1, closeStart).trim();
}

function getViewBox(svg) {
  const match = svg.match(/viewBox="([^"]+)"/);
  return match?.[1] ?? '0 0 512 512';
}

function buildSticker(outName, code) {
  const sourcePath = path.join(sourceDir, `${code}.svg`);
  const source = fs.readFileSync(sourcePath, 'utf8');
  const inner = extractSvgInner(source);
  const viewBox = getViewBox(source);
  const clipId = `${code}-clip`;

  const needsXlink = inner.includes('xlink:') || inner.includes('href="#');

  const sticker = `<svg xmlns="http://www.w3.org/2000/svg"${
    needsXlink ? ' xmlns:xlink="http://www.w3.org/1999/xlink"' : ''
  } viewBox="0 0 200 200">
  <defs><clipPath id="${clipId}"><circle cx="100" cy="100" r="88"/></clipPath></defs>
  <g clip-path="url(#${clipId})">
    <svg x="12" y="12" width="176" height="176" viewBox="${viewBox}">
${inner}
    </svg>
  </g>
  <circle cx="100" cy="100" r="88" fill="none" stroke="#E5E7EB" stroke-width="4"/>
</svg>
`;

  fs.writeFileSync(path.join(outDir, `${outName}.svg`), sticker);
  console.log(`Wrote ${outName}.svg`);
}

for (const [outName, code] of Object.entries(FLAG_MAP)) {
  buildSticker(outName, code);
}
