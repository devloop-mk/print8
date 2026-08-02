import {
  products,
  type Product,
  type ProductDesignTemplate,
  type ProductType,
} from '@/lib/data/catalog';
import { PRODUCT_OFFERING_PATHS } from '@/lib/products/paths';
import { productTypeHref } from '@/lib/products/product-nav';
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
      href: productTypeHref('t-shirt', { collection: 'family' }),
      previewDesignId: 'tee-family-newspaper-dad',
    },
    {
      id: 'streetwear',
      href: productTypeHref('t-shirt', { collection: 'streetwear' }),
      previewDesignId: 'tee-sw-streetwear-377',
    },
    {
      id: 'chemistryDrama',
      href: productTypeHref('t-shirt', { collection: 'chemistry-drama' }),
      previewDesignId: 'tee-chem-walter-heisenberg',
    },
    {
      id: 'stranger80s',
      href: productTypeHref('t-shirt', { collection: 'stranger-80s' }),
      previewDesignId: 'tee-str80-demogorgon',
    },
    {
      id: 'zombieSurvival',
      href: productTypeHref('t-shirt', { collection: 'zombie-survival' }),
      previewDesignId: 'tee-zombie-zombie-horde',
    },
    {
      id: 'cartelCrime',
      href: productTypeHref('t-shirt', { collection: 'cartel-crime' }),
      previewDesignId: 'tee-cartel-kingpin-portrait',
    },
    {
      id: 'mkSlang',
      href: productTypeHref('t-shirt', { collection: 'mk-slang' }),
      previewDesignId: 'tee-mk-mangupka',
    },
    {
      id: 'mkRetroPlates',
      href: productTypeHref('t-shirt', { collection: 'mk-retro-plates' }),
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
      href: productTypeHref('hoodie', { collection: 'family' }),
      previewDesignId: 'tee-family-newspaper-mom',
    },
    {
      id: 'streetwear',
      href: productTypeHref('hoodie', { collection: 'streetwear' }),
      previewDesignId: 'tee-sw-streetwear-411',
    },
    {
      id: 'trendingMk',
      href: productTypeHref('hoodie', { collection: 'trending-mk' }),
      previewDesignId: 'tee-trend-skopje-1963',
    },
    {
      id: 'chemistryDrama',
      href: productTypeHref('hoodie', { collection: 'chemistry-drama' }),
      previewDesignId: 'tee-chem-walter-heisenberg',
    },
  ],
  bodysuit: [
    {
      id: 'babyMilestones',
      href: productTypeHref('bodysuit', { collection: 'baby-milestones' }),
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
