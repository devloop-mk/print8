import fs from 'node:fs';
import path from 'node:path';

const snippet = fs.readFileSync(path.resolve('scripts/cdr-registration-snippet.txt'), 'utf8');

function extract(marker, nextMarker) {
  const start = snippet.indexOf(marker) + marker.length;
  const end = nextMarker ? snippet.indexOf(nextMarker) : snippet.length;
  return snippet.slice(start, end).trim();
}

const tsBlock = extract('---TS---', '---CATALOG---');
const catalogBlock = extract('---CATALOG---', '---MK---');

function insertBefore(filePath, needle, block) {
  let content = fs.readFileSync(filePath, 'utf8');
  const normalized = content.replace(/\r\n/g, '\n');
  const normalizedNeedle = needle.replace(/\r\n/g, '\n');
  const index = normalized.indexOf(normalizedNeedle);
  if (index === -1) {
    throw new Error(`Needle not found in ${filePath}`);
  }
  const updated = `${normalized.slice(0, index)}${block}\n${normalized.slice(index)}`;
  fs.writeFileSync(filePath, updated, 'utf8');
  console.log('Updated', filePath);
}

insertBefore(
  path.resolve('src/lib/data/svg-design-templates.ts'),
  "  {\n    id: 'svg-bday-gold',",
  tsBlock,
);

insertBefore(
  path.resolve('src/lib/data/catalog.ts'),
  "  {\n    id: 'svg-bday-gold',",
  catalogBlock,
);
