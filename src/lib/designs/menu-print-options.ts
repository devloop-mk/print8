import type { CartItem } from '@/lib/cart/types';

/**
 * Restaurant menu print MVP — one SKU: A5 (148x210 mm), wire-o spiral bound.
 * A4 and stapled/stitched binding are intentionally out of scope for now.
 */
export const MENU_PRINT_SIZE = 'a5';
export const MENU_PRINT_SIZE_MM = '148 × 210';
export const MENU_PRINT_BINDING = 'spiral';

export const MENU_PAGE_COUNT_OPTIONS = [8, 12, 16, 20] as const;
export type MenuPageCount = (typeof MENU_PAGE_COUNT_OPTIONS)[number];

export const MENU_PAPER_OPTIONS = ['coated-300gsm', 'waterproof'] as const;
export type MenuPaper = (typeof MENU_PAPER_OPTIONS)[number];

export const MENU_LAMINATION_OPTIONS = ['none', 'matte', 'glossy'] as const;
export type MenuLamination = (typeof MENU_LAMINATION_OPTIONS)[number];

export const MENU_QUANTITY_OPTIONS = [10, 20, 30, 50] as const;
export type MenuQuantity = (typeof MENU_QUANTITY_OPTIONS)[number];

/** Above this tirage the price table stops being reliable — send to a quote. */
export const MENU_QUOTE_QUANTITY_THRESHOLD = 50;

export const MENU_PRINT_ORDER_TYPE = 'menu-print';

export interface MenuPrintOptions {
  pages: MenuPageCount;
  paper: MenuPaper;
  lamination: MenuLamination;
  quantity: MenuQuantity;
}

export const DEFAULT_MENU_PRINT_OPTIONS: MenuPrintOptions = {
  pages: 8,
  paper: 'coated-300gsm',
  lamination: 'none',
  quantity: 20,
};

/**
 * Price table in MKD, calibrated against the local market floor for A5 spiral
 * menus (coated stock ~50 MKD/pc at 10 pcs sliding to ~40 MKD/pc at 50 pcs,
 * waterproof stock ~2x, spiral ~15 MKD/pc, lamination ~10 MKD/pc).
 *
 * Shape: unitBase(quantity, paper) + pageAdd(pages) + spiral + lamination,
 * multiplied by the tirage, plus the one-off design fee for the template path.
 * Prices are quoted as final amounts with no separate VAT line, matching
 * business cards and student print.
 */
const MENU_UNIT_BASE_BY_QUANTITY: Record<MenuQuantity, number> = {
  10: 50,
  20: 46,
  30: 43,
  50: 40,
};

/** Synthetic waterproof stock costs roughly double coated 300 gsm. */
const MENU_PAPER_MULTIPLIER: Record<MenuPaper, number> = {
  'coated-300gsm': 1,
  waterproof: 2,
};

/**
 * Stepped add-on rather than a flat per-page rate: 8 pages is the base SKU and
 * every extra 4-page signature adds 12 MKD/pc (~3 MKD per printed page).
 */
const MENU_PAGE_ADD_BY_PAGES: Record<MenuPageCount, number> = {
  8: 0,
  12: 12,
  16: 24,
  20: 36,
};

export const MENU_SPIRAL_FEE_PER_PIECE = 15;
export const MENU_LAMINATION_FEE_PER_PIECE = 10;

export function isMenuPageCount(value: unknown): value is MenuPageCount {
  return (
    typeof value === 'number' &&
    (MENU_PAGE_COUNT_OPTIONS as readonly number[]).includes(value)
  );
}

export function isMenuPaper(value: unknown): value is MenuPaper {
  return (
    typeof value === 'string' &&
    (MENU_PAPER_OPTIONS as readonly string[]).includes(value)
  );
}

export function isMenuLamination(value: unknown): value is MenuLamination {
  return (
    typeof value === 'string' &&
    (MENU_LAMINATION_OPTIONS as readonly string[]).includes(value)
  );
}

export function isMenuQuantity(value: unknown): value is MenuQuantity {
  return (
    typeof value === 'number' &&
    (MENU_QUANTITY_OPTIONS as readonly number[]).includes(value)
  );
}

/** Waterproof stock is already sealed, so lamination is not offered on it. */
export function supportsMenuLamination(paper: MenuPaper): boolean {
  return paper !== 'waterproof';
}

export function resolveMenuLamination(options: {
  paper: MenuPaper;
  lamination: MenuLamination;
}): MenuLamination {
  return supportsMenuLamination(options.paper) ? options.lamination : 'none';
}

export function requiresMenuQuote(quantity: number): boolean {
  return quantity > MENU_QUOTE_QUANTITY_THRESHOLD;
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
  const lamination = resolveMenuLamination(options);
  const unitBase = Math.round(
    MENU_UNIT_BASE_BY_QUANTITY[options.quantity] *
      MENU_PAPER_MULTIPLIER[options.paper],
  );
  const pageAdd = MENU_PAGE_ADD_BY_PAGES[options.pages];
  const spiralFee = MENU_SPIRAL_FEE_PER_PIECE;
  const laminationFee =
    lamination === 'none' ? 0 : MENU_LAMINATION_FEE_PER_PIECE;

  const unitTotal = unitBase + pageAdd + spiralFee + laminationFee;
  const printTotal = unitTotal * options.quantity;

  return {
    quantity: options.quantity,
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

  return {
    menuSize: MENU_PRINT_SIZE,
    menuBinding: MENU_PRINT_BINDING,
    menuPages: options.pages,
    menuPaper: options.paper,
    menuLamination: lamination,
    menuQuantity: options.quantity,
    menuUnitPrice: price.unitTotal,
    menuPrintTotal: price.printTotal,
    menuDesignFee: price.designFee,
  };
}

export function parseMenuPrintOptions(
  metadata?: CartItem['metadata'],
): MenuPrintOptions {
  const paper = isMenuPaper(metadata?.menuPaper)
    ? metadata.menuPaper
    : DEFAULT_MENU_PRINT_OPTIONS.paper;
  const lamination = isMenuLamination(metadata?.menuLamination)
    ? metadata.menuLamination
    : DEFAULT_MENU_PRINT_OPTIONS.lamination;

  return {
    pages: isMenuPageCount(metadata?.menuPages)
      ? metadata.menuPages
      : DEFAULT_MENU_PRINT_OPTIONS.pages,
    paper,
    lamination: resolveMenuLamination({ paper, lamination }),
    quantity: isMenuQuantity(metadata?.menuQuantity)
      ? metadata.menuQuantity
      : DEFAULT_MENU_PRINT_OPTIONS.quantity,
  };
}

/**
 * True when the metadata carries a configured print job (as opposed to a plain
 * menu design order, which is priced at the design fee alone).
 */
export function hasMenuPrintOptions(metadata?: CartItem['metadata']): boolean {
  return isMenuQuantity(metadata?.menuQuantity);
}

export function isMenuPrintCartItem(item: CartItem): boolean {
  return (
    item.type === 'design' &&
    item.metadata?.category === 'menus' &&
    hasMenuPrintOptions(item.metadata)
  );
}
