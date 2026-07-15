import 'server-only';

import { revalidateTag } from 'next/cache';
import {
  getProductDesignTemplate,
  productDesignTemplates,
  type ProductDesignTemplate,
} from '@/lib/data/catalog';
import { managedProductDesignsDb } from '@/lib/db/managed-product-designs';
import { mergeProductDesignTemplate } from '@/lib/products/merge-product-designs';
import { PRODUCT_DESIGNS_CACHE_TAG } from '@/lib/products/merged-product-designs';
import {
  ADMIN_PRODUCT_DESIGNS_PAGE_SIZE,
  matchesAdminProductDesignSearch,
  type AdminProductDesignListItem,
  type AdminProductDesignListPage,
  type AdminProductDesignStorage,
  type ResolvedAdminProductDesign,
} from '@/lib/admin/product-designs-shared';
import {
  clampCatalogPage,
  sliceCatalogPage,
} from '@/lib/catalog/pagination';

export type {
  AdminProductDesignListItem,
  AdminProductDesignListPage,
  ResolvedAdminProductDesign,
} from '@/lib/admin/product-designs-shared';

function revalidateProductDesignCaches() {
  revalidateTag(PRODUCT_DESIGNS_CACHE_TAG, 'max');
  revalidateTag('catalog-ready-designs', 'max');
}

function buildAdminProductDesignListItems(
  managed: Awaited<ReturnType<typeof managedProductDesignsDb.list>>,
): AdminProductDesignListItem[] {
  const managedById = new Map(managed.map((record) => [record.id, record]));
  const items: AdminProductDesignListItem[] = [];

  for (const staticTemplate of productDesignTemplates) {
    const managedRecord = managedById.get(staticTemplate.id);
    const template = managedRecord
      ? mergeProductDesignTemplate(staticTemplate, managedRecord.template)
      : staticTemplate;

    items.push({
      id: staticTemplate.id,
      title:
        template.titleMk ??
        template.titleEn ??
        template.nameKey ??
        staticTemplate.id,
      kind: template.kind,
      category: template.category,
      productTypes: template.productTypes,
      collection: template.collection,
      active: managedRecord ? managedRecord.active : true,
      inDatabase: Boolean(managedRecord),
      isStatic: true,
      sortOrder: managedRecord?.sortOrder ?? 0,
      applicableColorCount: template.applicableColors?.length ?? 0,
      variantColorCount: Object.keys(template.overlayColorVariants ?? {}).length,
    });
  }

  for (const managedRecord of managed) {
    if (productDesignTemplates.some((template) => template.id === managedRecord.id)) {
      continue;
    }
    const template = managedRecord.template;
    items.push({
      id: managedRecord.id,
      title:
        template.titleMk ??
        template.titleEn ??
        template.nameKey ??
        managedRecord.id,
      kind: template.kind,
      category: template.category,
      productTypes: template.productTypes,
      collection: template.collection,
      active: managedRecord.active,
      inDatabase: true,
      isStatic: false,
      sortOrder: managedRecord.sortOrder,
      applicableColorCount: template.applicableColors?.length ?? 0,
      variantColorCount: Object.keys(template.overlayColorVariants ?? {}).length,
    });
  }

  return items.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.title.localeCompare(b.title);
  });
}

export async function listAdminProductDesignsPage(options?: {
  search?: string;
  storage?: AdminProductDesignStorage;
  page?: number;
  pageSize?: number;
}): Promise<AdminProductDesignListPage> {
  const pageSize = options?.pageSize ?? ADMIN_PRODUCT_DESIGNS_PAGE_SIZE;
  const managed = await managedProductDesignsDb.list();
  const allItems = buildAdminProductDesignListItems(managed);

  const inDatabaseCount = allItems.filter((item) => item.inDatabase).length;
  const codeOnlyCount = allItems.filter(
    (item) => item.isStatic && !item.inDatabase,
  ).length;

  const search = options?.search?.trim() ?? '';

  let filtered = allItems.filter((item) =>
    matchesAdminProductDesignSearch(item, search),
  );

  if (options?.storage === 'database') {
    filtered = filtered.filter((item) => item.inDatabase);
  } else if (options?.storage === 'code-only') {
    filtered = filtered.filter((item) => item.isStatic && !item.inDatabase);
  }

  const page = clampCatalogPage(
    options?.page ?? 1,
    filtered.length,
    pageSize,
  );

  return {
    items: sliceCatalogPage(filtered, page, pageSize),
    total: filtered.length,
    page,
    pageSize,
    inDatabaseCount,
    codeOnlyCount,
  };
}

/** @deprecated Use listAdminProductDesignsPage */
export async function listAdminProductDesigns(options?: {
  search?: string;
  source?: 'all' | 'static' | 'managed';
}) {
  const storage: AdminProductDesignStorage =
    options?.source === 'managed'
      ? 'database'
      : options?.source === 'static'
        ? 'code-only'
        : 'all';
  const result = await listAdminProductDesignsPage({
    search: options?.search,
    storage,
    page: 1,
    pageSize: Number.MAX_SAFE_INTEGER,
  });
  return result.items;
}

export async function importStaticProductDesignsToDatabase(options?: {
  overwrite?: boolean;
}) {
  let imported = 0;
  let skipped = 0;

  for (const template of productDesignTemplates) {
    const existing = await managedProductDesignsDb.findById(template.id);
    if (existing && !options?.overwrite) {
      skipped += 1;
      continue;
    }

    await managedProductDesignsDb.upsert({
      id: template.id,
      template: { ...template },
      active: existing?.active ?? true,
      sortOrder: existing?.sortOrder ?? 0,
    });
    imported += 1;
  }

  revalidateProductDesignCaches();
  return {
    imported,
    skipped,
    total: productDesignTemplates.length,
  };
}

export async function resolveAdminProductDesign(
  id: string,
): Promise<ResolvedAdminProductDesign | null> {
  const staticTemplate = getProductDesignTemplate(id) ?? null;
  const managed = await managedProductDesignsDb.findById(id);

  if (!staticTemplate && !managed) return null;

  const template = staticTemplate
    ? managed
      ? mergeProductDesignTemplate(staticTemplate, managed.template)
      : staticTemplate
    : managed!.template;

  return {
    id,
    template,
    staticTemplate,
    managed,
    active: managed?.active ?? true,
    sortOrder: managed?.sortOrder ?? 0,
  };
}

export async function saveAdminProductDesign(input: {
  id: string;
  template: ProductDesignTemplate;
  active?: boolean;
  sortOrder?: number;
}) {
  const saved = await managedProductDesignsDb.upsert({
    id: input.id,
    template: input.template,
    active: input.active,
    sortOrder: input.sortOrder,
  });
  revalidateProductDesignCaches();
  return saved;
}

export async function deleteAdminProductDesign(id: string) {
  await managedProductDesignsDb.delete(id);
  revalidateProductDesignCaches();
}
