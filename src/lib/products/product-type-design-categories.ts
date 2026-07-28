import {
  products,
  type Product,
  type ProductDesignTemplate,
  type ProductType,
} from '@/lib/data/catalog';
import { PRODUCT_OFFERING_PATHS } from '@/lib/products/paths';
import { resolveDesignPreviewColor } from '@/lib/products/design-applicable-colors';
import { resolveDesignProduct } from '@/lib/products/garment-fit';
import { resolveStaticProductDesignTemplate } from '@/lib/products/resolve-product-design-template';

export type ProductTypeDesignCategoryId =
  | 'kidsTee'
  | 'kidsBirthday'
  | 'couples'
  | 'family'
  | 'streetwear'
  | 'trendingMk'
  | 'chemistryDrama'
  | 'stranger80s'
  | 'zombieSurvival'
  | 'cartelCrime'
  | 'dailyGrind'
  | 'mkSlang'
  | 'mkRetroPlates'
  | 'babyMilestones';

export type ProductTypeDesignCategory = {
  id: ProductTypeDesignCategoryId;
  href: string;
  /** Representative catalog design (or couple partner design) for garment mockup. */
  previewDesignId: string;
};

/**
 * Themed catalog entry points shown on product type pages.
 * Only real routes/collections that already exist in the catalog.
 */
const TYPE_DESIGN_CATEGORIES: Partial<
  Record<ProductType, readonly ProductTypeDesignCategory[]>
> = {
  't-shirt': [
    {
      id: 'kidsTee',
      href: PRODUCT_OFFERING_PATHS.kidsReadyDesigns,
      previewDesignId: 'tee-kids-gen-dino-party',
    },
    {
      id: 'kidsBirthday',
      href: PRODUCT_OFFERING_PATHS.kidsReadyDesigns,
      previewDesignId: 'tee-kids-rodendensko-dete',
    },
    {
      id: 'couples',
      href: PRODUCT_OFFERING_PATHS.couplesReadyDesigns,
      previewDesignId: 'couple-king-queen-king',
    },
    {
      id: 'family',
      href: `${PRODUCT_OFFERING_PATHS.readyDesigns}?collection=family&type=t-shirt`,
      previewDesignId: 'tee-family-newspaper-dad',
    },
    {
      id: 'streetwear',
      href: `${PRODUCT_OFFERING_PATHS.readyDesigns}?collection=streetwear&type=t-shirt`,
      previewDesignId: 'tee-sw-streetwear-377',
    },
    {
      id: 'chemistryDrama',
      href: `${PRODUCT_OFFERING_PATHS.readyDesigns}?collection=chemistry-drama&type=t-shirt`,
      previewDesignId: 'tee-chem-walter-heisenberg',
    },
    {
      id: 'stranger80s',
      href: `${PRODUCT_OFFERING_PATHS.readyDesigns}?collection=stranger-80s&type=t-shirt`,
      previewDesignId: 'tee-str80-demogorgon',
    },
    {
      id: 'zombieSurvival',
      href: `${PRODUCT_OFFERING_PATHS.readyDesigns}?collection=zombie-survival&type=t-shirt`,
      previewDesignId: 'tee-zombie-zombie-horde',
    },
    {
      id: 'cartelCrime',
      href: `${PRODUCT_OFFERING_PATHS.readyDesigns}?collection=cartel-crime&type=t-shirt`,
      previewDesignId: 'tee-cartel-kingpin-portrait',
    },
    {
      id: 'mkSlang',
      href: `${PRODUCT_OFFERING_PATHS.readyDesigns}?collection=mk-slang&type=t-shirt`,
      previewDesignId: 'tee-mk-mangupka',
    },
    {
      id: 'mkRetroPlates',
      href: `${PRODUCT_OFFERING_PATHS.readyDesigns}?collection=mk-retro-plates&type=t-shirt`,
      previewDesignId: 'tee-retro-klasika-skopje',
    },
  ],
  hoodie: [
    {
      id: 'kidsBirthday',
      href: PRODUCT_OFFERING_PATHS.kidsReadyDesigns,
      previewDesignId: 'tee-kids-rodendensko-dete',
    },
    {
      id: 'family',
      href: `${PRODUCT_OFFERING_PATHS.readyDesigns}?collection=family&type=hoodie`,
      previewDesignId: 'tee-family-newspaper-mom',
    },
    {
      id: 'streetwear',
      href: `${PRODUCT_OFFERING_PATHS.readyDesigns}?collection=streetwear&type=hoodie`,
      previewDesignId: 'tee-sw-streetwear-411',
    },
    {
      id: 'trendingMk',
      href: `${PRODUCT_OFFERING_PATHS.readyDesigns}?collection=trending-mk&type=hoodie`,
      previewDesignId: 'tee-trend-skopje-1963',
    },
    {
      id: 'chemistryDrama',
      href: `${PRODUCT_OFFERING_PATHS.readyDesigns}?collection=chemistry-drama&type=hoodie`,
      previewDesignId: 'tee-chem-walter-heisenberg',
    },
  ],
  bodysuit: [
    {
      id: 'babyMilestones',
      href: `${PRODUCT_OFFERING_PATHS.readyDesigns}?collection=baby-milestones&type=bodysuit`,
      previewDesignId: 'baby-hello-world',
    },
    {
      id: 'kidsBirthday',
      href: PRODUCT_OFFERING_PATHS.kidsReadyDesigns,
      previewDesignId: 'tee-kids-gen-unicorn-party',
    },
  ],
};

export function getProductTypeDesignCategories(
  type: ProductType,
): readonly ProductTypeDesignCategory[] {
  return TYPE_DESIGN_CATEGORIES[type] ?? [];
}

function resolveCategoryPreviewProduct(
  design: ProductDesignTemplate,
  preferredType: ProductType,
): Product {
  const staticBase = resolveStaticProductDesignTemplate(design.id);
  const supportedTypes = new Set<ProductType>([
    ...design.productTypes,
    ...(staticBase?.productTypes ?? []),
  ]);

  // Type-page category cards must preview the page garment when the design
  // supports it — ignore productIds locks and admin productTypes narrowing.
  if (supportedTypes.has(preferredType)) {
    const pageGarment = products.find((product) => product.type === preferredType);
    if (pageGarment) {
      return pageGarment;
    }
  }

  return resolveDesignProduct(design, undefined, preferredType);
}

export type CategoryMockupPreview = {
  product: Product;
  design: ProductDesignTemplate;
  color: string;
};

/** Resolve product + design + color for a thematic category card mockup. */
export function resolveCategoryMockupPreview(
  category: ProductTypeDesignCategory,
  pageType: ProductType,
  designOverride?: ProductDesignTemplate | null,
): CategoryMockupPreview | null {
  const design =
    designOverride ??
    resolveStaticProductDesignTemplate(category.previewDesignId);
  if (!design) return null;

  const product = resolveCategoryPreviewProduct(design, pageType);
  const color = resolveDesignPreviewColor(design, product);

  return { product, design, color };
}

/**
 * Server path — merges admin overlay placement/scale into category mockups so
 * first paint matches catalog cards (no oversized static defaults).
 */
export async function resolveCategoryMockupPreviews(
  pageType: ProductType,
): Promise<Record<string, CategoryMockupPreview>> {
  const categories = getProductTypeDesignCategories(pageType);
  if (categories.length === 0) return {};

  const { resolveProductDesignTemplate } = await import(
    '@/lib/products/resolve-product-design-template'
  );

  const previews: Record<string, CategoryMockupPreview> = {};

  await Promise.all(
    categories.map(async (category) => {
      const design = await resolveProductDesignTemplate(category.previewDesignId);
      const preview = resolveCategoryMockupPreview(category, pageType, design);
      if (preview) {
        previews[category.id] = preview;
      }
    }),
  );

  return previews;
}
