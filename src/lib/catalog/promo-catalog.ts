import logoVersions from '@/lib/catalog/logo-versions.json';

export type PromoPriceBreak = {
  label: string;
  price: number;
};

export type PromoCatalogProduct = {
  id: string;
  /** Storefront product URL. Omit when the item is catalog-only. */
  href?: string;
  image: string;
  images?: string[];
  prices: PromoPriceBreak[];
  swatches?: string[];
};

export function isPromoShopHref(href?: string): href is string {
  return Boolean(href?.startsWith('/products'));
}

function withLogoCache(url: string, id: string): string {
  const v = (logoVersions as Record<string, string>)[id];
  if (!v) return url;
  return `${url.split('?')[0]}?v=${v}`;
}

export type PromoCatalogPageId =
  | 'cover'
  | 'contents'
  | 'info'
  | 'back'
  | 'blank'
  | `mugs-${number}`
  | `merch-${number}`
  | `calendars-${number}`;

const CAL_IMG = '/catalog/calendars/2027';
const MERCH_IMG = '/catalog/merch';

/** Circled fabric card 01, 04, 07, 13, 14 plus C.K. 03 red and C.K. 12 olive. */
const BLUZON_SWATCHES = [
  '#e6e6e4',
  '#b8b8b8',
  '#1a1a1a',
  '#2b43a6',
  '#17283d',
  '#7e0e18',
  '#3a3c1f',
];

function breaks(
  rows: [label: string, price: number][],
): PromoPriceBreak[] {
  return rows.map(([label, price]) => ({ label, price }));
}

const PRICE_TEE = breaks([
  ['1–10', 550],
  ['10–20', 450],
  ['20–50', 380],
  ['50–100', 350],
  ['100+', 320],
]);
const PRICE_SWEAT = breaks([
  ['1–10', 1100],
  ['10–20', 1000],
  ['20–50', 900],
  ['50–100', 800],
  ['100+', 750],
]);
const PRICE_HOOD = breaks([
  ['1–10', 1200],
  ['10–20', 1100],
  ['20–50', 1000],
  ['50–100', 900],
  ['100+', 800],
]);
const PRICE_ZIP = breaks([
  ['1–10', 1300],
  ['10–20', 1200],
  ['20–50', 1100],
  ['50–100', 950],
  ['100+', 850],
]);
const PRICE_POLAR = breaks([
  ['1–10', 1400],
  ['10–20', 1300],
  ['20–50', 1200],
  ['50–100', 1100],
  ['100+', 1000],
]);
const POLAR_SWATCHES = ['#ffffff', '#1e3a8a', '#111111'];
const PRICE_NOTEBOOK_A4 = breaks([
  ['1–10', 300],
  ['10–50', 260],
  ['50+', 210],
]);
const PRICE_NOTEBOOK_A5 = breaks([
  ['1–10', 220],
  ['10–50', 180],
  ['50+', 150],
]);
const PRICE_NOTEBOOK_FOREST = breaks([
  ['50–100', 180],
  ['100+', 160],
]);
const PRICE_NOTEBOOK_MINI = breaks([
  ['50–100', 110],
  ['100+', 90],
]);
const PRICE_NOTEBOOK_GRATZ = breaks([
  ['50–100', 230],
  ['100+', 210],
]);
const PRICE_NOTEBOOK_NOTE_A5 = breaks([
  ['50–100', 150],
  ['100+', 130],
]);
const PRICE_NOTEBOOK_HELSINKI = breaks([
  ['50–100', 250],
  ['100+', 230],
]);
const NOTEBOOK_SPIRAL_SWATCHES = ['#ffffff', '#111111'];
const PRICE_MUG_WHITE = breaks([
  ['1–10', 280],
  ['10–20', 230],
  ['20–50', 200],
  ['50–100', 170],
  ['100+', 150],
]);
const PRICE_MUG_INNER = breaks([
  ['1–10', 330],
  ['10–20', 280],
  ['20–50', 250],
  ['50–100', 230],
  ['100+', 200],
]);
const PRICE_MUG_GOLD = breaks([
  ['1–10', 400],
  ['10–20', 370],
  ['20–50', 330],
  ['50–100', 290],
  ['100+', 250],
]);
const PRICE_MUG_HEART = breaks([
  ['1–10', 300],
  ['10–20', 270],
  ['20–50', 250],
  ['50–100', 220],
  ['100+', 190],
]);
const PRICE_MUG_CORK = breaks([
  ['1–10', 400],
  ['10–20', 370],
  ['20–50', 330],
  ['50–100', 290],
  ['100+', 250],
]);
const CAL_QUARTER = breaks([
  ['30–50', 70],
  ['50–100', 60],
  ['100+', 50],
]);
const CAL_NARROW = breaks([
  ['30–50', 65],
  ['50–100', 55],
  ['100+', 45],
]);
const CAL_DESK = breaks([
  ['30–50', 70],
  ['50–100', 60],
  ['100+', 50],
]);
const CAL_TRODELEN = breaks([
  ['30–50', 120],
  ['50–100', 110],
  ['100+', 100],
]);
const CAL_CLASSIC_PLASTIC = breaks([
  ['30–50', 80],
  ['50–100', 70],
  ['100+', 60],
]);
const CAL_CLASSIC_METAL = breaks([
  ['30–50', 90],
  ['50–100', 80],
  ['100+', 70],
]);
const CAL_ORTHODOX_SIXTH = breaks([
  ['30–50', 80],
  ['50–100', 70],
  ['100+', 60],
]);
const CAL_RED_ORTHODOX = breaks([
  ['30–50', 65],
  ['50–100', 55],
  ['100+', 45],
]);
const CAL_ICONS_QUARTER = breaks([
  ['30–50', 70],
  ['50–100', 60],
  ['100+', 50],
]);
const CAL_SPIRAL_ORTHODOX = breaks([
  ['30–50', 70],
  ['50–100', 60],
  ['100+', 50],
]);
const PRICE_KEY_PVC_SMALL = breaks([
  ['50–100', 45],
  ['100+', 35],
]);
const PRICE_KEY_PVC_LARGE = breaks([
  ['50–100', 55],
  ['100+', 45],
]);
const PRICE_KEY_MEDIAPAN = breaks([
  ['30–50', 110],
  ['50–100', 90],
  ['100+', 80],
]);
const CAL_POCKET = breaks([['100+', 12]]);
const CAL_SPIRAL_SWATCHES = ['#111111', '#ffffff'];

const TSHIRT_SWATCHES = [
  '#c5ccd6',
  '#1C1A1D',
  '#DB0213',
  '#272D37',
  '#00806A',
  '#A09FA4',
  '#0F287C',
  '#79804C',
  '#CEB499',
];

function merchProduct(
  id: string,
  file: string,
  prices: PromoPriceBreak[],
  swatches?: string[],
): PromoCatalogProduct {
  const src = file.includes('?')
    ? file.replace(/\?v=[^&]+/, '?v=p8n')
    : `${file}?v=p8n`;
  return {
    id,
    image: `${MERCH_IMG}/${src}`,
    prices,
    swatches,
  };
}

function calendarProduct(
  id: string,
  folder: string,
  sheets: number,
  prices: PromoPriceBreak[],
): PromoCatalogProduct {
  const base = `${CAL_IMG}/${folder}`;
  const v = '?v=p8';
  return {
    id,
    image: `${base}/hero.jpg${v}`,
    images:
      sheets > 1
        ? Array.from({ length: sheets - 1 }, (_, i) => `${base}/${i + 2}.jpg${v}`)
        : undefined,
    prices,
  };
}

const PROMO_CATALOG_PRODUCTS_RAW: PromoCatalogProduct[] = [
  {
    id: 'classic',
    href: '/products/mug-classic',
    image: `${MERCH_IMG}/mug-classic-p8.jpg?v=p8n`,
    prices: PRICE_MUG_WHITE,
  },
  {
    id: 'inner',
    href: '/products/mug-inner-red',
    image: `${MERCH_IMG}/mug-inner-p8.jpg?v=p8n`,
    prices: PRICE_MUG_INNER,
    swatches: [
      '#e11d2e',
      '#ef5b24',
      '#f5c400',
      '#8bc43f',
      '#4aaee0',
      '#1a3a6b',
      '#e091b4',
      '#6d3d68',
    ],
  },
  {
    id: 'goldHandle',
    href: '/products/mug-gold-handle',
    image: `${MERCH_IMG}/mug-gold-handle-p8.jpg?v=p8n`,
    prices: PRICE_MUG_GOLD,
  },
  {
    id: 'silverHandle',
    href: '/products/mug-chrome-handle',
    image: `${MERCH_IMG}/mug-silver-handle-p8.jpg?v=p8n`,
    prices: PRICE_MUG_GOLD,
  },
  {
    id: 'heartHandle',
    href: '/products/mug-heart-handle',
    image: `${MERCH_IMG}/mug-heart-handle-p8.jpg?v=p8n`,
    prices: PRICE_MUG_HEART,
  },
  {
    id: 'corkLid',
    href: '/products/mug-cork-lid',
    image: `${MERCH_IMG}/mug-cork-lid-p8.jpg?v=p8n`,
    prices: PRICE_MUG_CORK,
  },
  {
    id: 'stackable',
    image: `${MERCH_IMG}/mug-stackable-p8.jpg?v=p8n`,
    prices: [
      { label: '1–10', price: 340 },
      { label: '10–20', price: 310 },
      { label: '20–50', price: 280 },
      { label: '50–100', price: 250 },
      { label: '100+', price: 220 },
    ],
    swatches: [
      '#9acdca',
      '#93c5fd',
      '#f9a8d4',
      '#c4b5fd',
      '#fb923c',
      '#111111',
      '#ffffff',
    ],
  },
  {
    id: 'happyNewYear',
    image: '/supplier/koni/BD101-HN.jpg',
    prices: [
      { label: '1–10', price: 360 },
      { label: '10–20', price: 320 },
      { label: '20–50', price: 290 },
      { label: '50–100', price: 270 },
      { label: '100+', price: 240 },
    ],
  },
  merchProduct(
    'bianca',
    'mug-bianca.jpg?v=2',
    breaks([
      ['1–10', 300],
      ['10–20', 280],
      ['20–50', 260],
      ['50–100', 220],
      ['100+', 190],
    ]),
    ['#86efac', '#dc2626', '#2563eb', '#111111'],
  ),
  merchProduct(
    'armada',
    'armada.jpg',
    breaks([
      ['100–200', 45],
      ['200–300', 42],
      ['300+', 39],
    ]),
    ['#7f1d1d', '#c0c0c0', '#4b5563', '#e8b4b8', '#27272a', '#111111'],
  ),
  merchProduct(
    'oggi',
    'pen-oggi.jpg',
    breaks([
      ['100–200', 40],
      ['200–300', 37],
      ['300+', 33],
    ]),
    ['#a855f7', '#3b82f6', '#c0c0c0', '#1e3a8a', '#f4f4f5', '#dc2626', '#111111'],
  ),
  merchProduct(
    'alfa',
    'pen-alfa.jpg',
    breaks([
      ['100–200', 18],
      ['200–300', 16.5],
      ['300+', 15],
    ]),
    [
      '#111111',
      '#c026d3',
      '#f4f4f5',
      '#ec4899',
      '#fb923c',
      '#7c3aed',
      '#facc15',
      '#dc2626',
      '#22c55e',
      '#38bdf8',
      '#1d4ed8',
    ],
  ),
  merchProduct(
    'twister',
    'pen-twister.jpg',
    breaks([
      ['100–200', 20],
      ['200–300', 18],
      ['300+', 16],
    ]),
    ['#a855f7', '#9ca3af', '#f4f4f5', '#1e3a8a', '#111111'],
  ),
  merchProduct(
    'keyHouse',
    'key-house.jpg',
    PRICE_KEY_PVC_SMALL,
  ),
  merchProduct(
    'keyCircle',
    'key-circle.jpg',
    PRICE_KEY_PVC_SMALL,
  ),
  merchProduct(
    'keyCk40',
    'key-ck40.jpg',
    PRICE_KEY_PVC_LARGE,
  ),
  merchProduct(
    'keyHeart',
    'key-heart.jpg',
    PRICE_KEY_PVC_LARGE,
  ),
  merchProduct(
    'keyCf40',
    'key-cf40.jpg',
    PRICE_KEY_PVC_SMALL,
  ),
  merchProduct(
    'keyHbRound',
    'key-hb-round.jpg?v=2',
    PRICE_KEY_MEDIAPAN,
  ),
  merchProduct(
    'keyHbSquare',
    'key-hb-square.jpg?v=2',
    PRICE_KEY_MEDIAPAN,
  ),
  merchProduct(
    'keyHbOval',
    'key-hb-oval.jpg?v=2',
    PRICE_KEY_MEDIAPAN,
  ),
  // Hidden for now. Put lighterLuss back in the lighter page group to restore it.
  merchProduct(
    'lighterLuss',
    'lighter-luss.jpg',
    breaks([
      ['100–200', 39],
      ['200–300', 28],
      ['300+', 26],
    ]),
  ),
  merchProduct(
    'lighterUnilite',
    'lighter-unilite-u117.jpg',
    breaks([
      ['100–200', 33],
      ['200–300', 31],
      ['300+', 29],
    ]),
    ['#f0c400', '#00875a', '#f4f4f4', '#d0121c'],
  ),
  merchProduct(
    'lighterMavrovo',
    'lighter-mavrovo.jpg',
    breaks([
      ['100–200', 19],
      ['200–300', 17],
      ['300+', 15.5],
    ]),
    ['#22c55e', '#2563eb', '#dc2626', '#111111'],
  ),
  merchProduct(
    'lighterFresh',
    'lighter-fresh.jpg',
    breaks([
      ['100–200', 25],
      ['200–300', 23],
      ['300+', 21],
    ]),
    ['#22c55e', '#2563eb', '#dc2626', '#111111'],
  ),
  merchProduct(
    'bottleRaise',
    'bottle-raise.jpg',
    breaks([
      ['1–10', 300],
      ['10–20', 270],
      ['20–50', 240],
      ['50–100', 220],
      ['100+', 180],
    ]),
  ),
  merchProduct(
    'towelPure',
    'towel-pure.jpg',
    breaks([
      ['10–50', 50],
      ['50–100', 40],
      ['100+', 30],
    ]),
  ),
  {
    ...merchProduct(
      'bagNaturella',
      'bag-naturella.jpg',
      breaks([
        ['1–10', 300],
        ['5–20', 250],
        ['20–50', 220],
        ['50–100', 200],
        ['100+', 180],
      ]),
    ),
    href: '/products/bag-naturella-natural',
  },
  merchProduct(
    'bottleAlu600',
    'bottle-alu-600.jpg?v=2',
    breaks([
      ['1–10', 380],
      ['10–20', 350],
      ['20–50', 320],
      ['50–100', 290],
      ['100+', 260],
    ]),
    [
      '#c5c9ce',
      '#ffffff',
      '#f0c42e',
      '#7dcdc0',
      '#8ec4e8',
      '#e59bb4',
    ],
  ),
  merchProduct(
    'bottleAlu400',
    'bottle-alu-400.jpg',
    breaks([
      ['1–10', 350],
      ['10–20', 320],
      ['20–50', 290],
      ['50–100', 260],
      ['100+', 230],
    ]),
  ),
  {
    id: 'tshirt',
    href: '/products/tshirt-unisex',
    image: `${MERCH_IMG}/tshirt-p8.jpg?v=p8`,
    prices: PRICE_TEE,
    swatches: TSHIRT_SWATCHES,
  },
  {
    id: 'bluzonCrew',
    href: '/products/hoodie-crewneck',
    image: `${MERCH_IMG}/bluzon-crew-p8.jpg?v=p8`,
    prices: PRICE_SWEAT,
    swatches: BLUZON_SWATCHES,
  },
  {
    ...merchProduct('bluzonHood', 'bluzon-hood.jpg', PRICE_HOOD, BLUZON_SWATCHES),
    href: '/products/hoodie-basic',
  },
  {
    ...merchProduct('bluzonZip', 'bluzon-zip.jpg', PRICE_ZIP, BLUZON_SWATCHES),
    href: '/products/hoodie-full-zip',
  },
  {
    ...merchProduct('bluzonZipHood', 'bluzon-zip-hood.jpg', PRICE_ZIP, BLUZON_SWATCHES),
    href: '/products/hoodie-zip-hood',
  },
  {
    ...merchProduct('bluzonQuarterZip', 'bluzon-quarter-zip.jpg', PRICE_ZIP, BLUZON_SWATCHES),
    href: '/products/hoodie-quarter-zip',
  },
  merchProduct('polarZip', 'polar-zip.jpg', PRICE_POLAR, POLAR_SWATCHES),
  merchProduct('polarQuarterZip', 'polar-quarter-zip.jpg', PRICE_POLAR, POLAR_SWATCHES),
  merchProduct('polarVest', 'polar-vest.jpg', PRICE_POLAR, POLAR_SWATCHES),
  merchProduct(
    'notebookA4',
    'notebook-spiral.jpg',
    PRICE_NOTEBOOK_A4,
    NOTEBOOK_SPIRAL_SWATCHES,
  ),
  merchProduct(
    'notebookA5',
    'notebook-spiral.jpg',
    PRICE_NOTEBOOK_A5,
    NOTEBOOK_SPIRAL_SWATCHES,
  ),
  merchProduct('notebookForest', 'notebook-forest-a5.jpg', PRICE_NOTEBOOK_FOREST, [
    '#c4a574',
    '#e10600',
  ]),
  merchProduct('notebookMini', 'notebook-note-mini-a6.jpg', PRICE_NOTEBOOK_MINI, [
    '#2457c5',
    '#1c2c52',
    '#c43732',
    '#1a1a1a',
  ]),
  merchProduct('notebookGratz', 'notebook-gratz-a5b.jpg', PRICE_NOTEBOOK_GRATZ, [
    '#c5a278',
    '#18181a',
  ]),
  merchProduct('notebookNoteA5', 'notebook-note-a5.jpg', PRICE_NOTEBOOK_NOTE_A5, [
    '#b4d429',
    '#272e4b',
    '#f3f3f3',
    '#d76830',
    '#c72928',
    '#212121',
  ]),
  merchProduct('notebookHelsinki', 'notebook-helsinki-b5.jpg', PRICE_NOTEBOOK_HELSINKI, [
    '#243832',
    '#d4cbbd',
    '#5a5a5e',
    '#f2f2f2',
    '#2a3148',
    '#161616',
  ]),
  {
    ...calendarProduct('calTrodelen', 'trodelen', 1, breaks([
      ['30–50', 160],
      ['50–100', 140],
      ['100+', 120],
    ])),
    image: `${CAL_IMG}/trodelen/hero.png?v=tri`,
  },
  calendarProduct('calTrodelenRed', 'trodelen', 1, CAL_TRODELEN),
  {
    ...calendarProduct('calClassicPlastic', 'classic-plastic', 1, CAL_CLASSIC_PLASTIC),
    image: `${CAL_IMG}/classic-plastic/hero.jpg?v=a4h`,
    images: [`${CAL_IMG}/classic-plastic/header.jpg?v=a4h`],
    swatches: CAL_SPIRAL_SWATCHES,
  },
  {
    ...calendarProduct('calClassicMetal', 'classic-metal', 1, CAL_CLASSIC_METAL),
    image: `${CAL_IMG}/classic-metal/hero.jpg?v=a4h`,
    images: [`${CAL_IMG}/classic-metal/header.jpg?v=a4h`],
    swatches: CAL_SPIRAL_SWATCHES,
  },
  {
    ...calendarProduct('calWild', 'wild', 6, CAL_ORTHODOX_SIXTH),
    image: `${CAL_IMG}/wild/hero.png?v=p8`,
    images: [
      `${CAL_IMG}/wild/2.jpg`,
      `${CAL_IMG}/wild/3.jpg`,
      `${CAL_IMG}/wild/4.jpg`,
      `${CAL_IMG}/wild/5.jpg`,
      `${CAL_IMG}/wild/6.png`,
    ],
  },
  {
    ...calendarProduct('calOrthodox6', 'orthodox-6', 6, CAL_ORTHODOX_SIXTH),
    image: `${CAL_IMG}/orthodox-6/hero.png?v=p8`,
    images: [
      `${CAL_IMG}/orthodox-6/2.jpg`,
      `${CAL_IMG}/orthodox-6/3.jpg`,
      `${CAL_IMG}/orthodox-6/4.jpg`,
      `${CAL_IMG}/orthodox-6/5.png`,
      `${CAL_IMG}/orthodox-6/6.png`,
    ],
  },
  {
    ...calendarProduct('calLandscape6', 'landscape-6', 6, CAL_ORTHODOX_SIXTH),
    image: `${CAL_IMG}/landscape-6/hero.png?v=p8`,
    images: [
      `${CAL_IMG}/landscape-6/2.jpg`,
      `${CAL_IMG}/landscape-6/3.jpg`,
      `${CAL_IMG}/landscape-6/4.jpg`,
      `${CAL_IMG}/landscape-6/5.jpg`,
      `${CAL_IMG}/landscape-6/6.png`,
    ],
  },
  {
    ...calendarProduct('calCars', 'cars', 4, CAL_QUARTER),
    image: `${CAL_IMG}/cars/hero.png?v=p8`,
    images: [
      `${CAL_IMG}/cars/2.png`,
      `${CAL_IMG}/cars/3.png`,
      `${CAL_IMG}/cars/4.png`,
    ],
  },
  {
    ...calendarProduct('calLandscape4', 'landscape-4', 4, CAL_QUARTER),
    image: `${CAL_IMG}/landscape-4/hero.png?v=p8`,
    images: [
      `${CAL_IMG}/landscape-4/2.png`,
      `${CAL_IMG}/landscape-4/3.png`,
      `${CAL_IMG}/landscape-4/4.png`,
    ],
  },
  {
    ...calendarProduct('calDomestic', 'domestic', 4, CAL_QUARTER),
    image: `${CAL_IMG}/domestic/hero.png?v=p8`,
    images: [
      `${CAL_IMG}/domestic/2.png`,
      `${CAL_IMG}/domestic/3.png`,
      `${CAL_IMG}/domestic/4.png`,
    ],
  },
  {
    ...calendarProduct('calMosques', 'mosques', 4, CAL_QUARTER),
    image: `${CAL_IMG}/mosques/hero.png?v=p8`,
    images: [
      `${CAL_IMG}/mosques/2.png`,
      `${CAL_IMG}/mosques/3.png`,
      `${CAL_IMG}/mosques/4.png`,
    ],
  },
  {
    ...calendarProduct('calTrucks', 'trucks', 4, CAL_QUARTER),
    image: `${CAL_IMG}/trucks/hero.png?v=p8`,
    images: [
      `${CAL_IMG}/trucks/2.png`,
      `${CAL_IMG}/trucks/3.png`,
      `${CAL_IMG}/trucks/4.png`,
    ],
  },
  {
    ...calendarProduct('calNarrowOrthodox', 'narrow-orthodox', 4, CAL_NARROW),
    image: `${CAL_IMG}/narrow-orthodox/hero.png?v=p8`,
    images: [
      `${CAL_IMG}/narrow-orthodox/2.png`,
      `${CAL_IMG}/narrow-orthodox/3.png`,
      `${CAL_IMG}/narrow-orthodox/4.png`,
    ],
  },
  {
    ...calendarProduct('calOrthodox4', 'orthodox-4', 4, CAL_QUARTER),
    image: `${CAL_IMG}/orthodox-4/hero.png?v=p8`,
    images: [
      `${CAL_IMG}/orthodox-4/2.png`,
      `${CAL_IMG}/orthodox-4/3.png`,
      `${CAL_IMG}/orthodox-4/4.png`,
    ],
  },
  {
    ...calendarProduct('calPets', 'pets', 4, CAL_QUARTER),
    image: `${CAL_IMG}/pets/hero.png?v=p8`,
    images: [
      `${CAL_IMG}/pets/2.png`,
      `${CAL_IMG}/pets/3.png`,
      `${CAL_IMG}/pets/4.png`,
    ],
  },
  {
    ...calendarProduct('calRedOrthodox', 'red-orthodox', 4, CAL_RED_ORTHODOX),
    image: `${CAL_IMG}/red-orthodox/hero.jpg?v=p8`,
    images: [
      `${CAL_IMG}/red-orthodox/2.jpg?v=2027b`,
      `${CAL_IMG}/red-orthodox/3.jpg?v=2027b`,
      `${CAL_IMG}/red-orthodox/4.jpg?v=2027b`,
    ],
  },
  calendarProduct('calKidsPets', 'kids-pets', 4, CAL_QUARTER),
  {
    ...calendarProduct('calSpiralOrthodox', 'spiral-orthodox', 12, CAL_SPIRAL_ORTHODOX),
    image: `${CAL_IMG}/spiral-orthodox/hero.jpg?v=tent3d`,
    images: [
      `${CAL_IMG}/spiral-orthodox/2.jpg?v=match`,
      `${CAL_IMG}/spiral-orthodox/3.jpg?v=match`,
      `${CAL_IMG}/spiral-orthodox/4.jpg?v=match`,
      `${CAL_IMG}/spiral-orthodox/5.jpg?v=match`,
      `${CAL_IMG}/spiral-orthodox/6.jpg?v=match`,
      `${CAL_IMG}/spiral-orthodox/7.jpg?v=match`,
      `${CAL_IMG}/spiral-orthodox/8.jpg?v=match`,
      `${CAL_IMG}/spiral-orthodox/9.jpg?v=match`,
      `${CAL_IMG}/spiral-orthodox/10.jpg?v=match`,
      `${CAL_IMG}/spiral-orthodox/11.jpg?v=match`,
      `${CAL_IMG}/spiral-orthodox/12.jpg?v=match`,
    ],
  },
  {
    ...calendarProduct('calSpiralLandscape', 'spiral-landscape', 12, CAL_DESK),
    image: `${CAL_IMG}/spiral-landscape/hero.jpg?v=p8n`,
    images: [
      `${CAL_IMG}/spiral-landscape/2.png?v=user`,
      `${CAL_IMG}/spiral-landscape/3.png?v=user`,
      `${CAL_IMG}/spiral-landscape/4.png?v=user`,
      `${CAL_IMG}/spiral-landscape/5.png?v=user`,
      `${CAL_IMG}/spiral-landscape/6.png?v=user`,
      `${CAL_IMG}/spiral-landscape/7.png?v=user`,
      `${CAL_IMG}/spiral-landscape/8.png?v=user`,
      `${CAL_IMG}/spiral-landscape/9.png?v=user`,
      `${CAL_IMG}/spiral-landscape/10.png?v=user`,
      `${CAL_IMG}/spiral-landscape/11.png?v=user`,
      `${CAL_IMG}/spiral-landscape/12.png?v=user`,
    ],
  },
  {
    ...calendarProduct('calPocketOrthodox', 'pocket-orthodox', 1, CAL_POCKET),
    image: `${CAL_IMG}/pocket-orthodox/hero.png?v=p8`,
  },
  {
    ...calendarProduct('calPocketLandscape', 'pocket-landscape', 1, CAL_POCKET),
    image: `${CAL_IMG}/pocket-landscape/hero.png?v=p8`,
  },
  {
    ...calendarProduct('calPocketCar', 'pocket-car', 1, CAL_POCKET),
    image: `${CAL_IMG}/pocket-car/hero.png?v=p8`,
  },
  {
    ...calendarProduct('calWildGreen', 'wild-green', 4, CAL_QUARTER),
    image: `${CAL_IMG}/wild-green/hero.jpg?v=p8`,
    images: [
      `${CAL_IMG}/wild-green/2.jpg?v=2027`,
      `${CAL_IMG}/wild-green/3.jpg?v=2027`,
      `${CAL_IMG}/wild-green/4.jpg?v=2027`,
    ],
  },
  calendarProduct('calLandscapeWave', 'landscape-wave', 4, CAL_QUARTER),
  calendarProduct('calCarsWave', 'cars-wave', 4, CAL_QUARTER),
  {
    ...calendarProduct('calChurchesWave', 'churches-wave', 4, CAL_QUARTER),
    image: `${CAL_IMG}/churches-wave/hero.jpg?v=p8`,
    images: [
      `${CAL_IMG}/churches-wave/2.jpg?v=2027`,
      `${CAL_IMG}/churches-wave/3.jpg?v=2027`,
      `${CAL_IMG}/churches-wave/4.jpg?v=2027`,
    ],
  },
  calendarProduct('calSmallOrthodox', 'small-orthodox', 4, CAL_ICONS_QUARTER),
  {
    ...calendarProduct('calDeskLandscape', 'desk-landscape', 11, CAL_DESK),
    image: `${CAL_IMG}/desk-landscape/hero.jpg?v=tent3d`,
    images: [
      `${CAL_IMG}/desk-landscape/2.png`,
      `${CAL_IMG}/desk-landscape/3.png`,
      `${CAL_IMG}/desk-landscape/4.png`,
      `${CAL_IMG}/desk-landscape/5.png`,
      `${CAL_IMG}/desk-landscape/6.png`,
      `${CAL_IMG}/desk-landscape/7.png`,
      `${CAL_IMG}/desk-landscape/8.png`,
      `${CAL_IMG}/desk-landscape/9.png`,
      `${CAL_IMG}/desk-landscape/10.png`,
      `${CAL_IMG}/desk-landscape/11.png`,
    ],
  },
  {
    ...calendarProduct('calDeskOrthodox', 'desk-orthodox', 12, CAL_DESK),
    image: `${CAL_IMG}/desk-orthodox/hero.jpg?v=p8n`,
    images: [
      `${CAL_IMG}/desk-orthodox/2.jpg?v=icons`,
      `${CAL_IMG}/desk-orthodox/3.jpg?v=icons`,
      `${CAL_IMG}/desk-orthodox/4.jpg?v=icons`,
      `${CAL_IMG}/desk-orthodox/5.jpg?v=icons`,
      `${CAL_IMG}/desk-orthodox/6.jpg?v=icons`,
      `${CAL_IMG}/desk-orthodox/7.jpg?v=icons`,
      `${CAL_IMG}/desk-orthodox/8.jpg?v=icons`,
      `${CAL_IMG}/desk-orthodox/9.jpg?v=icons`,
      `${CAL_IMG}/desk-orthodox/10.jpg?v=icons`,
      `${CAL_IMG}/desk-orthodox/11.jpg?v=icons`,
      `${CAL_IMG}/desk-orthodox/12.jpg?v=icons`,
    ],
  },
];

export const PROMO_CATALOG_PRODUCTS: PromoCatalogProduct[] =
  PROMO_CATALOG_PRODUCTS_RAW.map((product) => ({
    ...product,
    image: withLogoCache(product.image, product.id),
  }));

export const PROMO_CATALOG_COVER_IMAGES = [
  withLogoCache(`${MERCH_IMG}/mug-classic-p8.jpg?v=p8n`, 'classic'),
  `${CAL_IMG}/classic-metal/hero.jpg?v=a4h`,
  `${MERCH_IMG}/armada.jpg?v=p8`,
  `${CAL_IMG}/landscape-4/hero.png?v=p8`,
  withLogoCache(`${MERCH_IMG}/key-heart.jpg?v=p8n`, 'keyHeart'),
  `${CAL_IMG}/desk-landscape/hero.jpg?v=tent3d`,
] as const;

const MUG_IDS = [
  'classic',
  'inner',
  'goldHandle',
  'silverHandle',
  'heartHandle',
  'corkLid',
  'bianca',
  'happyNewYear',
  'stackable',
] as const;

const APPAREL_MERCH_IDS = [
  'tshirt',
  'bluzonCrew',
  'bluzonHood',
  'bluzonZip',
  'bluzonZipHood',
  'bluzonQuarterZip',
  'polarZip',
  'polarQuarterZip',
  'polarVest',
] as const;

const MERCH_IDS = [
  ...APPAREL_MERCH_IDS,
  'bottleRaise',
  'bottleAlu600',
  'bottleAlu400',
  'towelPure',
  'bagNaturella',
  'notebookA4',
  'notebookA5',
  'notebookForest',
  'notebookMini',
  'notebookGratz',
  'notebookNoteA5',
  'notebookHelsinki',
  'armada',
  'oggi',
  'alfa',
  'twister',
  'lighterUnilite',
  'lighterMavrovo',
  'lighterFresh',
  'keyHouse',
  'keyCircle',
  'keyCk40',
  'keyHeart',
  'keyCf40',
  'keyHbRound',
  'keyHbSquare',
  'keyHbOval',
] as const;

export const MERCH_TOC_GROUPS = [
  {
    key: 'merchApparel',
    ids: [...APPAREL_MERCH_IDS],
  },
  {
    key: 'merchBottles',
    ids: ['bottleRaise', 'bottleAlu600', 'bottleAlu400', 'towelPure', 'bagNaturella'],
  },
  {
    key: 'merchNotebooks',
    ids: [
      'notebookA4',
      'notebookA5',
      'notebookForest',
      'notebookMini',
      'notebookGratz',
      'notebookNoteA5',
      'notebookHelsinki',
    ],
  },
  {
    key: 'merchWrite',
    ids: [
      'armada',
      'oggi',
      'alfa',
      'twister',
      'lighterUnilite',
      'lighterMavrovo',
      'lighterFresh',
    ],
  },
  {
    key: 'merchKeys',
    ids: [
      'keyHouse',
      'keyCircle',
      'keyCk40',
      'keyHeart',
      'keyCf40',
      'keyHbRound',
      'keyHbSquare',
      'keyHbOval',
    ],
  },
] as const;

/** All densities: at most 2 calendars per page (promo-cal-page--one|two). */
const CALENDAR_PAGE_GROUPS: string[][] = [
  ['calTrodelen'],
  ['calTrodelenRed'],
  ['calClassicPlastic', 'calClassicMetal'],
  ['calOrthodox6'],
  ['calOrthodox4', 'calRedOrthodox'],
  ['calSmallOrthodox', 'calNarrowOrthodox'],
  ['calSpiralOrthodox', 'calDeskOrthodox'],
  ['calPocketOrthodox'],
  ['calLandscape6'],
  ['calLandscape4', 'calLandscapeWave'],
  ['calSpiralLandscape', 'calDeskLandscape'],
  ['calPocketLandscape'],
  ['calMosques'],
  ['calChurchesWave'],
  ['calCars', 'calTrucks'],
  ['calCarsWave', 'calPocketCar'],
  ['calWild'],
  ['calWildGreen', 'calDomestic'],
  ['calPets', 'calKidsPets'],
];

export const CALENDAR_TOC_GROUPS = [
  {
    key: 'calTrodelen',
    ids: ['calTrodelen'],
  },
  {
    key: 'calTrodelenRed',
    ids: ['calTrodelenRed'],
  },
  {
    key: 'calClassic',
    ids: ['calClassicPlastic', 'calClassicMetal'],
  },
  {
    key: 'calChurch',
    ids: [
      'calOrthodox6',
      'calOrthodox4',
      'calRedOrthodox',
      'calSmallOrthodox',
      'calNarrowOrthodox',
      'calSpiralOrthodox',
      'calDeskOrthodox',
      'calPocketOrthodox',
    ],
  },
  {
    key: 'calLandscape',
    ids: [
      'calLandscape6',
      'calLandscape4',
      'calLandscapeWave',
      'calSpiralLandscape',
      'calDeskLandscape',
      'calPocketLandscape',
    ],
  },
  {
    key: 'calMosques',
    ids: ['calMosques', 'calChurchesWave'],
  },
  {
    key: 'calCars',
    ids: ['calCars', 'calTrucks', 'calCarsWave', 'calPocketCar'],
  },
  {
    key: 'calWildlife',
    ids: ['calWild', 'calWildGreen', 'calDomestic'],
  },
  {
    key: 'calPets',
    ids: ['calPets', 'calKidsPets'],
  },
] as const;

export type PromoCatalogDensity = 'compact' | 'dense';

export type PromoCatalogPage = {
  id: PromoCatalogPageId;
  number: number;
  productIds?: string[];
  section?: 'mugs' | 'merch' | 'calendars';
  tocKey?: string;
};

function chunkIds(ids: readonly string[], size: number): string[][] {
  const groups: string[][] = [];
  for (let index = 0; index < ids.length; index += size) {
    groups.push([...ids.slice(index, index + size)]);
  }
  return groups;
}

function mugTocKey(productIds: string[]): string {
  if (productIds.length >= 4) return 'mugs-set';
  if (productIds.length === 1 && productIds[0] === 'stackable') return 'mugs-3';
  if (
    productIds.includes('goldHandle') ||
    productIds.includes('silverHandle') ||
    productIds.includes('heartHandle')
  ) {
    return 'mugs-handles';
  }
  if (productIds.includes('bianca') || productIds.includes('happyNewYear')) {
    return 'mugs-2';
  }
  return 'mugs-1';
}

const MERCH_PAGE_GROUPS_DENSE: string[][] = [
  ['tshirt', 'bluzonCrew', 'bluzonHood', 'bluzonZip'],
  ['bluzonZipHood', 'bluzonQuarterZip'],
  ['polarZip', 'polarQuarterZip', 'polarVest'],
  ['bottleRaise', 'bottleAlu600', 'bottleAlu400', 'towelPure'],
  ['bagNaturella'],
  ['notebookA4', 'notebookA5', 'notebookForest', 'notebookMini'],
  ['notebookGratz', 'notebookNoteA5', 'notebookHelsinki'],
  ['armada', 'oggi', 'alfa', 'twister'],
  ['lighterUnilite', 'lighterMavrovo', 'lighterFresh'],
  ['keyHouse', 'keyCircle', 'keyCk40', 'keyHeart'],
  ['keyCf40', 'keyHbRound', 'keyHbSquare', 'keyHbOval'],
];

function productHasExtraImages(id: string): boolean {
  const product = PROMO_CATALOG_PRODUCTS_RAW.find((item) => item.id === id);
  return Boolean(product?.images?.length);
}

/** Phone: one calendar per page whenever extra sheets/months exist. */
function compactCalendarGroups(source: string[][]): string[][] {
  const groups: string[][] = [];
  let withoutExtras: string[] = [];

  const flush = () => {
    if (withoutExtras.length) {
      groups.push(withoutExtras);
      withoutExtras = [];
    }
  };

  for (const group of source) {
    for (const id of group) {
      if (productHasExtraImages(id)) {
        flush();
        groups.push([id]);
      } else {
        withoutExtras.push(id);
        if (withoutExtras.length === 2) flush();
      }
    }
  }
  flush();
  return groups;
}

function buildCatalogPages(productsPerPage: 2 | 4): PromoCatalogPage[] {
  const mugGroups = chunkIds(MUG_IDS, productsPerPage);
  const merchGroups =
    productsPerPage === 4
      ? MERCH_PAGE_GROUPS_DENSE
      : MERCH_PAGE_GROUPS_DENSE.flatMap((ids) =>
          chunkIds(ids, productsPerPage),
        );
  const calendarGroups =
    productsPerPage === 2
      ? compactCalendarGroups(CALENDAR_PAGE_GROUPS)
      : CALENDAR_PAGE_GROUPS;
  const mugStart = 4;
  const merchStart = mugStart + mugGroups.length;
  const calendarStart = merchStart + merchGroups.length;

  const pages: PromoCatalogPage[] = [
    { id: 'cover', number: 1 },
    { id: 'contents', number: 2 },
    { id: 'info', number: 3 },
    ...mugGroups.map((productIds, index) => ({
      id: `mugs-${index + 1}` as PromoCatalogPageId,
      number: mugStart + index,
      section: 'mugs' as const,
      productIds,
      tocKey: mugTocKey(productIds),
    })),
    ...merchGroups.map((productIds, index) => ({
      id: `merch-${index + 1}` as PromoCatalogPageId,
      number: merchStart + index,
      section: 'merch' as const,
      productIds,
    })),
    ...calendarGroups.map((productIds, index) => ({
      id: `calendars-${index + 1}` as PromoCatalogPageId,
      number: calendarStart + index,
      section: 'calendars' as const,
      productIds,
    })),
    {
      id: 'back' as const,
      number: calendarStart + calendarGroups.length,
    },
  ];

  return pages;
}

/** Phone: at most 2 products per page. */
export const PROMO_CATALOG_PAGES_COMPACT = buildCatalogPages(2);
/** Desktop and A4 print: 4 merch/mugs per page, 2 calendars per page. */
export const PROMO_CATALOG_PAGES_DENSE = buildCatalogPages(4);

export const PROMO_CATALOG_PAGES = PROMO_CATALOG_PAGES_COMPACT;

export function getPromoCatalogPages(density: PromoCatalogDensity): PromoCatalogPage[] {
  return density === 'compact'
    ? PROMO_CATALOG_PAGES_COMPACT
    : PROMO_CATALOG_PAGES_DENSE;
}

function tocRangesFor(
  pages: PromoCatalogPage[],
  section: 'merch' | 'calendars',
  groups: readonly { key: string; ids: readonly string[] }[],
) {
  return groups.map((group) => {
    const numbers = pages
      .filter(
        (page) =>
          page.section === section &&
          page.productIds?.some((id) =>
            (group.ids as readonly string[]).includes(id),
          ),
      )
      .map((page) => page.number);
    return {
      key: group.key,
      pageNumber: numbers[0] ?? 0,
      endPage: numbers[numbers.length - 1],
    };
  });
}

export function merchTocRanges(pages: PromoCatalogPage[]) {
  return tocRangesFor(pages, 'merch', MERCH_TOC_GROUPS);
}

export function mugTocRanges(pages: PromoCatalogPage[]) {
  const ranges: { key: string; pageNumber: number; endPage: number }[] = [];
  for (const page of pages) {
    if (page.section !== 'mugs') continue;
    const key = page.tocKey ?? page.id;
    const last = ranges[ranges.length - 1];
    if (last && last.key === key) {
      last.endPage = page.number;
      continue;
    }
    ranges.push({ key, pageNumber: page.number, endPage: page.number });
  }
  return ranges;
}

export function calendarTocRanges(pages: PromoCatalogPage[]) {
  return tocRangesFor(pages, 'calendars', CALENDAR_TOC_GROUPS);
}

export function mapPromoCatalogPageIndex(
  fromPages: PromoCatalogPage[],
  toPages: PromoCatalogPage[],
  index: number,
) {
  const from = fromPages[index];
  if (!from) return 0;
  if (
    from.id === 'cover' ||
    from.id === 'contents' ||
    from.id === 'info' ||
    from.id === 'back' ||
    from.id === 'blank'
  ) {
    const match = toPages.findIndex((page) => page.id === from.id);
    return match >= 0 ? match : 0;
  }
  const productId = from.productIds?.[0];
  if (productId) {
    const match = toPages.findIndex((page) =>
      page.productIds?.includes(productId),
    );
    if (match >= 0) return match;
  }
  if (from.section) {
    const match = toPages.findIndex((page) => page.section === from.section);
    if (match >= 0) return match;
  }
  return Math.min(index, Math.max(0, toPages.length - 1));
}

export function getPromoCatalogProduct(id: string): PromoCatalogProduct | undefined {
  return PROMO_CATALOG_PRODUCTS.find((item) => item.id === id);
}

export function isCalendarProductId(id: string): boolean {
  return id.startsWith('cal');
}
