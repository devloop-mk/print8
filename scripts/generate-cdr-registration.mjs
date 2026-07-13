import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('public/NEW_DESIGNS/wedding/cdr-art/manifest.json');
const m = JSON.parse(fs.readFileSync(ROOT, 'utf8'));

const layouts = {
  portrait: [
    'WITH GREAT JOY',
    'Elena & Boris',
    '15 AUGUST 2026',
    'We warmly invite you to our wedding celebration',
    'RESTAURANT GLAMOUR, SKOPJE',
    'Reception 19:00 - 19:30',
    'ul. Partizanski odredi 12',
    'Ristov Family',
    'Petrov Family',
  ],
  square: [
    'SAVE THE DATE',
    'Mila & Stefan',
    '20 SEPTEMBER 2026',
    'Join us for our wedding day',
    'HOTEL DRIM, STRUGA',
    'Ceremony 17:00',
    'Dinner and dancing to follow',
    'Mitev Family',
    'Petrov Family',
  ],
  landscape: [
    'TOGETHER WITH OUR FAMILIES',
    'Ana & Goran',
    '08 | 08 | 26',
    'We invite you to celebrate with us',
    'RESTAURANT KAI MALEZ, OHRID',
    '19:00 - 19:30',
    'Reception to follow',
    'Arsov Family',
    'Petrov Family',
  ],
  compact: [
    'PLEASE JOIN US',
    'Vera & Aleksandar',
    '30 JULY 2026',
    'As we begin our life together',
    'VINARIJA POPOVA KULA',
    'Kavadarci',
    'At 18:00',
    'Stojkovski Family',
    'Nikolov Family',
  ],
};

const mk = {
  portrait: [
    'СО ГОЛЕМА РАДОСТ',
    'Елена и Борис',
    '15 август 2026',
    'Со голема чест ве покануваме на нашата свадбена веселба',
    'Ресторан Гламур, Скопје',
    'Прием 19:00 - 19:30',
    'бул. Партизански одреди 12',
    'Фамилија Ристови',
    'Фамилија Петрови',
  ],
  square: [
    'ЗАЧУВАЈТЕ ГО ДАТУМОТ',
    'Мила и Стефан',
    '20 септември 2026',
    'Прославете го нашиот свадбен ден со нас',
    'Хотел Дрим, Струга',
    'Церемонија во 17:00',
    'Вечера и танцување по церемонијата',
    'Фамилија Митеви',
    'Фамилија Петрови',
  ],
  landscape: [
    'ЗАЕДНО СО НАШИТЕ СЕМЕЈСТВА',
    'Ана и Горан',
    '08 | 08 | 26',
    'Ве покануваме да прославите со нас',
    'Ресторан Кај Малез, Охрид',
    '19:00 - 19:30',
    'Прием по церемонијата',
    'Фамилија Арсови',
    'Фамилија Петрови',
  ],
  compact: [
    'ВЕ МОЛИМЕ ПРИДРУЖЕТЕ НИ СЕ',
    'Вера и Александар',
    '30 јули 2026',
    'Додека започнуваме заеднички живот',
    'Винарија Попова Кула',
    'Кавадарци',
    'Во 18:00 часот',
    'Фамилија Стојковски',
    'Фамилија Николови',
  ],
};

const titles = {
  'wedding-cdr-floral-garden': ['Floral garden invitation', 'Свадбена покана — цветна градина'],
  'wedding-cdr-spring-bloom': ['Spring bloom invitation', 'Свадбена покана — пролетно цвење'],
  'wedding-cdr-golden-band': ['Golden band invitation', 'Свадбена покана — златна лента'],
  'wedding-cdr-elegant-vine': ['Elegant vine invitation', 'Свадбена покана — елегантна лоза'],
  'wedding-cdr-classic-frame': ['Classic frame invitation', 'Свадбена покана — класична рамка'],
  'wedding-cdr-rustic-wreath': ['Rustic wreath invitation', 'Свадбена покана — рустикен венец'],
  'wedding-cdr-romantic-rose': ['Romantic rose invitation', 'Свадбена покана — романтична роза'],
  'wedding-cdr-vintage-lace': ['Vintage lace invitation', 'Свадбена покана — винтиџ доили'],
  'wedding-cdr-botanical-frame': ['Botanical frame invitation', 'Свадбена покана — ботаничка рамка'],
  'wedding-cdr-navy-gold': ['Navy and gold invitation', 'Свадбена покана — темносина и злато'],
  'wedding-cdr-olive-grove': ['Olive grove invitation', 'Свадбена покана — маслинов говор'],
  'wedding-cdr-teal-floral': ['Teal floral invitation', 'Свадбена покана — тиркизно цвење'],
  'wedding-cdr-magenta-classic': ['Magenta classic invitation', 'Свадбена покана — магента класик'],
};

const esc = (value) => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

let ts = '';
let catalog = '';
let mkDefaults = '';
let fieldLabels = '';
let enJson = '';
let mkJson = '';

for (const d of m) {
  const texts = layouts[d.layout];
  const mkT = mk[d.layout];
  const [enTitle, mkTitle] = titles[d.slug];

  ts += `  {
    id: '${d.id}',
    category: 'wedding',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: \`\${ROOT}/wedding/${d.slug}.svg\`,
        texts: tx([
          '${texts.map(esc).join("',\n          '")}',
        ]),
      },
    },
    colors: inlineColors({
      background: '#FFFFFF',
      text: '${d.textColor}',
    }),
  },
`;

  catalog += `  {
    id: '${d.id}',
    category: 'wedding',
    image: '/NEW_DESIGNS/wedding/${d.slug}.svg',
    tags: ['cdr', 'editable', 'premium'],
    kind: 'customizable',
    svgTemplateId: '${d.id}',
  },
`;

  mkDefaults += `  '${d.id}': {
    front: [
      '${mkT.map(esc).join("',\n      '")}',
    ],
  },
`;

  fieldLabels += `  [templateSideKey('${d.id}', 'front')]: WEDDING_WATERCOLOR_DAISY_9,
`;

  enJson += `      "${d.id}": "${enTitle}",
`;
  mkJson += `      "${d.id}": "${mkTitle}",
`;
}

const out = path.resolve('scripts/cdr-registration-snippet.txt');
fs.writeFileSync(
  out,
  ['---TS---', ts, '---CATALOG---', catalog, '---MK---', mkDefaults, '---FL---', fieldLabels, '---EN---', enJson, '---MKJ---', mkJson].join('\n'),
  'utf8',
);
console.log('Wrote', out);
