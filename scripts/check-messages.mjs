/**
 * Audit i18n message files for missing keys that would cause runtime MISSING_MESSAGE errors.
 *
 *   node scripts/check-messages.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

function get(obj, p) {
  return p.split('.').reduce((o, k) => o?.[k], obj);
}

const en = JSON.parse(fs.readFileSync(path.join(ROOT, 'messages/en.json'), 'utf8'));
const mk = JSON.parse(fs.readFileSync(path.join(ROOT, 'messages/mk.json'), 'utf8'));
const enFlat = flatten(en);
const mkFlat = flatten(mk);

const issues = [];

for (const k of Object.keys(enFlat)) {
  if (!(k in mkFlat)) issues.push(`mk missing: ${k}`);
}
for (const k of Object.keys(mkFlat)) {
  if (!(k in enFlat)) issues.push(`en missing: ${k}`);
}

const productTypes = [
  't-shirt',
  'hoodie',
  'bodysuit',
  'cap',
  'mug',
  'cup',
  'bag',
  'thermos',
  'magnet',
  'photo-stone',
  'puzzle',
  'plaque',
  'gift-box',
  'gift-set',
  'microfiber-cloth',
];

for (const type of productTypes) {
  for (const [loc, m] of [
    ['en', en],
    ['mk', mk],
  ]) {
    if (!get(m, `products.typePages.${type}.subtitle`)) {
      issues.push(`${loc} missing products.typePages.${type}.subtitle`);
    }
    if (!get(m, `products.types.${type}`)) {
      issues.push(`${loc} missing products.types.${type}`);
    }
    if (!get(m, `products.typesPlural.${type}`)) {
      issues.push(`${loc} missing products.typesPlural.${type}`);
    }
  }
}

const catalog = fs.readFileSync(path.join(ROOT, 'src/lib/data/catalog.ts'), 'utf8');
const supplier = fs.readFileSync(
  path.join(ROOT, 'src/lib/data/supplier-catalog-products.ts'),
  'utf8',
);

const productNameKeys = new Set();
let inProducts = false;
for (const line of catalog.split('\n')) {
  if (line.includes('export const products:')) inProducts = true;
  if (inProducts && line.match(/^export const /) && !line.includes('export const products')) {
    break;
  }
  const m = line.match(/nameKey:\s*'([^']+)'/);
  if (inProducts && m) productNameKeys.add(m[1]);
}
for (const m of supplier.matchAll(/nameKey:\s*'([^']+)'/g)) {
  productNameKeys.add(m[1]);
}

for (const key of productNameKeys) {
  if (!get(en, `products.items.${key}`)) issues.push(`en missing products.items.${key}`);
  if (!get(mk, `products.items.${key}`)) issues.push(`mk missing products.items.${key}`);
}

if (issues.length === 0) {
  console.log('OK — no message issues found.');
  console.log(`en: ${Object.keys(enFlat).length} keys, mk: ${Object.keys(mkFlat).length} keys`);
  process.exit(0);
}

console.error(`Found ${issues.length} message issue(s):\n`);
for (const issue of issues) console.error(`  - ${issue}`);
process.exit(1);
