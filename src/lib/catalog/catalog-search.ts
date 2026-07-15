import {
  designCategories,
  designTemplates,
  getDesignHref,
  productDesignTemplates,
  products,
  type DesignCategory,
  type DesignTemplate,
  type Product,
  type ProductDesignTemplate,
} from '@/lib/data/catalog';
import { matchesCatalogSearch } from '@/lib/catalog/search-match';
import {
  DESIGN_CATEGORY_KEYWORDS,
  PRODUCT_TYPE_KEYWORDS,
  keywordsForDesignTags,
} from '@/lib/catalog/catalog-search-tags';
import {
  getAvailableDesignSubfilters,
  type DesignSubfilterId,
} from '@/lib/designs/design-filters';
import { productBelongsToCategory, productNavCategories } from '@/lib/products/product-nav';
import { resolveDesignPreviewColor } from '@/lib/products/design-applicable-colors';
import { getProductDesignThumbnail } from '@/lib/products/design-overlay';
import { resolveAssetUrl } from '@/lib/storage/asset-url';
import { buildCustomizerUrl } from '@/lib/products/paths';
import type { ProductDesignCatalogEntry } from '@/lib/products/design-catalog';

/** Initial matches shown before "See more" on search UIs. */
export const SEARCH_RESULTS_PREVIEW_LIMIT = 20;

export type CatalogSearchLabels = {
  designName: (id: string) => string;
  designCategory: (category: DesignTemplate['category']) => string;
  designSubfilter: (category: DesignTemplate['category'], id: DesignSubfilterId) => string;
  browseAllDesigns: (category: DesignCategory) => string;
  browseDesignSubfilter: (category: DesignCategory, subfilterId: DesignSubfilterId) => string;
  productName: (product: Product) => string;
  productType: (type: Product['type']) => string;
  productTypePlural: (type: Product['type']) => string;
  productNavCategory: (id: (typeof productNavCategories)[number]['id']) => string;
  productDesignName: (design: ProductDesignTemplate) => string;
};

export type SearchableDesign = DesignTemplate & {
  displayName?: string;
};

export function buildDesignSearchText(
  design: DesignTemplate,
  labels: CatalogSearchLabels,
  displayName?: string,
): string {
  const subfilters = getAvailableDesignSubfilters(design.category).filter((item) =>
    (item.tags ?? []).some((tag) => design.tags.includes(tag)),
  );

  return [
    design.id,
    design.category,
    design.kind,
    design.svgTemplateId,
    design.layoutId,
    labels.designName(design.id),
    displayName,
    labels.designCategory(design.category),
    ...design.tags,
    ...keywordsForDesignTags(design.tags),
    ...DESIGN_CATEGORY_KEYWORDS[design.category],
    ...subfilters.map((item) => labels.designSubfilter(design.category, item.id)),
  ]
    .filter(Boolean)
    .join(' ');
}

export function buildProductSearchText(
  product: Product,
  labels: CatalogSearchLabels,
): string {
  const categoryLabels = productNavCategories
    .filter((category) => productBelongsToCategory(product, category.id))
    .map((category) => labels.productNavCategory(category.id));

  return [
    product.id,
    product.type,
    labels.productName(product),
    labels.productType(product.type),
    labels.productTypePlural(product.type),
    ...categoryLabels,
    ...(PRODUCT_TYPE_KEYWORDS[product.type] ?? []),
  ]
    .filter(Boolean)
    .join(' ');
}

export function buildProductDesignSearchText(
  entry: ProductDesignCatalogEntry,
  labels: CatalogSearchLabels,
): string {
  const productTexts = entry.products.map((product) =>
    buildProductSearchText(product, labels),
  );

  return [
    entry.design.id,
    entry.design.kind,
    entry.design.category,
    labels.productDesignName(entry.design),
    entry.design.collection,
    entry.design.titleEn,
    entry.design.titleMk,
    ...entry.design.productTypes,
    ...productTexts,
  ]
    .filter(Boolean)
    .join(' ');
}

export function filterDesignsBySearchQuery(
  designs: DesignTemplate[],
  query: string,
  labels: CatalogSearchLabels,
): DesignTemplate[] {
  const trimmed = query.trim();
  if (!trimmed) return designs;
  return designs.filter((design) =>
    matchesCatalogSearch(buildDesignSearchText(design, labels), trimmed),
  );
}

export function filterProductsBySearchQuery(
  items: Product[],
  query: string,
  labels: CatalogSearchLabels,
): Product[] {
  const trimmed = query.trim();
  if (!trimmed) return items;
  return items.filter((product) =>
    matchesCatalogSearch(buildProductSearchText(product, labels), trimmed),
  );
}

export function filterProductDesignEntriesBySearchQuery(
  entries: ProductDesignCatalogEntry[],
  query: string,
  labels: CatalogSearchLabels,
): ProductDesignCatalogEntry[] {
  const trimmed = query.trim();
  if (!trimmed) return entries;
  return entries.filter((entry) =>
    matchesCatalogSearch(buildProductDesignSearchText(entry, labels), trimmed),
  );
}

export type GlobalSearchResult = {
  id: string;
  kind: 'collection' | 'design' | 'product' | 'product-design';
  href: string;
  title: string;
  subtitle: string;
  searchText: string;
  designCategory?: DesignCategory;
  designKind?: DesignTemplate['kind'];
  svgTemplateId?: string;
  layoutId?: string;
  collectionScope?: 'category' | 'subfilter';
  subfilterId?: DesignSubfilterId;
  image?: string;
  productId?: string;
  premadeDesignId?: string;
  productType?: Product['type'];
  productDesignCategory?: ProductDesignTemplate['category'];
};

type CatalogSearchIndex = {
  collections: GlobalSearchResult[];
  items: GlobalSearchResult[];
};

type CachedSearchIndex = {
  labels: CatalogSearchLabels;
  extraDesigns: SearchableDesign[];
  index: CatalogSearchIndex;
} | null;

let cachedSearchIndex: CachedSearchIndex = null;

function designsCacheKey(extraDesigns: SearchableDesign[]) {
  return extraDesigns.map((design) => design.id).join('|');
}

function buildDesignCategoryCollectionSearchText(
  category: DesignCategory,
  labels: CatalogSearchLabels,
): string {
  const subfilters = getAvailableDesignSubfilters(category);

  return [
    category,
    labels.designCategory(category),
    labels.browseAllDesigns(category),
    ...DESIGN_CATEGORY_KEYWORDS[category],
    ...subfilters.flatMap((item) => [
      item.id,
      labels.designSubfilter(category, item.id),
      labels.browseDesignSubfilter(category, item.id),
      ...(item.tags ?? []).flatMap((tag) => keywordsForDesignTags([tag])),
    ]),
  ]
    .filter(Boolean)
    .join(' ');
}

function buildDesignSubfilterCollectionSearchText(
  category: DesignCategory,
  subfilterId: DesignSubfilterId,
  labels: CatalogSearchLabels,
): string {
  const def = getAvailableDesignSubfilters(category).find((item) => item.id === subfilterId);
  const tagKeywords = def?.tags ? keywordsForDesignTags(def.tags) : [];

  return [
    category,
    subfilterId,
    labels.designCategory(category),
    labels.designSubfilter(category, subfilterId),
    labels.browseDesignSubfilter(category, subfilterId),
    labels.browseAllDesigns(category),
    ...DESIGN_CATEGORY_KEYWORDS[category],
    ...tagKeywords,
  ]
    .filter(Boolean)
    .join(' ');
}

function buildCatalogCollectionResults(labels: CatalogSearchLabels): GlobalSearchResult[] {
  const results: GlobalSearchResult[] = [];

  for (const category of designCategories) {
    results.push({
      id: `collection:designs:${category}`,
      kind: 'collection',
      href: `/designs/all?category=${category}`,
      title: labels.browseAllDesigns(category),
      subtitle: labels.designCategory(category),
      searchText: buildDesignCategoryCollectionSearchText(category, labels),
      designCategory: category,
      collectionScope: 'category',
    });

    for (const subfilter of getAvailableDesignSubfilters(category)) {
      results.push({
        id: `collection:designs:${category}:${subfilter.id}`,
        kind: 'collection',
        href: `/designs/all?category=${category}&tag=${subfilter.id}`,
        title: labels.designSubfilter(category, subfilter.id),
        subtitle: labels.designCategory(category),
        searchText: buildDesignSubfilterCollectionSearchText(
          category,
          subfilter.id,
          labels,
        ),
        designCategory: category,
        collectionScope: 'subfilter',
        subfilterId: subfilter.id,
      });
    }
  }

  return results;
}

function buildCatalogItemResults(
  labels: CatalogSearchLabels,
  extraDesigns: SearchableDesign[] = [],
): GlobalSearchResult[] {
  const results: GlobalSearchResult[] = [];
  const staticIds = new Set(designTemplates.map((design) => design.id));

  for (const design of designTemplates) {
    results.push({
      id: design.id,
      kind: 'design',
      href: getDesignHref(design),
      title: labels.designName(design.id),
      subtitle: labels.designCategory(design.category),
      searchText: buildDesignSearchText(design, labels),
      designCategory: design.category,
      designKind: design.kind,
      svgTemplateId: design.svgTemplateId,
      layoutId: design.layoutId,
      image: resolveAssetUrl(design.image),
    });
  }

  for (const design of extraDesigns) {
    if (staticIds.has(design.id)) continue;
    const title = design.displayName ?? labels.designName(design.id);
    results.push({
      id: design.id,
      kind: 'design',
      href: getDesignHref(design),
      title,
      subtitle: labels.designCategory(design.category),
      searchText: buildDesignSearchText(design, labels, design.displayName),
      designCategory: design.category,
      designKind: design.kind,
      svgTemplateId: design.svgTemplateId,
      layoutId: design.layoutId,
      image: resolveAssetUrl(design.image),
    });
  }

  for (const product of products) {
    results.push({
      id: product.id,
      kind: 'product',
      href: buildCustomizerUrl(product.id, product.type),
      title: labels.productName(product),
      subtitle: labels.productTypePlural(product.type),
      searchText: buildProductSearchText(product, labels),
      productType: product.type,
      image: product.image,
    });
  }

  for (const design of productDesignTemplates) {
    const matchedProducts = products.filter(
      (product) =>
        design.productTypes.includes(product.type) &&
        (!design.productIds || design.productIds.includes(product.id)),
    );

    for (const product of matchedProducts) {
      const previewColor = resolveDesignPreviewColor(design, product);

      results.push({
        id: `${design.id}:${product.id}`,
        kind: 'product-design',
        href: buildCustomizerUrl(product.id, product.type, {
          design: design.id,
          color: previewColor,
        }),
        title: labels.productDesignName(design),
        subtitle: labels.productType(product.type),
        searchText: buildProductDesignSearchText(
          { design, products: [product] },
          labels,
        ),
        productId: product.id,
        premadeDesignId: design.id,
        productType: product.type,
        productDesignCategory: design.category,
        image:
          getProductDesignThumbnail(design, previewColor) ?? product.image,
      });
    }
  }

  return results;
}

function buildCatalogSearchIndex(
  labels: CatalogSearchLabels,
  extraDesigns: SearchableDesign[] = [],
): CatalogSearchIndex {
  return {
    collections: buildCatalogCollectionResults(labels),
    items: buildCatalogItemResults(labels, extraDesigns),
  };
}

function getCatalogSearchIndex(
  labels: CatalogSearchLabels,
  extraDesigns: SearchableDesign[] = [],
): CatalogSearchIndex {
  const extraKey = designsCacheKey(extraDesigns);
  const cachedExtraKey = cachedSearchIndex
    ? designsCacheKey(cachedSearchIndex.extraDesigns)
    : '';

  if (
    cachedSearchIndex?.labels === labels &&
    cachedExtraKey === extraKey
  ) {
    return cachedSearchIndex.index;
  }

  const index = buildCatalogSearchIndex(labels, extraDesigns);
  cachedSearchIndex = { labels, extraDesigns, index };
  return index;
}

export function searchGlobalCatalog(
  query: string,
  labels: CatalogSearchLabels,
  extraDesigns: SearchableDesign[] = [],
): GlobalSearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const { collections, items } = getCatalogSearchIndex(labels, extraDesigns);
  const matchedCollections = collections.filter((item) =>
    matchesCatalogSearch(item.searchText, trimmed),
  );
  const matchedItems = items.filter((item) =>
    matchesCatalogSearch(item.searchText, trimmed),
  );

  return [...matchedCollections, ...matchedItems];
}

export function createCatalogSearchLabels(hooks: {
  tDesigns: (key: string) => string;
  tProducts: (key: string, values?: Record<string, string | number>) => string;
  tNavCategories: (key: string) => string;
  tSearch: (key: string, values?: Record<string, string | number>) => string;
}): CatalogSearchLabels {
  return {
    designName: (id) => hooks.tDesigns(`templates.${id}`),
    designCategory: (category) => hooks.tDesigns(`categories.${category}`),
    designSubfilter: (category, id) => hooks.tDesigns(`subfilters.${category}.${id}`),
    browseAllDesigns: (category) =>
      hooks.tSearch('browseAllDesigns', {
        category: hooks.tDesigns(`categories.${category}`),
      }),
    browseDesignSubfilter: (category, id) =>
      hooks.tSearch('browseDesignSubfilter', {
        category: hooks.tDesigns(`categories.${category}`),
        subfilter: hooks.tDesigns(`subfilters.${category}.${id}`),
      }),
    productName: (product) =>
      product.nameKey
        ? hooks.tProducts(`items.${product.nameKey}`)
        : hooks.tProducts(`types.${product.type}`),
    productType: (type) => hooks.tProducts(`types.${type}`),
    productTypePlural: (type) => hooks.tProducts(`typesPlural.${type}`),
    productNavCategory: (id) => hooks.tNavCategories(id),
    productDesignName: (design) =>
      design.titleEn ?? design.titleMk ?? hooks.tProducts(`designs.${design.nameKey}`),
  };
}
