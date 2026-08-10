/**
 * Download product photos from koni-copy.com.mk by supplier SKU.
 *
 *   node scripts/fetch-koni-product-images.mjs
 *   node scripts/fetch-koni-product-images.mjs B101B B11T-01
 *
 * Saves to public/supplier/koni/{SKU}.jpg (normalized uppercase).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'public', 'supplier', 'koni');

/** Known WooCommerce slugs on koni-copy.com.mk. */
const SLUG_BY_SKU = {
  B101B: 'b101b-chasha-b-klasa',
  'BD101-FD': 'bd101-fd-chasha-so-vnatreshnost-best-father',
  'BD101-H': 'bd101-h-bela-chasha-so-vnatreshnost-i-love-you',
  'BD101-HB': 'bd101-hb-bela-chasha-so-vnatreshnost-happy-birthday',
  'BD101-TKG': 'bd101-tkg-chasha-so-vnatreshnost-thank-you-naskoro',
  B101H: 'chasha-bela-so-rachka-srtse',
  'B11T-01': 'b11t-01-chasha-so-vnatreshnost-i-rachka-vo-boja-tsrvena',
  'B11T-07': 'b11t-07-chasha-so-vnatreshnost-i-rachka-vo-boja-svetlo-sina',
  'B11T-08': 'b11t-08-chasha-so-vnatreshnost-i-rachka-vo-boja-rozova',
  'B11T-15': 'b11t-15-chasha-so-vnatreshnost-i-rachka-vo-boja-purpurna',
  'B11T-16': 'b11t-16-chasha-so-vnatreshnost-i-rachka-vo-boja-svetlo-violetova',
  BN1C: 'bn1c-krigla-za-pivo',
  'B1G-01': 'b1g-01-chasha-so-rachka-staklena-mat',
  B11ZQ: 'b11zq-chasha-so-fudbalska-topka-na-rachkata',
  'B2CB-01': 'b2cb-01-magichna-sjajna',
  'B2CB-07': 'b2cb07-magichna-mat',
  'CB11T-BL': 'cb11c-bl-sina-chasha-so-belo-prozorche-vo-forma-na-kamen',
  'CB11C-R': 'cb11c-r-tsrvena-chasha-so-belo-prozorche-vo-forma-na-kamen',
  B17PZ: 'chasha-so-iskrichki-pink',
  B17MZ: 'b17mz-chasha-so-iskrichki-lila',
  TFM01: 'cfm01-keramichki-magnet-5h7cm-naskoro',
  TFM03: 'cfm03-staklen-magnet-5h7cm-naskoro',
  CFM02: 'cfm02-keramichki-magnet-srtse-6h6-8cm-naskoro',
  HBFM03: 'hbfm03-hardboard-magnet-9h7cm-naskoro',
  HBFM04: 'hbfm04-hardboard-magnet-6h6cm-naskoro',
  HBFM05: 'hbfm05-hardboard-ovalen-magnet-9h6-5cm-naskoro',
  SBBH03: 'sbbh03-foto-kamen-15x20cm',
  SBBH19: 'sbbh19-foto-kamen-15x15cm',
  PTA4: 'pta4-slozhuvalka-a4-sjajna',
  PTA5: 'pta5-slozhuvalka-a5',
  PTA8: 'slozhuvalka-srtse',
  'PTA4-M1': 'pta4-m1-slozhuvalka-so-30-parchina-17x25cm',
  BB1: 'bb1-drvena-podloga-za-plaketa-10h15cm',
  BB2: 'bb2-drvena-podloga-za-plaketa-15h20cm',
  BB3: 'bb3-drvena-podloga-za-plaketa-20h30cm',
  'B19QG-G': 'b19qg-g-kasichka-zlatna',
  'B19QG-W': 'b19qg-w-kasichka-bela',
  'P19QG-W': 'b19qg-w-kasichka-bela',
  SBH08M: 'sbh08m-kutija-za-chasha-bela-11oz',
  KUT: 'dkut-kutija-za-chashi',
};

/** SKUs from koni-supplier-products.ts — default batch download. */
const DEFAULT_SKUS = [
  'B11T-01',
  'B11T-07',
  'B11T-08',
  'B11T-15',
  'B11T-16',
  'B11ZQ',
  'B2CB-01',
  'B2CB-07',
  'CB11T-BL',
  'CB11C-R',
  'B17PZ',
  'B17MZ',
  'HBFM03',
  'SBBH03',
  'SBBH19',
  'PTA4',
  'PTA5',
  'PTA8',
  'PTA4-M1',
  'BB1',
  'BB2',
  'BB3',
  'B19QG-G',
  'B19QG-W',
  'SBH08M',
  'KUT',
];

function normalizeSku(sku) {
  return sku.trim().toUpperCase().replace(/\s+/g, '');
}

function fileNameForSku(sku) {
  return `${normalizeSku(sku).replace(/[^A-Z0-9]+/g, '-')}.jpg`;
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'print8-image-sync/1.0' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function extractOgImage(html) {
  const match =
    html.match(/property="og:image"\s+content="([^"]+)"/i) ||
    html.match(/content="([^"]+)"\s+property="og:image"/i);
  return match?.[1] ?? null;
}

async function downloadImage(url, dest) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'print8-image-sync/1.0' },
  });
  if (!res.ok) throw new Error(`Image HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return buf.length;
}

async function syncSku(sku) {
  const normalized = normalizeSku(sku);
  const slug = SLUG_BY_SKU[normalized];
  if (!slug) {
    console.warn(`Skip ${normalized} — no slug mapping (add to SLUG_BY_SKU)`);
    return false;
  }

  const pageUrl = `https://www.koni-copy.com.mk/product/${slug}/`;
  const html = await fetchHtml(pageUrl);
  const imageUrl = extractOgImage(html);
  if (!imageUrl) {
    console.warn(`Skip ${normalized} — no og:image on ${pageUrl}`);
    return false;
  }

  const out = path.join(OUT_DIR, fileNameForSku(normalized));
  const bytes = await downloadImage(imageUrl, out);
  console.log(`${normalized} -> ${path.relative(ROOT, out)} (${bytes} bytes)`);
  return true;
}

async function main() {
  const requested = process.argv.slice(2).map(normalizeSku);
  const skus = requested.length ? requested : DEFAULT_SKUS;
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let ok = 0;
  for (const sku of skus) {
    try {
      if (await syncSku(sku)) ok += 1;
    } catch (error) {
      console.warn(`${sku} failed:`, error.message);
    }
  }
  console.log(`\nDone: ${ok}/${skus.length} images saved.`);
}

main();
