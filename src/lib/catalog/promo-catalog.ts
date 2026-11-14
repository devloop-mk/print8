export const PROMO_QTY_BREAKS = [1, 10, 20, 50, 100] as const;
export type PromoQtyBreak = (typeof PROMO_QTY_BREAKS)[number];

export type PromoCatalogPrices = Record<PromoQtyBreak, number>;

export type PromoCatalogProduct = {
  id: string;
  href: string;
  image: string;
  prices: PromoCatalogPrices;
  swatches?: string[];
};

export type PromoCatalogPageId =
  | 'cover'
  | 'contents'
  | 'mugs-1'
  | 'mugs-2'
  | 'mugs-3'
  | 'back';

/** Quantity breaks from the shop unit price (rounded to 10 MKD). Easy to edit. */
function qtyPrices(unit: number): PromoCatalogPrices {
  const round = (value: number) => Math.max(10, Math.round(value / 10) * 10);
  return {
    1: unit,
    10: round(unit * 0.85),
    20: round(unit * 0.78),
    50: round(unit * 0.68),
    100: round(unit * 0.58),
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
];

export const PROMO_CATALOG_COVER_IMAGES = [
  '/mugs/mug-b5kf-white.jpg',
  '/supplier/koni/B11T-01.jpg',
  '/supplier/koni/B2CB-01.jpg',
  '/supplier/koni/CB11T-BL.jpg',
  '/mugs/mug-heart-handle.jpg',
  '/mugs/mug-cork-lid.jpg',
] as const;

export const PROMO_CATALOG_PAGES: {
  id: PromoCatalogPageId;
  number: number;
  productIds?: string[];
}[] = [
  { id: 'cover', number: 1 },
  { id: 'contents', number: 2 },
  {
    id: 'mugs-1',
    number: 3,
    productIds: ['classic', 'inner', 'magicGlossy', 'magicMatte'],
  },
  {
    id: 'mugs-2',
    number: 4,
    productIds: ['windowBlue', 'redPatch', 'heart', 'cork'],
  },
  {
    id: 'mugs-3',
    number: 5,
    productIds: ['frosted', 'football', 'roseSparkle', 'redSparkle'],
  },
  { id: 'back', number: 6 },
];

export function getPromoCatalogProduct(id: string): PromoCatalogProduct | undefined {
  return PROMO_CATALOG_PRODUCTS.find((item) => item.id === id);
}
