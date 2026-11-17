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
  | 'mugs-1'
  | 'mugs-2'
  | 'mugs-3'
  | 'back'
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

/** Quantity breaks from the shop unit price (rounded to 10 MKD). Easy to edit. */
function qtyPrices(unit: number): PromoPriceBreak[] {
  const round = (value: number) => Math.max(10, Math.round(value / 10) * 10);
  return [
    { label: '1', price: unit },
    { label: '10', price: round(unit * 0.85) },
    { label: '20', price: round(unit * 0.78) },
    { label: '50', price: round(unit * 0.68) },
    { label: '100+', price: round(unit * 0.58) },
  ];
}

/** Calendar breaks: minimum 30. Easy to edit the unit price. */
function calendarPrices(unit: number): PromoPriceBreak[] {
  const round = (value: number) => Math.max(10, Math.round(value / 5) * 5);
  return [
    { label: '30–50', price: unit },
    { label: '50–100', price: round(unit * 0.86) },
    { label: '100+', price: round(unit * 0.74) },
  ];
}

/** Pens and lighters: minimum 100. */
function min100Prices(unit: number): PromoPriceBreak[] {
  return [{ label: '100+', price: unit }];
}

function withMin100(product: PromoCatalogProduct): PromoCatalogProduct {
  const unit = product.prices[0]?.price ?? 10;
  return { ...product, prices: min100Prices(unit) };
}

function merchProduct(
  id: string,
  file: string,
  unit: number,
  swatches?: string[],
): PromoCatalogProduct {
  return {
    id,
    image: `${MERCH_IMG}/${file}`,
    prices: qtyPrices(unit),
    swatches,
  };
}

function calendarProduct(
  id: string,
  folder: string,
  sheets: number,
  unit: number,
): PromoCatalogProduct {
  const base = `${CAL_IMG}/${folder}`;
  return {
    id,
    image: `${base}/hero.jpg`,
    images:
      sheets > 1
        ? Array.from({ length: sheets - 1 }, (_, i) => `${base}/${i + 2}.jpg`)
        : undefined,
    prices: calendarPrices(unit),
  };
}

export const PROMO_CATALOG_PRODUCTS: PromoCatalogProduct[] = [
  {
    id: 'classic',
    href: '/products/mug-b5kf-white',
    image: '/mugs/mug-b5kf-white.jpg',
    prices: qtyPrices(280),
  },
  {
    id: 'inner',
    href: '/products/mug-inner-red',
    image: '/supplier/koni/B11T-01.jpg',
    prices: qtyPrices(330),
    swatches: ['#dc2626', '#93c5fd', '#f9a8d4', '#7c3aed', '#c4b5fd'],
  },
  {
    id: 'magicGlossy',
    href: '/products/mug-magic-glossy',
    image: '/supplier/koni/B2CB-01.jpg',
    prices: qtyPrices(400),
  },
  {
    id: 'magicMatte',
    href: '/products/mug-magic-matte',
    image: '/supplier/koni/B2CB-07.jpg',
    prices: qtyPrices(350),
  },
  {
    id: 'windowBlue',
    href: '/products/mug-window-blue',
    image: '/supplier/koni/CB11T-BL.jpg',
    prices: qtyPrices(470),
  },
  {
    id: 'redPatch',
    href: '/products/mug-red-patch',
    image: '/mugs/mug-red-patch.jpg',
    prices: qtyPrices(470),
  },
  {
    id: 'heart',
    href: '/products/mug-heart-handle',
    image: '/mugs/mug-heart-handle.jpg',
    prices: qtyPrices(300),
  },
  {
    id: 'cork',
    href: '/products/mug-cork-lid',
    image: '/mugs/mug-cork-lid.jpg',
    prices: qtyPrices(450),
  },
  {
    id: 'frosted',
    href: '/products/mug-frosted',
    image: '/mugs/mug-frosted.jpg',
    prices: qtyPrices(400),
  },
  {
    id: 'football',
    href: '/products/mug-football-handle',
    image: '/supplier/koni/B11ZQ.jpg',
    prices: qtyPrices(400),
  },
  {
    id: 'roseSparkle',
    href: '/products/mug-rose-sparkle',
    image: '/supplier/koni/B17PZ.jpg',
    prices: qtyPrices(370),
  },
  {
    id: 'redSparkle',
    href: '/products/mug-red-sparkle',
    image: '/supplier/koni/B17MZ.jpg',
    prices: qtyPrices(370),
  },
  merchProduct('mia', 'mia.jpg', 280, [
    '#facc15',
    '#86efac',
    '#7dd3fc',
    '#1d4ed8',
    '#fb923c',
    '#dc2626',
  ]),
  merchProduct('bianca', 'mug-bianca.jpg', 300, [
    '#1e3a8a',
    '#86efac',
    '#dc2626',
    '#111111',
  ]),
  withMin100(
    merchProduct('armada', 'armada.jpg', 80, [
      '#7f1d1d',
      '#c0c0c0',
      '#4b5563',
      '#e8b4b8',
      '#27272a',
      '#111111',
    ]),
  ),
  withMin100(
    merchProduct('amiga', 'pen-amiga.jpg', 20, [
      '#1e3a8a',
      '#e5e7eb',
      '#fb923c',
      '#dc2626',
      '#111111',
    ]),
  ),
  merchProduct('keyCr18', 'key-cr18.jpg', 70),
  merchProduct('keyHouse', 'key-house.jpg', 70),
  merchProduct('keyCircle', 'key-circle.jpg', 70),
  merchProduct('keyCk40', 'key-ck40.jpg', 85),
  merchProduct('keyHeart', 'key-heart.jpg', 85),
  merchProduct('keyCf40', 'key-cf40.jpg', 70),
  merchProduct('keyHbRound', 'key-hb-round.jpg', 90),
  merchProduct('keyHbSquare', 'key-hb-square.jpg', 90),
  merchProduct('keyHbOval', 'key-hb-oval.jpg', 90),
  withMin100(
    merchProduct('lighterKrickMini', 'lighter-krick-mini.jpg', 30, [
      '#1e3a8a',
      '#e5e7eb',
      '#1e293b',
      '#dc2626',
      '#111111',
    ]),
  ),
  withMin100(merchProduct('lighterVulkan', 'lighter-vulkan.jpg', 70)),
  withMin100(
    merchProduct('lighterKrick', 'lighter-krick.jpg', 30, [
      '#1e3a8a',
      '#e5e7eb',
      '#111111',
    ]),
  ),
  withMin100(merchProduct('lighterLuss', 'lighter-luss.jpg', 55)),
  merchProduct('bottleRaise', 'bottle-raise.jpg', 310),
  merchProduct('coasterSquare', 'coaster-square.jpg', 150),
  merchProduct('pouchPure', 'pouch-pure.jpg', 25),
  merchProduct('coasterHb', 'coaster-hb.jpg', 90),
  merchProduct('bottleAlu600', 'bottle-alu-600.jpg', 390),
  merchProduct('bottleAlu500', 'bottle-alu-500.jpg', 290),
  merchProduct('polarZip', 'polar-zip.jpg?v=2', 990, [
    '#ffffff',
    '#1e3a8a',
    '#111111',
  ]),
  merchProduct('polarQuarterZip', 'polar-quarter-zip.jpg?v=2', 990, [
    '#ffffff',
    '#1e3a8a',
    '#111111',
  ]),
  merchProduct('polarVest', 'polar-vest.jpg?v=2', 890, [
    '#ffffff',
    '#1e3a8a',
    '#111111',
  ]),
  {
    ...merchProduct('bluzonHood', 'bluzon-hood.jpg', 1100, BLUZON_SWATCHES),
    href: '/products/hoodie-basic',
  },
  {
    ...merchProduct('bluzonZip', 'bluzon-zip.jpg', 1250, BLUZON_SWATCHES),
    href: '/products/hoodie-full-zip',
  },
  {
    ...merchProduct('bluzonZipHood', 'bluzon-zip-hood.jpg', 1250, BLUZON_SWATCHES),
    href: '/products/hoodie-zip-hood',
  },
  {
    ...merchProduct('bluzonQuarterZip', 'bluzon-quarter-zip.jpg', 1250, BLUZON_SWATCHES),
    href: '/products/hoodie-quarter-zip',
  },
  {
    ...calendarProduct('calTrodelen', 'trodelen', 1, 280),
    image: `${CAL_IMG}/trodelen/hero.png`,
  },
  {
    ...calendarProduct('calWild', 'wild', 6, 210),
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
    ...calendarProduct('calOrthodox6', 'orthodox-6', 6, 210),
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
    ...calendarProduct('calLandscape6', 'landscape-6', 6, 210),
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
    ...calendarProduct('calCars', 'cars', 4, 210),
    image: `${CAL_IMG}/cars/hero.png`,
    images: [
      `${CAL_IMG}/cars/2.png`,
      `${CAL_IMG}/cars/3.png`,
      `${CAL_IMG}/cars/4.png`,
    ],
  },
  {
    ...calendarProduct('calLandscape4', 'landscape-4', 4, 180),
    image: `${CAL_IMG}/landscape-4/hero.png`,
    images: [
      `${CAL_IMG}/landscape-4/2.png`,
      `${CAL_IMG}/landscape-4/3.png`,
      `${CAL_IMG}/landscape-4/4.png`,
    ],
  },
  {
    ...calendarProduct('calDomestic', 'domestic', 4, 180),
    image: `${CAL_IMG}/domestic/hero.png`,
    images: [
      `${CAL_IMG}/domestic/2.png`,
      `${CAL_IMG}/domestic/3.png`,
      `${CAL_IMG}/domestic/4.png`,
    ],
  },
  {
    ...calendarProduct('calMosques', 'mosques', 4, 180),
    image: `${CAL_IMG}/mosques/hero.png`,
    images: [
      `${CAL_IMG}/mosques/2.png`,
      `${CAL_IMG}/mosques/3.png`,
      `${CAL_IMG}/mosques/4.png`,
    ],
  },
  {
    ...calendarProduct('calTrucks', 'trucks', 4, 180),
    image: `${CAL_IMG}/trucks/hero.png`,
    images: [
      `${CAL_IMG}/trucks/2.png`,
      `${CAL_IMG}/trucks/3.png`,
      `${CAL_IMG}/trucks/4.png`,
    ],
  },
  {
    ...calendarProduct('calSpiralOrthodox', 'spiral-orthodox', 8, 180),
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
    ...calendarProduct('calSpiralLandscape', 'spiral-landscape', 12, 180),
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
    ...calendarProduct('calNarrowOrthodox', 'narrow-orthodox', 4, 170),
    image: `${CAL_IMG}/narrow-orthodox/hero.png`,
    images: [
      `${CAL_IMG}/narrow-orthodox/2.png`,
      `${CAL_IMG}/narrow-orthodox/3.png`,
      `${CAL_IMG}/narrow-orthodox/4.png`,
    ],
  },
  {
    ...calendarProduct('calOrthodox4', 'orthodox-4', 4, 180),
    image: `${CAL_IMG}/orthodox-4/hero.png`,
    images: [
      `${CAL_IMG}/orthodox-4/2.png`,
      `${CAL_IMG}/orthodox-4/3.png`,
      `${CAL_IMG}/orthodox-4/4.png`,
    ],
  },
  {
    ...calendarProduct('calPets', 'pets', 4, 180),
    image: `${CAL_IMG}/pets/hero.png`,
    images: [
      `${CAL_IMG}/pets/2.png`,
      `${CAL_IMG}/pets/3.png`,
      `${CAL_IMG}/pets/4.png`,
    ],
  },
  calendarProduct('calRedOrthodox', 'red-orthodox', 4, 180),
  calendarProduct('calKidsPets', 'kids-pets', 4, 180),
  {
    ...calendarProduct('calPocketOrthodox', 'pocket-orthodox', 1, 45),
    image: `${CAL_IMG}/pocket-orthodox/hero.png`,
  },
  {
    ...calendarProduct('calPocketPinup', 'pocket-pinup', 1, 45),
    image: `${CAL_IMG}/pocket-pinup/hero.png`,
  },
  {
    ...calendarProduct('calPocketLandscape', 'pocket-landscape', 1, 45),
    image: `${CAL_IMG}/pocket-landscape/hero.png`,
  },
  {
    ...calendarProduct('calPocketCar', 'pocket-car', 1, 45),
    image: `${CAL_IMG}/pocket-car/hero.png`,
  },
  calendarProduct('calWildGreen', 'wild-green', 4, 180),
  calendarProduct('calLandscapeWave', 'landscape-wave', 4, 180),
  calendarProduct('calCarsWave', 'cars-wave', 4, 180),
  calendarProduct('calChurchesWave', 'churches-wave', 4, 180),
  calendarProduct('calSmallOrthodox', 'small-orthodox', 4, 180),
  {
    ...calendarProduct('calDeskLandscape', 'desk-landscape', 11, 180),
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
  '/mugs/mug-b5kf-white.jpg',
  `${CAL_IMG}/pets/hero.png`,
  `${MERCH_IMG}/armada.jpg`,
  `${CAL_IMG}/landscape-4/hero.png`,
  `${MERCH_IMG}/key-heart.jpg`,
  `${CAL_IMG}/desk-landscape/hero.png`,
] as const;

const MERCH_PAGE_GROUPS: string[][] = [
  ['mia', 'bianca', 'bottleRaise', 'bottleAlu600'],
  ['keyCr18', 'keyHouse', 'keyCircle', 'keyCk40'],
  ['keyHeart', 'keyCf40', 'keyHbRound', 'keyHbSquare'],
  ['keyHbOval', 'coasterSquare', 'coasterHb', 'pouchPure'],
  ['armada', 'amiga', 'lighterKrickMini', 'lighterKrick'],
  ['lighterVulkan', 'lighterLuss', 'bottleAlu500'],
  ['polarZip', 'polarQuarterZip', 'polarVest'],
  ['bluzonHood', 'bluzonZip', 'bluzonZipHood', 'bluzonQuarterZip'],
];

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

export const PROMO_CATALOG_PAGES: {
  id: PromoCatalogPageId;
  number: number;
  productIds?: string[];
  section?: 'mugs' | 'merch' | 'calendars';
}[] = [
  { id: 'cover', number: 1 },
  { id: 'contents', number: 2 },
  {
    id: 'mugs-1',
    number: 3,
    section: 'mugs',
    productIds: ['classic', 'inner', 'magicGlossy', 'magicMatte'],
  },
  {
    id: 'mugs-2',
    number: 4,
    section: 'mugs',
    productIds: ['windowBlue', 'redPatch', 'heart', 'cork'],
  },
  {
    id: 'mugs-3',
    number: 5,
    section: 'mugs',
    productIds: ['frosted', 'football', 'roseSparkle', 'redSparkle'],
  },
  ...MERCH_PAGE_GROUPS.map((productIds, index) => ({
    id: `merch-${index + 1}` as PromoCatalogPageId,
    number: 6 + index,
    section: 'merch' as const,
    productIds,
  })),
  ...CALENDAR_PAGE_GROUPS.map((productIds, index) => ({
    id: `calendars-${index + 1}` as PromoCatalogPageId,
    number: 6 + MERCH_PAGE_GROUPS.length + index,
    section: 'calendars' as const,
    productIds,
  })),
  {
    id: 'back',
    number: 6 + MERCH_PAGE_GROUPS.length + CALENDAR_PAGE_GROUPS.length,
  },
];

export function getPromoCatalogProduct(id: string): PromoCatalogProduct | undefined {
  return PROMO_CATALOG_PRODUCTS.find((item) => item.id === id);
}

export function isCalendarProductId(id: string): boolean {
  return id.startsWith('cal');
}
