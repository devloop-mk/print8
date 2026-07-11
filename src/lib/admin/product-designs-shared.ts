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

export const ADMIN_PRODUCT_DESIGNS_PAGE_SIZE = 50;

export type AdminProductDesignStorage = 'all' | 'database' | 'code-only';

export type AdminProductDesignListItem = {
  id: string;
  title: string;
  kind: ProductDesignKind;
  category: ProductDesignCategory;
  productTypes: ProductType[];
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
    'id' | 'title' | 'kind' | 'category' | 'productTypes'
  >,
  search: string,
) {
  const query = search.trim().toLowerCase();
  if (!query) return true;

  return [item.id, item.title, item.kind, item.category, ...item.productTypes]
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

export function getDesignColorOptions(template: ProductDesignTemplate) {
  const linkedProducts = getLinkedProducts(template);
  const colors = new Map<string, { hex: string; productIds: string[] }>();

  for (const product of linkedProducts) {
    for (const color of product.colors ?? []) {
      const existing = colors.get(color);
      if (existing) {
        existing.productIds.push(product.id);
      } else {
        colors.set(color, { hex: color, productIds: [product.id] });
      }
    }
  }

  return [...colors.values()].sort((a, b) => a.hex.localeCompare(b.hex));
}

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
    overlayPosition: { x: 50, y: 44 },
    recommendedColor: '#000000',
    applicableColors: [],
  };
}

export { productTypes };
