import type { ProductSide } from '@/lib/data/catalog';
import { getProductSides, type Product } from '@/lib/data/catalog';
import { getProductById } from '@/lib/cart/product-cart';
import { buildUploadedFileUrl } from '@/lib/upload/file-url';
import type { UploadedFile } from '@/lib/products/design-state';
import {
  BRANDING_PACK_DEFAULT_COLOR,
  BRANDING_PACK_DEFAULT_LOGO_PLACEMENT,
  BRANDING_PACK_DEFAULT_PRODUCT_ID,
  BRANDING_PACK_PRODUCT_TYPES,
  type BrandingPackLogoPlacement,
  type BrandingPackProductType,
} from '@/lib/products/branding-pack-config';
import {
  getTshirtUnitPrice,
  isTshirtProduct,
} from '@/lib/products/tshirt-print-pricing';

export const BRANDING_PACK_STATE_VERSION = 1;

export type BrandingPackColorSelection = {
  color: string;
  quantity: number;
};

export type BrandingPackSizeSelection = {
  size: string;
  quantity: number;
};

export type BrandingPackPreviewImage = {
  productType: BrandingPackProductType;
  side: ProductSide;
  color: string;
  dataUrl: string;
};

export type BrandingPackProductState = {
  productType: BrandingPackProductType;
  productId: string;
  enabled: boolean;
  /** @deprecated Use sizeSelections */
  size?: string;
  sizeSelections: BrandingPackSizeSelection[];
  previewColor: string;
  printSides: ProductSide[];
  sidePlacements: Partial<Record<ProductSide, BrandingPackLogoPlacement>>;
  colorSelections: BrandingPackColorSelection[];
};

export type BrandingPackState = {
  version: typeof BRANDING_PACK_STATE_VERSION;
  packId: string;
  logo: UploadedFile | null;
  products: BrandingPackProductState[];
  previewImages?: BrandingPackPreviewImage[];
};

export type BrandingPackWizardStep =
  | 'logo'
  | 'products'
  | 'customize'
  | 'review'
  | 'order';

export const BRANDING_PACK_WIZARD_STEPS: BrandingPackWizardStep[] = [
  'logo',
  'products',
  'customize',
  'review',
  'order',
];

const BACK_PLACEMENT_OFFSET: Partial<
  Record<BrandingPackProductType, BrandingPackLogoPlacement>
> = {
  't-shirt': { scale: 32, position: { x: 50, y: 52 } },
  hoodie: { scale: 28, position: { x: 50, y: 58 } },
  bag: { scale: 30, position: { x: 50, y: 52 } },
  cap: { scale: 18, position: { x: 50, y: 42 } },
};

export function createDefaultSidePlacements(
  productType: BrandingPackProductType,
): Partial<Record<ProductSide, BrandingPackLogoPlacement>> {
  const front = BRANDING_PACK_DEFAULT_LOGO_PLACEMENT[productType];
  const back = BACK_PLACEMENT_OFFSET[productType] ?? {
    scale: Math.max(front.scale - 4, 15),
    position: { x: 50, y: front.position.y + 6 },
  };
  return {
    front: { ...front, position: { ...front.position } },
    back: { ...back, position: { ...back.position } },
  };
}

function createDefaultSizeSelections(
  product: Product,
): BrandingPackSizeSelection[] {
  if (!product.sizes?.length) return [];
  return product.sizes.map((size, index) => ({
    size,
    quantity: index === 0 ? 1 : 0,
  }));
}

function migrateBrandingPackProduct(
  product: BrandingPackProductState,
): BrandingPackProductState {
  const catalog = getProductById(product.productId);
  const sizes = catalog?.sizes ?? [];

  if (!sizes.length) {
    return { ...product, sizeSelections: [] };
  }

  if (product.sizeSelections?.length) {
    const quantityBySize = new Map(
      product.sizeSelections.map((entry) => [entry.size, entry.quantity]),
    );
    return {
      ...product,
      sizeSelections: sizes.map((size) => ({
        size,
        quantity: quantityBySize.get(size) ?? 0,
      })),
    };
  }

  const totalQty = Math.max(
    product.colorSelections.reduce((sum, sel) => sum + sel.quantity, 0),
    1,
  );
  const legacySize = product.size || sizes[0];

  return {
    ...product,
    sizeSelections: sizes.map((size) => ({
      size,
      quantity: size === legacySize ? totalQty : 0,
    })),
  };
}

export function migrateBrandingPackState(
  state: BrandingPackState,
): BrandingPackState {
  return {
    ...state,
    products: state.products.map(migrateBrandingPackProduct),
  };
}

function createDefaultColorSelections(
  product: Product,
  defaultColor: string,
): BrandingPackColorSelection[] {
  return (product.colors ?? [defaultColor]).map((color) => ({
    color,
    quantity: color === defaultColor ? 1 : 0,
  }));
}

export function createDefaultBrandingPackState(
  packId: string,
): BrandingPackState {
  return {
    version: BRANDING_PACK_STATE_VERSION,
    packId,
    logo: null,
    products: BRANDING_PACK_PRODUCT_TYPES.map((productType) => {
      const productId = BRANDING_PACK_DEFAULT_PRODUCT_ID[productType];
      const product = getProductById(productId);
      const defaultColor = BRANDING_PACK_DEFAULT_COLOR[productType];

      return {
        productType,
        productId,
        enabled: true,
        sizeSelections: product
          ? createDefaultSizeSelections(product)
          : [],
        previewColor: defaultColor,
        printSides: ['front'],
        sidePlacements: createDefaultSidePlacements(productType),
        colorSelections: product
          ? createDefaultColorSelections(product, defaultColor)
          : [{ color: defaultColor, quantity: 1 }],
      };
    }),
  };
}

export function getBrandingPackProduct(
  state: BrandingPackState,
  productType: BrandingPackProductType,
): BrandingPackProductState | undefined {
  return state.products.find((p) => p.productType === productType);
}

export function getSelectedBrandingPackProducts(
  state: BrandingPackState,
): BrandingPackProductState[] {
  return state.products.filter(
    (p) => p.enabled && getProductColorQuantity(p) > 0,
  );
}

export function getProductColorQuantity(product: BrandingPackProductState): number {
  return product.colorSelections.reduce((sum, sel) => sum + sel.quantity, 0);
}

export function getProductSizeQuantity(product: BrandingPackProductState): number {
  return product.sizeSelections.reduce((sum, sel) => sum + sel.quantity, 0);
}

export function getMaxSizeQuantityForEntry(
  product: BrandingPackProductState,
  size: string,
): number {
  const colorTotal = getProductColorQuantity(product);
  const otherSizeTotal = product.sizeSelections
    .filter((entry) => entry.size !== size)
    .reduce((sum, entry) => sum + entry.quantity, 0);
  return Math.max(0, colorTotal - otherSizeTotal);
}

export function clampSizeSelectionsToColorTotal(
  product: BrandingPackProductState,
): BrandingPackProductState {
  const colorTotal = getProductColorQuantity(product);
  let remaining = colorTotal;
  const sizeSelections = product.sizeSelections.map((entry) => {
    const quantity = Math.min(entry.quantity, remaining);
    remaining -= quantity;
    return { ...entry, quantity };
  });

  return { ...product, sizeSelections };
}

export function formatBrandingPackSizeBreakdown(
  product: BrandingPackProductState,
): string {
  return product.sizeSelections
    .filter((entry) => entry.quantity > 0)
    .map((entry) => `${entry.size}: ${entry.quantity}`)
    .join(', ');
}

export function getBrandingPackLineItems(state: BrandingPackState): Array<{
  product: BrandingPackProductState;
  color: string;
  quantity: number;
}> {
  const lines: Array<{
    product: BrandingPackProductState;
    color: string;
    quantity: number;
  }> = [];

  for (const product of getSelectedBrandingPackProducts(state)) {
    for (const selection of product.colorSelections) {
      if (selection.quantity > 0) {
        lines.push({
          product,
          color: selection.color,
          quantity: selection.quantity,
        });
      }
    }
  }

  return lines;
}

export function calculateBrandingPackTotal(state: BrandingPackState): number {
  return getBrandingPackLineItems(state).reduce((sum, line) => {
    return sum + resolveBrandingPackUnitPrice(line.product) * line.quantity;
  }, 0);
}

/**
 * Server-trusted unit price: productId must match the allowlisted default for
 * that product type (blocks swapping in a cheaper catalog item).
 * T-shirts use print-package pricing from selected print sides.
 */
export function resolveBrandingPackUnitPrice(
  product: BrandingPackProductState,
): number {
  const allowedId = BRANDING_PACK_DEFAULT_PRODUCT_ID[product.productType];
  if (!allowedId) return 0;

  const catalogProduct = getProductById(allowedId);
  if (!catalogProduct || catalogProduct.type !== product.productType) {
    return 0;
  }

  if (isTshirtProduct(catalogProduct)) {
    const sideCount = product.printSides?.filter(Boolean).length ?? 1;
    const pkg = sideCount >= 2 ? 'front-back' : 'front-large';
    return getTshirtUnitPrice(pkg);
  }

  return catalogProduct.basePrice;
}

export function sanitizeBrandingPackProductIds(
  state: BrandingPackState,
): BrandingPackState {
  return {
    ...state,
    products: state.products.map((product) => {
      const allowedId = BRANDING_PACK_DEFAULT_PRODUCT_ID[product.productType];
      if (!allowedId || product.productId === allowedId) return product;
      return { ...product, productId: allowedId };
    }),
  };
}

export function productHasMultipleSides(productId: string): boolean {
  const product = getProductById(productId);
  if (!product) return false;
  return getProductSides(product).length > 1;
}

export function getAvailablePrintSides(productId: string): ProductSide[] {
  const product = getProductById(productId);
  if (!product) return ['front'];
  return getProductSides(product);
}

export function serializeBrandingPackState(state: BrandingPackState): string {
  return JSON.stringify(state);
}

export function hydrateBrandingPackLogo(
  state: BrandingPackState,
  uploadToken?: string | null,
): BrandingPackState {
  const migrated = migrateBrandingPackState(state);

  if (!migrated.logo?.fileId) return migrated;
  if (migrated.logo.previewUrl) return migrated;

  return {
    ...migrated,
    logo: {
      ...migrated.logo,
      previewUrl: buildUploadedFileUrl(migrated.logo.fileId, uploadToken),
    },
  };
}

export function normalizeBrandingPackStateForStorage(
  state: BrandingPackState,
): BrandingPackState {
  const hydrated = hydrateBrandingPackLogo(state);
  return {
    ...hydrated,
    previewImages: undefined,
    logo: hydrated.logo
      ? {
          fileId: hydrated.logo.fileId,
          name: hydrated.logo.name,
          isImage: hydrated.logo.isImage,
          previewUrl: hydrated.logo.previewUrl,
        }
      : null,
  };
}

export function parseBrandingPackState(
  raw: string | undefined,
): BrandingPackState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as BrandingPackState;
    if (parsed.version !== BRANDING_PACK_STATE_VERSION) return null;
    if (!parsed.packId || !Array.isArray(parsed.products)) return null;
    return sanitizeBrandingPackProductIds(migrateBrandingPackState(parsed));
  } catch {
    return null;
  }
}

export function isBrandingPackCartItem(item: {
  metadata?: Record<string, string | number | boolean>;
}): boolean {
  return Boolean(item.metadata?.isBrandingPack);
}
