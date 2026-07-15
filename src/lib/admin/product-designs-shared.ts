import {
  products,
  productTypes,
  type Product,
  type ProductDesignCategory,
  type ProductDesignKind,
  type ProductDesignTemplate,
  type ProductSide,
  type ProductType,
} from '@/lib/data/catalog';
import type { ManagedProductDesignRecord } from '@/lib/db/managed-product-designs';

import type { DesignSideMode } from '@/lib/products/design-sides';

export const PRODUCT_DESIGN_KIND_OPTIONS: ProductDesignKind[] = [
  'image',
  'overlay',
  'text',
];

export const PRODUCT_DESIGN_CATEGORY_OPTIONS: ProductDesignCategory[] = [
  'image-designs',
  'text-designs',
];

export const PRODUCT_SIDE_OPTIONS: ProductSide[] = [
  'front',
  'back',
  'left',
  'right',
];

export const DESIGN_SIDE_MODE_OPTIONS: { value: DesignSideMode; label: string }[] = [
  { value: 'front', label: 'Front only' },
  { value: 'back', label: 'Back only' },
  { value: 'both', label: 'Front & back' },
];

export const ADMIN_PRODUCT_DESIGNS_PAGE_SIZE = 50;

export type AdminProductDesignStorage = 'all' | 'database' | 'code-only';

export type AdminProductDesignListItem = {
  id: string;
  title: string;
  kind: ProductDesignKind;
  category: ProductDesignCategory;
  productTypes: ProductType[];
  collection?: string;
  active: boolean;
  /** Row exists in managed_product_designs */
  inDatabase: boolean;
  /** Original still lives in catalog.ts */
  isStatic: boolean;
  sortOrder: number;
  applicableColorCount: number;
  variantColorCount: number;
};

export type AdminProductDesignListPage = {
  items: AdminProductDesignListItem[];
  total: number;
  page: number;
  pageSize: number;
  inDatabaseCount: number;
  codeOnlyCount: number;
};

export type ResolvedAdminProductDesign = {
  id: string;
  template: ProductDesignTemplate;
  staticTemplate: ProductDesignTemplate | null;
  managed: ManagedProductDesignRecord | null;
  active: boolean;
  sortOrder: number;
};

export function matchesAdminProductDesignSearch(
  item: Pick<
    AdminProductDesignListItem,
    'id' | 'title' | 'kind' | 'category' | 'productTypes' | 'collection'
  >,
  search: string,
) {
  const query = search.trim().toLowerCase();
  if (!query) return true;

  return [item.id, item.title, item.kind, item.category, item.collection, ...item.productTypes]
    .join(' ')
    .toLowerCase()
    .includes(query);
}

export function getLinkedProducts(template: ProductDesignTemplate): Product[] {
  return products.filter(
    (product) =>
      template.productTypes.includes(product.type) &&
      (!template.productIds?.length ||
        template.productIds.includes(product.id)),
  );
}

import { TSHIRT_UNISEX_COLORS } from '@/lib/products/tshirt-unisex-colors';
import { TSHIRT_WOMEN_COLORS } from '@/lib/products/tshirt-women-colors';
import { TSHIRT_KIDS_COLORS } from '@/lib/products/tshirt-kids-colors';
import { normalizeHex } from '@/lib/products/design-overlay';
import { getDesignApplicableFits } from '@/lib/products/garment-fit';

export type AdminDesignColorOption = {
  hex: string;
  productIds: string[];
};

/** Exactly the 9 supplier unisex tee colors — never hoodie/legacy hex values. */
export function getAdminUnisexTshirtColorOptions(
  productId = 'tshirt-basic-white',
): AdminDesignColorOption[] {
  return TSHIRT_UNISEX_COLORS.map((color) => ({
    hex: color.hex,
    productIds: [productId],
  }));
}

/** Exactly the 2 supplier women's fitted tee colors. */
export function getAdminWomenTshirtColorOptions(
  productId = 'tshirt-women-fitted',
): AdminDesignColorOption[] {
  return TSHIRT_WOMEN_COLORS.map((color) => ({
    hex: color.hex,
    productIds: [productId],
  }));
}

/** Exactly the 3 supplier kids tee colors. */
export function getAdminKidsTshirtColorOptions(
  productId = 'tshirt-kids',
): AdminDesignColorOption[] {
  return TSHIRT_KIDS_COLORS.map((color) => ({
    hex: color.hex,
    productIds: [productId],
  }));
}

export function getAdminDesignColorOptions(
  template: ProductDesignTemplate,
): AdminDesignColorOption[] {
  if (template.productTypes.includes('t-shirt')) {
    const fits = getDesignApplicableFits(template);

    if (fits.includes('unisex')) {
      return getAdminUnisexTshirtColorOptions('tshirt-basic-white');
    }
    if (fits.includes('kids')) {
      return getAdminKidsTshirtColorOptions('tshirt-kids');
    }
    if (fits.includes('women')) {
      return getAdminWomenTshirtColorOptions('tshirt-women-fitted');
    }

    return getAdminUnisexTshirtColorOptions('tshirt-basic-white');
  }

  return getDesignColorOptions(template);
}

export function getDesignColorOptions(template: ProductDesignTemplate) {
  const linkedProducts = getLinkedProducts(template);
  const colors = new Map<string, AdminDesignColorOption>();

  for (const product of linkedProducts) {
    for (const color of product.colors ?? []) {
      const key = normalizeHex(color);
      const existing = colors.get(key);
      if (existing) {
        existing.productIds.push(product.id);
      } else {
        colors.set(key, { hex: color, productIds: [product.id] });
      }
    }
  }

  return [...colors.values()].sort((a, b) =>
    normalizeHex(a.hex).localeCompare(normalizeHex(b.hex)),
  );
}

export const PRODUCT_TYPE_LABELS_MK: Record<ProductType, string> = {
  't-shirt': 'Маица',
  hoodie: 'Дуксер',
  bodysuit: 'Боди',
  cap: 'Капа',
  mug: 'Шолја',
  cup: 'Чашка',
  bag: 'Торба',
  thermos: 'Термос',
  magnet: 'Магнет',
  'gift-set': 'Поклон сет',
};

export function createEmptyProductDesignTemplate(
  id: string,
): ProductDesignTemplate {
  return {
    id,
    kind: 'overlay',
    category: 'image-designs',
    productTypes: ['t-shirt'],
    nameKey: id,
    titleEn: id,
    titleMk: id,
    defaultSide: 'front',
    overlayScale: 50,
    overlayPosition: { x: 50, y: 54 },
    recommendedColor: '#000000',
    applicableColors: [],
    applicableFits: ['unisex'],
  };
}

export { productTypes };
