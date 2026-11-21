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

export type PromoCatalogPageId =
  | 'cover'
  | 'contents'
  | 'back'
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
  ['1', 550],
  ['10', 450],
  ['20', 380],
  ['50', 350],
  ['100+', 320],
]);
const PRICE_SWEAT = breaks([
  ['1', 1100],
  ['10', 1000],
  ['20', 900],
  ['50', 800],
  ['100+', 750],
]);
const PRICE_HOOD = breaks([
  ['1', 1200],
  ['10', 1100],
  ['20', 1000],
  ['50', 900],
  ['100+', 800],
]);
const PRICE_ZIP = breaks([
  ['1', 1300],
  ['10', 1200],
  ['20', 1100],
  ['50', 950],
  ['100+', 850],
]);
const PRICE_MUG_WHITE = breaks([
  ['1', 280],
  ['10–20', 230],
  ['20–50', 200],
  ['50–100', 170],
  ['100+', 150],
]);
const PRICE_MUG_INNER = breaks([
  ['1', 330],
  ['10–20', 280],
  ['20–50', 250],
  ['50–100', 230],
  ['100+', 200],
]);
const CAL_QUARTER = breaks([
  ['30–50', 75],
  ['50–100', 60],
  ['100+', 50],
]);
const CAL_SIXTH = breaks([
  ['30–50', 95],
  ['50–100', 80],
  ['100+', 70],
]);
const CAL_NARROW = breaks([
  ['30–50', 70],
  ['50–100', 60],
  ['100+', 45],
]);
const CAL_SPIRAL = breaks([
  ['30–50', 80],
  ['50–100', 65],
  ['100+', 55],
]);
const CAL_TRODELEN = breaks([
  ['30–50', 160],
  ['50–100', 140],
  ['100+', 120],
]);
const CAL_POCKET = breaks([['100+', 12]]);

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
  return {
    id,
    image: `${MERCH_IMG}/${file}`,
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
  return {
    id,
    image: `${base}/hero.jpg`,
    images:
      sheets > 1
        ? Array.from({ length: sheets - 1 }, (_, i) => `${base}/${i + 2}.jpg`)
        : undefined,
    prices,
  };
}

export const PROMO_CATALOG_PRODUCTS: PromoCatalogProduct[] = [
  {
    id: 'classic',
    href: '/products/mug-classic',
    image: '/mugs/mug-white-classic-v2.jpg',
    prices: PRICE_MUG_WHITE,
  },
  {
    id: 'inner',
    href: '/products/mug-inner-red',
    image: '/supplier/koni/B11T-01.jpg',
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
    id: 'stackable',
    image: '/supplier/koni/BKD6T-MG.jpg',
    prices: [
      { label: '1', price: 350 },
      { label: '10', price: 320 },
      { label: '20', price: 290 },
      { label: '50', price: 260 },
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
      { label: '1', price: 360 },
      { label: '10', price: 320 },
      { label: '20', price: 290 },
      { label: '50', price: 270 },
      { label: '100+', price: 240 },
    ],
  },
  merchProduct(
    'bianca',
    'mug-bianca.jpg?v=2',
    breaks([
      ['1', 300],
      ['10', 280],
      ['20', 260],
      ['50', 230],
      ['100+', 200],
    ]),
    ['#86efac', '#dc2626', '#111111'],
  ),
  merchProduct(
    'armada',
    'armada.jpg',
    breaks([
      ['100', 45],
      ['200', 42],
      ['300+', 39],
    ]),
    ['#7f1d1d', '#c0c0c0', '#4b5563', '#e8b4b8', '#27272a', '#111111'],
  ),
  merchProduct(
    'oggi',
    'pen-oggi.jpg',
    breaks([
      ['100', 40],
      ['200', 37],
      ['300+', 33],
    ]),
    ['#a855f7', '#3b82f6', '#c0c0c0', '#1e3a8a', '#f4f4f5', '#dc2626', '#111111'],
  ),
  merchProduct(
    'alfa',
    'pen-alfa.jpg',
    breaks([
      ['100', 18],
      ['200', 16.5],
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
      ['100', 20],
      ['200', 18],
      ['300+', 16],
    ]),
    ['#a855f7', '#9ca3af', '#f4f4f5', '#1e3a8a', '#111111'],
  ),
  merchProduct(
    'keyHouse',
    'key-house.jpg',
    breaks([
      ['50', 40],
      ['100+', 30],
    ]),
  ),
  merchProduct(
    'keyCircle',
    'key-circle.jpg',
    breaks([
      ['50', 40],
      ['100+', 30],
    ]),
  ),
  merchProduct(
    'keyCk40',
    'key-ck40.jpg',
    breaks([
      ['50', 50],
      ['100+', 40],
    ]),
  ),
  merchProduct(
    'keyHeart',
    'key-heart.jpg',
    breaks([
      ['50', 50],
      ['100+', 40],
    ]),
  ),
  merchProduct(
    'keyCf40',
    'key-cf40.jpg',
    breaks([
      ['50', 40],
      ['100+', 30],
    ]),
  ),
  merchProduct(
    'keyHbRound',
    'key-hb-round.jpg',
    breaks([
      ['10', 130],
      ['20', 120],
      ['50', 100],
      ['100+', 90],
    ]),
  ),
  merchProduct(
    'keyHbSquare',
    'key-hb-square.jpg',
    breaks([
      ['10', 130],
      ['20', 120],
      ['50', 100],
      ['100+', 90],
    ]),
  ),
  merchProduct(
    'keyHbOval',
    'key-hb-oval.jpg',
    breaks([
      ['10', 130],
      ['20', 120],
      ['50', 100],
      ['100+', 90],
    ]),
  ),
  merchProduct(
    'lighterLuss',
    'lighter-luss.jpg',
    breaks([
      ['100', 39],
      ['200', 28],
      ['300+', 26],
    ]),
  ),
  merchProduct(
    'lighterMavrovo',
    'lighter-mavrovo.jpg',
    breaks([
      ['100', 19],
      ['200', 17],
      ['300+', 15.5],
    ]),
    ['#22c55e', '#2563eb', '#dc2626', '#111111'],
  ),
  merchProduct(
    'lighterFresh',
    'lighter-fresh.jpg',
    breaks([
      ['100', 25],
      ['200', 23],
      ['300+', 21],
    ]),
    ['#22c55e', '#2563eb', '#dc2626', '#111111'],
  ),
  merchProduct(
    'bottleRaise',
    'bottle-raise.jpg',
    breaks([
      ['1', 350],
      ['10', 310],
      ['20', 280],
      ['50', 240],
      ['100+', 200],
    ]),
  ),
  merchProduct(
    'towelPure',
    'towel-pure.jpg',
    breaks([
      ['10', 50],
      ['50', 40],
      ['100+', 30],
    ]),
  ),
  merchProduct(
    'bottleAlu600',
    'bottle-alu-600.jpg?v=2',
    breaks([
      ['1', 400],
      ['10', 380],
      ['20', 340],
      ['50', 310],
      ['100+', 280],
    ]),
  ),
  merchProduct(
    'bottleAlu400',
    'bottle-alu-400.jpg',
    breaks([
      ['1', 350],
      ['10', 330],
      ['20', 300],
      ['50', 280],
      ['100+', 250],
    ]),
  ),
  {
    id: 'tshirt',
    href: '/products/tshirt-unisex',
    image: '/t-shirts/unisex/bela-front.jpg?v=3',
    prices: PRICE_TEE,
    swatches: TSHIRT_SWATCHES,
  },
  {
    id: 'bluzonCrew',
    href: '/products/hoodie-crewneck',
    image: '/hoodies/crewneck/bela-front.jpg?v=1',
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
  {
    ...calendarProduct('calTrodelen', 'trodelen', 1, CAL_TRODELEN),
    image: `${CAL_IMG}/trodelen/hero.png`,
  },
  {
    ...calendarProduct('calWild', 'wild', 6, CAL_SIXTH),
    image: `${CAL_IMG}/wild/hero.png`,
    images: [
      `${CAL_IMG}/wild/2.jpg`,
      `${CAL_IMG}/wild/3.jpg`,
      `${CAL_IMG}/wild/4.jpg`,
      `${CAL_IMG}/wild/5.jpg`,
      `${CAL_IMG}/wild/6.png`,
    ],
  },
  {
    ...calendarProduct('calOrthodox6', 'orthodox-6', 6, CAL_SIXTH),
    image: `${CAL_IMG}/orthodox-6/hero.png`,
    images: [
      `${CAL_IMG}/orthodox-6/2.jpg`,
      `${CAL_IMG}/orthodox-6/3.jpg`,
      `${CAL_IMG}/orthodox-6/4.jpg`,
      `${CAL_IMG}/orthodox-6/5.png`,
      `${CAL_IMG}/orthodox-6/6.png`,
    ],
  },
  {
    ...calendarProduct('calLandscape6', 'landscape-6', 6, CAL_SIXTH),
    image: `${CAL_IMG}/landscape-6/hero.png`,
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
    image: `${CAL_IMG}/cars/hero.png`,
    images: [
      `${CAL_IMG}/cars/2.png`,
      `${CAL_IMG}/cars/3.png`,
      `${CAL_IMG}/cars/4.png`,
    ],
  },
  {
    ...calendarProduct('calLandscape4', 'landscape-4', 4, CAL_QUARTER),
    image: `${CAL_IMG}/landscape-4/hero.png`,
    images: [
      `${CAL_IMG}/landscape-4/2.png`,
      `${CAL_IMG}/landscape-4/3.png`,
      `${CAL_IMG}/landscape-4/4.png`,
    ],
  },
  {
    ...calendarProduct('calDomestic', 'domestic', 4, CAL_QUARTER),
    image: `${CAL_IMG}/domestic/hero.png`,
    images: [
      `${CAL_IMG}/domestic/2.png`,
      `${CAL_IMG}/domestic/3.png`,
      `${CAL_IMG}/domestic/4.png`,
    ],
  },
  {
    ...calendarProduct('calMosques', 'mosques', 4, CAL_QUARTER),
    image: `${CAL_IMG}/mosques/hero.png`,
    images: [
      `${CAL_IMG}/mosques/2.png`,
      `${CAL_IMG}/mosques/3.png`,
      `${CAL_IMG}/mosques/4.png`,
    ],
  },
  {
    ...calendarProduct('calTrucks', 'trucks', 4, CAL_QUARTER),
    image: `${CAL_IMG}/trucks/hero.png`,
    images: [
      `${CAL_IMG}/trucks/2.png`,
      `${CAL_IMG}/trucks/3.png`,
      `${CAL_IMG}/trucks/4.png`,
    ],
  },
  {
    ...calendarProduct('calSpiralOrthodox', 'spiral-orthodox', 8, CAL_SPIRAL),
    image: `${CAL_IMG}/spiral-orthodox/hero.png`,
    images: [
      `${CAL_IMG}/spiral-orthodox/2.png`,
      `${CAL_IMG}/spiral-orthodox/3.png`,
      `${CAL_IMG}/spiral-orthodox/4.png`,
      `${CAL_IMG}/spiral-orthodox/5.png`,
      `${CAL_IMG}/spiral-orthodox/6.png`,
      `${CAL_IMG}/spiral-orthodox/7.png`,
      `${CAL_IMG}/spiral-orthodox/8.png`,
    ],
  },
  {
    ...calendarProduct('calSpiralLandscape', 'spiral-landscape', 12, CAL_SPIRAL),
    image: `${CAL_IMG}/spiral-landscape/hero.png`,
    images: [
      `${CAL_IMG}/spiral-landscape/2.png`,
      `${CAL_IMG}/spiral-landscape/3.png`,
      `${CAL_IMG}/spiral-landscape/4.png`,
      `${CAL_IMG}/spiral-landscape/5.png`,
      `${CAL_IMG}/spiral-landscape/6.png`,
      `${CAL_IMG}/spiral-landscape/7.png`,
      `${CAL_IMG}/spiral-landscape/8.png`,
      `${CAL_IMG}/spiral-landscape/9.png`,
      `${CAL_IMG}/spiral-landscape/10.png`,
      `${CAL_IMG}/spiral-landscape/11.png`,
      `${CAL_IMG}/spiral-landscape/12.png`,
    ],
  },
  {
    ...calendarProduct('calNarrowOrthodox', 'narrow-orthodox', 4, CAL_NARROW),
    image: `${CAL_IMG}/narrow-orthodox/hero.png`,
    images: [
      `${CAL_IMG}/narrow-orthodox/2.png`,
      `${CAL_IMG}/narrow-orthodox/3.png`,
      `${CAL_IMG}/narrow-orthodox/4.png`,
    ],
  },
  {
    ...calendarProduct('calOrthodox4', 'orthodox-4', 4, CAL_QUARTER),
    image: `${CAL_IMG}/orthodox-4/hero.png`,
    images: [
      `${CAL_IMG}/orthodox-4/2.png`,
      `${CAL_IMG}/orthodox-4/3.png`,
      `${CAL_IMG}/orthodox-4/4.png`,
    ],
  },
  {
    ...calendarProduct('calPets', 'pets', 4, CAL_QUARTER),
    image: `${CAL_IMG}/pets/hero.png`,
    images: [
      `${CAL_IMG}/pets/2.png`,
      `${CAL_IMG}/pets/3.png`,
      `${CAL_IMG}/pets/4.png`,
    ],
  },
  calendarProduct('calRedOrthodox', 'red-orthodox', 4, CAL_QUARTER),
  calendarProduct('calKidsPets', 'kids-pets', 4, CAL_QUARTER),
  {
    ...calendarProduct('calPocketOrthodox', 'pocket-orthodox', 1, CAL_POCKET),
    image: `${CAL_IMG}/pocket-orthodox/hero.png`,
  },
  {
    ...calendarProduct('calPocketPinup', 'pocket-pinup', 1, CAL_POCKET),
    image: `${CAL_IMG}/pocket-pinup/hero.png`,
  },
  {
    ...calendarProduct('calPocketLandscape', 'pocket-landscape', 1, CAL_POCKET),
    image: `${CAL_IMG}/pocket-landscape/hero.png`,
  },
  {
    ...calendarProduct('calPocketCar', 'pocket-car', 1, CAL_POCKET),
    image: `${CAL_IMG}/pocket-car/hero.png`,
  },
  calendarProduct('calWildGreen', 'wild-green', 4, CAL_QUARTER),
  calendarProduct('calLandscapeWave', 'landscape-wave', 4, CAL_QUARTER),
  calendarProduct('calCarsWave', 'cars-wave', 4, CAL_QUARTER),
  calendarProduct('calChurchesWave', 'churches-wave', 4, CAL_QUARTER),
  calendarProduct('calSmallOrthodox', 'small-orthodox', 4, CAL_QUARTER),
  {
    ...calendarProduct('calDeskLandscape', 'desk-landscape', 11, CAL_SPIRAL),
    image: `${CAL_IMG}/desk-landscape/hero.png`,
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
];

export const PROMO_CATALOG_COVER_IMAGES = [
  '/mugs/mug-white-classic-v2.jpg',
  `${CAL_IMG}/pets/hero.png`,
  `${MERCH_IMG}/armada.jpg`,
  `${CAL_IMG}/landscape-4/hero.png`,
  `${MERCH_IMG}/key-heart.jpg`,
  `${CAL_IMG}/desk-landscape/hero.png`,
] as const;

const MUG_IDS = [
  'classic',
  'inner',
  'bianca',
  'happyNewYear',
  'stackable',
] as const;

const MERCH_IDS = [
  'tshirt',
  'bluzonCrew',
  'bluzonHood',
  'bluzonZip',
  'bluzonZipHood',
  'bluzonQuarterZip',
  'bottleRaise',
  'bottleAlu600',
  'bottleAlu400',
  'towelPure',
  'armada',
  'oggi',
  'alfa',
  'twister',
  'lighterLuss',
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
    ids: [
      'tshirt',
      'bluzonCrew',
      'bluzonHood',
      'bluzonZip',
      'bluzonZipHood',
      'bluzonQuarterZip',
    ],
  },
  {
    key: 'merchBottles',
    ids: ['bottleRaise', 'bottleAlu600', 'bottleAlu400', 'towelPure'],
  },
  {
    key: 'merchWrite',
    ids: [
      'armada',
      'oggi',
      'alfa',
      'twister',
      'lighterLuss',
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

const CALENDAR_PAGE_GROUPS: string[][] = [
  ['calTrodelen'],
  ['calWild'],
  ['calOrthodox6'],
  ['calLandscape6'],
  ['calCars'],
  ['calLandscape4', 'calDomestic'],
  ['calMosques', 'calTrucks'],
  ['calSpiralOrthodox'],
  ['calSpiralLandscape'],
  ['calNarrowOrthodox', 'calOrthodox4'],
  ['calPets', 'calRedOrthodox'],
  ['calKidsPets', 'calWildGreen'],
  ['calPocketOrthodox', 'calPocketLandscape'],
  ['calLandscapeWave', 'calCarsWave'],
  ['calPocketPinup', 'calPocketCar'],
  ['calDeskLandscape'],
  ['calChurchesWave', 'calSmallOrthodox'],
];

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
  if (productIds.includes('bianca') || productIds.includes('happyNewYear')) {
    return 'mugs-2';
  }
  return 'mugs-1';
}

const MERCH_PAGE_GROUPS_DENSE: string[][] = [
  ['tshirt', 'bluzonCrew', 'bluzonHood', 'bluzonZip'],
  ['bluzonZipHood', 'bluzonQuarterZip'],
  ['bottleRaise', 'bottleAlu600', 'bottleAlu400', 'towelPure'],
  ['armada', 'oggi', 'alfa', 'twister'],
  ['lighterLuss', 'lighterMavrovo', 'lighterFresh'],
  ['keyHouse', 'keyCircle', 'keyCk40', 'keyHeart'],
  ['keyCf40', 'keyHbRound', 'keyHbSquare', 'keyHbOval'],
];

function buildCatalogPages(productsPerPage: 2 | 4): PromoCatalogPage[] {
  const mugGroups = chunkIds(MUG_IDS, productsPerPage);
  const merchGroups =
    productsPerPage === 4
      ? MERCH_PAGE_GROUPS_DENSE
      : chunkIds(MERCH_IDS, productsPerPage);
  const merchStart = 3 + mugGroups.length;
  const calendarStart = merchStart + merchGroups.length;

  return [
    { id: 'cover', number: 1 },
    { id: 'contents', number: 2 },
    ...mugGroups.map((productIds, index) => ({
      id: `mugs-${index + 1}` as PromoCatalogPageId,
      number: 3 + index,
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
    ...CALENDAR_PAGE_GROUPS.map((productIds, index) => ({
      id: `calendars-${index + 1}` as PromoCatalogPageId,
      number: calendarStart + index,
      section: 'calendars' as const,
      productIds,
    })),
    {
      id: 'back' as const,
      number: calendarStart + CALENDAR_PAGE_GROUPS.length,
    },
  ];
}

/** Phone: at most 2 products per page. */
export const PROMO_CATALOG_PAGES_COMPACT = buildCatalogPages(2);
/** Desktop and A4 print: 4 products per page. */
export const PROMO_CATALOG_PAGES_DENSE = buildCatalogPages(4);

export const PROMO_CATALOG_PAGES = PROMO_CATALOG_PAGES_COMPACT;

export function getPromoCatalogPages(density: PromoCatalogDensity): PromoCatalogPage[] {
  return density === 'compact'
    ? PROMO_CATALOG_PAGES_COMPACT
    : PROMO_CATALOG_PAGES_DENSE;
}

export function merchTocRanges(pages: PromoCatalogPage[]) {
  return MERCH_TOC_GROUPS.map((group) => {
    const numbers = pages
      .filter(
        (page) =>
          page.section === 'merch' &&
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

export function mapPromoCatalogPageIndex(
  fromPages: PromoCatalogPage[],
  toPages: PromoCatalogPage[],
  index: number,
) {
  const from = fromPages[index];
  if (!from) return 0;
  if (from.id === 'cover' || from.id === 'contents' || from.id === 'back') {
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
