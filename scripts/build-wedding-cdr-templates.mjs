import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('public');
const SRC_DIR = path.join(ROOT, 'wedding-designs-to-add');
const ART_DIR = path.join(ROOT, 'NEW_DESIGNS/wedding/cdr-art');
const OUT_DIR = path.join(ROOT, 'NEW_DESIGNS/wedding');

const DESIGNS = [
  {
    src: 'BPD_CDR_CONV (23).svg',
    art: 'cdr-art-01.svg',
    slug: 'wedding-cdr-floral-garden',
    layout: 'compact',
    textColor: '#2C4A2E',
  },
  {
    src: 'BPD_CDR_CONV (24).svg',
    art: 'cdr-art-02.svg',
    slug: 'wedding-cdr-spring-bloom',
    layout: 'portrait',
    textColor: '#3D4A2F',
  },
  {
    src: 'BPD_CDR_CONV (25).svg',
    art: 'cdr-art-03.svg',
    slug: 'wedding-cdr-golden-band',
    layout: 'landscape',
    textColor: '#5C4A1E',
  },
  {
    src: 'BPD_CDR_CONV (28).svg',
    art: 'cdr-art-04.svg',
    slug: 'wedding-cdr-elegant-vine',
    layout: 'portrait',
    textColor: '#1F4D45',
  },
  {
    src: 'BPD_CDR_CONV (31).svg',
    art: 'cdr-art-05.svg',
    slug: 'wedding-cdr-classic-frame',
    layout: 'portrait',
    textColor: '#2D3748',
  },
  {
    src: 'BPD_CDR_CONV (43).svg',
    art: 'cdr-art-06.svg',
    slug: 'wedding-cdr-rustic-wreath',
    layout: 'portrait',
    textColor: '#4A3728',
  },
  {
    src: 'BPD_CDR_CONV (45).svg',
    art: 'cdr-art-07.svg',
    slug: 'wedding-cdr-romantic-rose',
    layout: 'portrait',
    textColor: '#5C2E3A',
  },
  {
    src: 'BPD_CDR_CONV (46).svg',
    art: 'cdr-art-08.svg',
    slug: 'wedding-cdr-vintage-lace',
    layout: 'portrait',
    textColor: '#3D3229',
  },
  {
    src: 'BPD_CDR_CONV (47).svg',
    art: 'cdr-art-09.svg',
    slug: 'wedding-cdr-botanical-frame',
    layout: 'portrait',
    textColor: '#4A3B2A',
  },
  {
    src: 'BPD_CDR_CONV (87).svg',
    art: 'cdr-art-10.svg',
    slug: 'wedding-cdr-navy-gold',
    layout: 'square',
    textColor: '#1E293B',
  },
  {
    src: 'BPD_CDR_CONV (97).svg',
    art: 'cdr-art-11.svg',
    slug: 'wedding-cdr-olive-grove',
    layout: 'square',
    textColor: '#2F3D28',
  },
  {
    src: 'BPD_CDR_CONV (98).svg',
    art: 'cdr-art-12.svg',
    slug: 'wedding-cdr-teal-floral',
    layout: 'square',
    textColor: '#0F4C5C',
  },
  {
    src: 'Vetor (689).svg',
    art: 'cdr-art-13.svg',
    slug: 'wedding-cdr-magenta-classic',
    layout: 'landscape',
    textColor: '#4A1540',
  },
];

const TEXT_LAYOUTS = {
  portrait: [
    { y: 560, size: 22, weight: 400, family: 'Montserrat', spacing: 6, content: 'WITH GREAT JOY' },
    { y: 760, size: 100, weight: 400, family: 'Marck Script', spacing: 0, content: 'Elena & Boris' },
    { y: 920, size: 48, weight: 600, family: 'Playfair Display', spacing: 4, content: '15 AUGUST 2026' },
    { y: 1060, size: 20, weight: 300, family: 'Montserrat', spacing: 2, content: 'We warmly invite you to our wedding celebration' },
    { y: 1240, size: 28, weight: 600, family: 'Playfair Display', spacing: 4, content: 'RESTAURANT GLAMOUR, SKOPJE' },
    { y: 1340, size: 22, weight: 400, family: 'Montserrat', spacing: 2, content: 'Reception 19:00 - 19:30' },
    { y: 1440, size: 20, weight: 300, family: 'Montserrat', spacing: 1, content: 'bul. Partizanski odredi 12' },
    { y: 1780, size: 18, weight: 400, family: 'Montserrat', spacing: 2, anchor: 'start', x: 280, content: 'Ristov Family' },
    { y: 1780, size: 18, weight: 400, family: 'Montserrat', spacing: 2, anchor: 'end', x: 1220, content: 'Petrov Family' },
  ],
  square: [
    { y: 680, size: 20, weight: 400, family: 'Montserrat', spacing: 5, content: 'SAVE THE DATE' },
    { y: 860, size: 92, weight: 400, family: 'Marck Script', spacing: 0, content: 'Mila & Stefan' },
    { y: 1000, size: 44, weight: 600, family: 'Playfair Display', spacing: 3, content: '20 SEPTEMBER 2026' },
    { y: 1120, size: 18, weight: 300, family: 'Montserrat', spacing: 2, content: 'Join us for our wedding day' },
    { y: 1260, size: 26, weight: 600, family: 'Playfair Display', spacing: 3, content: 'HOTEL DRIM, STRUGA' },
    { y: 1340, size: 20, weight: 400, family: 'Montserrat', spacing: 2, content: 'Ceremony 17:00' },
    { y: 1420, size: 18, weight: 300, family: 'Montserrat', spacing: 1, content: 'Dinner and dancing to follow' },
    { y: 1680, size: 17, weight: 400, family: 'Montserrat', spacing: 2, anchor: 'start', x: 300, content: 'Mitev Family' },
    { y: 1680, size: 17, weight: 400, family: 'Montserrat', spacing: 2, anchor: 'end', x: 1200, content: 'Petrov Family' },
  ],
  landscape: [
    { y: 980, size: 22, weight: 400, family: 'Montserrat', spacing: 6, content: 'TOGETHER WITH OUR FAMILIES' },
    { y: 1160, size: 96, weight: 400, family: 'Marck Script', spacing: 0, content: 'Ana & Goran' },
    { y: 1300, size: 46, weight: 600, family: 'Playfair Display', spacing: 4, content: '08 | 08 | 26' },
    { y: 1420, size: 20, weight: 300, family: 'Montserrat', spacing: 2, content: 'We invite you to celebrate with us' },
    { y: 1560, size: 28, weight: 600, family: 'Playfair Display', spacing: 4, content: 'RESTAURANT KAI MALEZ, OHRID' },
    { y: 1640, size: 22, weight: 400, family: 'Montserrat', spacing: 2, content: '19:00 - 19:30' },
    { y: 1720, size: 18, weight: 300, family: 'Montserrat', spacing: 1, content: 'Reception to follow' },
    { y: 1860, size: 17, weight: 400, family: 'Montserrat', spacing: 2, anchor: 'start', x: 280, content: 'Arsov Family' },
    { y: 1860, size: 17, weight: 400, family: 'Montserrat', spacing: 2, anchor: 'end', x: 1220, content: 'Petrov Family' },
  ],
  compact: [
    { y: 720, size: 20, weight: 400, family: 'Montserrat', spacing: 5, content: 'PLEASE JOIN US' },
    { y: 900, size: 88, weight: 400, family: 'Marck Script', spacing: 0, content: 'Vera & Aleksandar' },
    { y: 1040, size: 42, weight: 600, family: 'Playfair Display', spacing: 3, content: '30 JULY 2026' },
    { y: 1160, size: 18, weight: 300, family: 'Montserrat', spacing: 2, content: 'As we begin our life together' },
    { y: 1300, size: 26, weight: 600, family: 'Playfair Display', spacing: 3, content: 'VINARIJA POPOVA KULA' },
    { y: 1380, size: 20, weight: 400, family: 'Montserrat', spacing: 2, content: 'Kavadarci' },
    { y: 1460, size: 18, weight: 300, family: 'Montserrat', spacing: 1, content: 'At 18:00' },
    { y: 1720, size: 17, weight: 400, family: 'Montserrat', spacing: 2, anchor: 'start', x: 300, content: 'Stojkovski Family' },
    { y: 1720, size: 17, weight: 400, family: 'Montserrat', spacing: 2, anchor: 'end', x: 1200, content: 'Nikolov Family' },
  ],
};

function fontFamily(name) {
  if (name === 'Marck Script') return "'Marck Script', cursive";
  if (name === 'Playfair Display') return "'Playfair Display', serif";
  return "'Montserrat', sans-serif";
}

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildWrapper(design) {
  const lines = TEXT_LAYOUTS[design.layout];
  const artHref = `/NEW_DESIGNS/wedding/cdr-art/${design.art}`;
  const textNodes = lines
    .map((line) => {
      const x = line.x ?? 750;
      const anchor = line.anchor ?? 'middle';
      const spacing = line.spacing ? ` letter-spacing="${line.spacing}"` : '';
      const weight = line.weight ? ` font-weight="${line.weight}"` : '';
      return `    <text x="${x}" y="${line.y}" text-anchor="${anchor}" font-family="${fontFamily(line.family)}"${weight} font-size="${line.size}"${spacing}>${escapeXml(line.content)}</text>`;
    })
    .join('\n');

  return `<svg viewBox="0 0 1500 2100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&amp;family=Montserrat:wght@300;400;600&amp;family=Marck+Script&amp;display=swap');
    </style>
  </defs>
  <rect width="1500" height="2100" fill="#FFFFFF"/>
  <image href="${artHref}" x="0" y="0" width="1500" height="2100" preserveAspectRatio="xMidYMid meet"/>
  <g class="text-dark" fill="${design.textColor}" text-anchor="middle">
${textNodes}
  </g>
</svg>
`;
}

fs.mkdirSync(ART_DIR, { recursive: true });

for (const design of DESIGNS) {
  const srcPath = path.join(SRC_DIR, design.src);
  const artPath = path.join(ART_DIR, design.art);
  const outPath = path.join(OUT_DIR, `${design.slug}.svg`);

  if (!fs.existsSync(srcPath)) {
    throw new Error(`Missing source file: ${design.src}`);
  }

  fs.copyFileSync(srcPath, artPath);
  fs.writeFileSync(outPath, buildWrapper(design), 'utf8');
  console.log(`Built ${design.slug}`);
}

const manifest = DESIGNS.map((d) => ({
  id: `svg-${d.slug}`,
  slug: d.slug,
  art: d.art,
  layout: d.layout,
  textColor: d.textColor,
}));
fs.writeFileSync(
  path.join(ROOT, 'NEW_DESIGNS/wedding/cdr-art/manifest.json'),
  JSON.stringify(manifest, null, 2),
  'utf8',
);

console.log(`Done: ${DESIGNS.length} wedding CDR templates.`);
