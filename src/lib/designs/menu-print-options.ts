import type { CartItem } from '@/lib/cart/types';

/**
 * Restaurant menu print MVP — one SKU: A5 (148x210 mm), wire-o spiral bound.
 * A4 and stapled/stitched binding are intentionally out of scope for now.
 */
export const MENU_PRINT_SIZE = 'a5';
export const MENU_PRINT_SIZE_MM = '148 × 210';
export const MENU_PRINT_BINDING = 'spiral';

export const MENU_MIN_PAGES = 4;
export const MENU_MAX_PAGES = 200;
export const MENU_MIN_QUANTITY = 1;
export const MENU_MAX_QUANTITY = 999;

/** Base page count included in the unit price before signature add-ons. */
export const MENU_BASE_PAGES = 8;
export const MENU_PAGE_SIGNATURE_SIZE = 4;
export const MENU_PAGE_ADD_PER_SIGNATURE = 12;

export const MENU_PAPER_OPTIONS = ['240gsm', '300gsm'] as const;
export type MenuPaper = (typeof MENU_PAPER_OPTIONS)[number];

export const MENU_LAMINATION_OPTIONS = ['none', 'matte', 'glossy'] as const;
export type MenuLamination = (typeof MENU_LAMINATION_OPTIONS)[number];

export const MENU_PRINT_ORDER_TYPE = 'menu-print';

export interface MenuPrintOptions {
  pages: number;
  paper: MenuPaper;
  lamination: MenuLamination;
  quantity: number;
}

export const DEFAULT_MENU_PRINT_OPTIONS: MenuPrintOptions = {
  pages: 8,
  paper: '300gsm',
  lamination: 'none',
  quantity: 20,
};

/**
 * Price table in MKD, calibrated against the local market floor for A5 spiral
 * menus (coated 240/300 gsm, spiral ~15 MKD/pc, lamination ~10 MKD/pc).
 *
 * Shape: unitBase(quantity, paper) + pageAdd(pages) + spiral + lamination,
 * multiplied by the tirage, plus the one-off design fee for the template path.
 */
const MENU_UNIT_BASE_TIERS: Array<{ quantity: number; unitBase: number }> = [
  { quantity: 10, unitBase: 50 },
  { quantity: 20, unitBase: 46 },
  { quantity: 30, unitBase: 43 },
  { quantity: 50, unitBase: 40 },
];

/** 300 gsm is the baseline; 240 gsm is slightly cheaper. */
const MENU_PAPER_MULTIPLIER: Record<MenuPaper, number> = {
  '240gsm': 0.92,
  '300gsm': 1,
};

export const MENU_SPIRAL_FEE_PER_PIECE = 15;
export const MENU_LAMINATION_FEE_PER_PIECE = 10;

export function isMenuPaper(value: unknown): value is MenuPaper {
  return (
    typeof value === 'string' &&
    (MENU_PAPER_OPTIONS as readonly string[]).includes(value)
  );
}

/** Maps legacy cart metadata to current paper options. */
export function normalizeMenuPaper(value: unknown): MenuPaper {
  if (value === 'coated-300gsm' || value === 'waterproof') return '300gsm';
  if (isMenuPaper(value)) return value;
  return DEFAULT_MENU_PRINT_OPTIONS.paper;
}

export function isMenuLamination(value: unknown): value is MenuLamination {
  return (
    typeof value === 'string' &&
    (MENU_LAMINATION_OPTIONS as readonly string[]).includes(value)
  );
}

export function clampMenuPages(value: number): number {
  return Math.min(
    MENU_MAX_PAGES,
    Math.max(MENU_MIN_PAGES, Math.round(value)),
  );
}

export function clampMenuQuantity(value: number): number {
  return Math.min(
    MENU_MAX_QUANTITY,
    Math.max(MENU_MIN_QUANTITY, Math.round(value)),
  );
}

/**
 * Stepped add-on: 8 pages is the base SKU and every extra 4-page signature
 * adds 12 MKD/pc (~3 MKD per printed page).
 */
export function getMenuPageAdd(pages: number): number {
  const normalized = clampMenuPages(pages);
  if (normalized <= MENU_BASE_PAGES) return 0;
  const extraSignatures = Math.ceil(
    (normalized - MENU_BASE_PAGES) / MENU_PAGE_SIGNATURE_SIZE,
  );
  return extraSignatures * MENU_PAGE_ADD_PER_SIGNATURE;
}

function interpolateUnitBase(quantity: number): number {
  const q = clampMenuQuantity(quantity);
  const first = MENU_UNIT_BASE_TIERS[0];
  const last = MENU_UNIT_BASE_TIERS[MENU_UNIT_BASE_TIERS.length - 1];

  if (q <= first.quantity) return first.unitBase;
  if (q >= last.quantity) return last.unitBase;

  for (let i = 0; i < MENU_UNIT_BASE_TIERS.length - 1; i += 1) {
    const low = MENU_UNIT_BASE_TIERS[i];
    const high = MENU_UNIT_BASE_TIERS[i + 1];
    if (q <= high.quantity) {
      const ratio = (q - low.quantity) / (high.quantity - low.quantity);
      return Math.round(low.unitBase + (high.unitBase - low.unitBase) * ratio);
    }
  }

  return last.unitBase;
}

/** Coated menu stock supports lamination on both weights. */
export function supportsMenuLamination(_paper: MenuPaper): boolean {
  return true;
}

export function resolveMenuLamination(options: {
  paper: MenuPaper;
  lamination: MenuLamination;
}): MenuLamination {
  return supportsMenuLamination(options.paper) ? options.lamination : 'none';
}

export interface MenuPrintPriceBreakdown {
  quantity: number;
  unitBase: number;
  pageAdd: number;
  spiralFee: number;
  laminationFee: number;
  /** Per-piece print price, everything except the design fee. */
  unitTotal: number;
  printTotal: number;
  designFee: number;
  total: number;
}

export function calculateMenuPrintPrice(
  options: MenuPrintOptions,
  designFee = 0,
): MenuPrintPriceBreakdown {
  const pages = clampMenuPages(options.pages);
  const quantity = clampMenuQuantity(options.quantity);
  const lamination = resolveMenuLamination(options);
  const unitBase = Math.round(
    interpolateUnitBase(quantity) * MENU_PAPER_MULTIPLIER[options.paper],
  );
  const pageAdd = getMenuPageAdd(pages);
  const spiralFee = MENU_SPIRAL_FEE_PER_PIECE;
  const laminationFee =
    lamination === 'none' ? 0 : MENU_LAMINATION_FEE_PER_PIECE;

  const unitTotal = unitBase + pageAdd + spiralFee + laminationFee;
  const printTotal = unitTotal * quantity;

  return {
    quantity,
    unitBase,
    pageAdd,
    spiralFee,
    laminationFee,
    unitTotal,
    printTotal,
    designFee,
    total: printTotal + designFee,
  };
}

export function menuPrintMetadata(
  options: MenuPrintOptions,
  breakdown?: MenuPrintPriceBreakdown,
): Record<string, string | number> {
  const lamination = resolveMenuLamination(options);
  const price = breakdown ?? calculateMenuPrintPrice(options);
  const pages = clampMenuPages(options.pages);
  const quantity = clampMenuQuantity(options.quantity);

  return {
    menuSize: MENU_PRINT_SIZE,
    menuBinding: MENU_PRINT_BINDING,
    menuPages: pages,
    menuPaper: options.paper,
    menuLamination: lamination,
    menuQuantity: quantity,
    menuUnitPrice: price.unitTotal,
    menuPrintTotal: price.printTotal,
    menuDesignFee: price.designFee,
  };
}

export function parseMenuPrintOptions(
  metadata?: CartItem['metadata'],
): MenuPrintOptions {
  const paper = normalizeMenuPaper(metadata?.menuPaper);
  const lamination = isMenuLamination(metadata?.menuLamination)
    ? metadata.menuLamination
    : DEFAULT_MENU_PRINT_OPTIONS.lamination;

  const pages =
    typeof metadata?.menuPages === 'number' && Number.isFinite(metadata.menuPages)
      ? clampMenuPages(metadata.menuPages)
      : DEFAULT_MENU_PRINT_OPTIONS.pages;

  const quantity =
    typeof metadata?.menuQuantity === 'number' &&
    Number.isFinite(metadata.menuQuantity)
      ? clampMenuQuantity(metadata.menuQuantity)
      : DEFAULT_MENU_PRINT_OPTIONS.quantity;

  return {
    pages,
    paper,
    lamination: resolveMenuLamination({ paper, lamination }),
    quantity,
  };
}

/**
 * True when the metadata carries a configured print job (as opposed to a plain
 * menu design order, which is priced at the design fee alone).
 */
export function hasMenuPrintOptions(metadata?: CartItem['metadata']): boolean {
  return (
    typeof metadata?.menuQuantity === 'number' &&
    Number.isFinite(metadata.menuQuantity)
  );
}

export function isMenuPrintCartItem(item: CartItem): boolean {
  return (
    item.type === 'design' &&
    item.metadata?.category === 'menus' &&
    hasMenuPrintOptions(item.metadata)
  );
}
