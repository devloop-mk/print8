import 'server-only';

import { revalidateTag } from 'next/cache';
import {
  designTemplates,
  getDesignTemplate,
  type DesignCategory,
} from '@/lib/data/catalog';
import { getSvgDesignTemplate } from '@/lib/data/svg-design-templates';
import {
  catalogDesignsDb,
  type CatalogDesignInput,
  type CatalogDesignRecord,
  type DesignAvailability,
} from '@/lib/db/catalog-designs';
import {
  managedSvgTemplatesDb,
  type ManagedSvgTemplateDefaultsPayload,
} from '@/lib/db/managed-svg-templates';
import {
  hasManagedSvgDefaults,
  MANAGED_SVG_TEMPLATES_CACHE_TAG,
} from '@/lib/designs/managed-svg-template-defaults';
import { revalidateDesignCatalogCache } from '@/lib/catalog/revalidate-design-catalog';
import {
  ADMIN_DESIGNS_PAGE_SIZE,
  matchesAdminDesignSearch,
  type AdminDesignListItem,
  type AdminDesignListPage,
  type AdminDesignStorage,
  type ResolvedAdminDesign,
} from '@/lib/admin/designs-shared';
import {
  clampCatalogPage,
  sliceCatalogPage,
} from '@/lib/catalog/pagination';

export type { AdminDesignListItem, AdminDesignListPage, ResolvedAdminDesign } from '@/lib/admin/designs-shared';

export {
  DESIGN_AVAILABILITY_OPTIONS,
  DESIGN_CATEGORY_OPTIONS,
} from '@/lib/admin/designs-constants';

function buildAdminDesignListItems(
  managed: CatalogDesignRecord[],
  svgDefaultsByTemplateId: Map<string, ManagedSvgTemplateDefaultsPayload>,
): AdminDesignListItem[] {
  const managedById = new Map(managed.map((record) => [record.id, record]));
  const items: AdminDesignListItem[] = [];

  for (const staticTemplate of designTemplates) {
    const managedRecord = managedById.get(staticTemplate.id);
    const svgTemplateId = staticTemplate.svgTemplateId ?? null;
    const svgDefaults = svgTemplateId
      ? svgDefaultsByTemplateId.get(svgTemplateId) ?? null
      : null;

    items.push({
      id: staticTemplate.id,
      title: managedRecord?.nameMk ?? staticTemplate.id,
      category: staticTemplate.category,
      kind: staticTemplate.kind,
      svgTemplateId,
      inDatabase: Boolean(managedRecord),
      isStatic: true,
      hasSvgTemplate: Boolean(svgTemplateId),
      hasDefaultsOverride: hasManagedSvgDefaults(svgDefaults),
      availability: managedRecord?.availability ?? null,
      exclusive: managedRecord?.exclusive ?? false,
    });
  }

  for (const managedRecord of managed) {
    if (designTemplates.some((template) => template.id === managedRecord.id)) {
      continue;
    }

    const svgTemplateId = managedRecord.svgTemplateId ?? null;
    const svgDefaults = svgTemplateId
      ? svgDefaultsByTemplateId.get(svgTemplateId) ?? null
      : null;

    items.push({
      id: managedRecord.id,
      title: managedRecord.nameMk,
      category: managedRecord.category,
      kind: managedRecord.kind,
      svgTemplateId,
      inDatabase: true,
      isStatic: false,
      hasSvgTemplate: Boolean(svgTemplateId),
      hasDefaultsOverride: hasManagedSvgDefaults(svgDefaults),
      availability: managedRecord.availability,
      exclusive: managedRecord.exclusive,
    });
  }

  return items.sort((a, b) => a.title.localeCompare(b.title, 'mk'));
}

export async function listAdminDesignsPage(options?: {
  category?: DesignCategory | 'all';
  search?: string;
  storage?: AdminDesignStorage;
  page?: number;
  pageSize?: number;
}): Promise<AdminDesignListPage> {
  const pageSize = options?.pageSize ?? ADMIN_DESIGNS_PAGE_SIZE;
  const [managed, svgDefaults] = await Promise.all([
    catalogDesignsDb.list({
      category: options?.category,
    }),
    managedSvgTemplatesDb.list(),
  ]);

  const svgDefaultsByTemplateId = new Map(
    svgDefaults.map((record) => [record.templateId, record.defaults]),
  );

  const allItems = buildAdminDesignListItems(managed, svgDefaultsByTemplateId);
  const inDatabaseCount = allItems.filter((item) => item.inDatabase).length;
  const codeOnlyCount = allItems.filter(
    (item) => item.isStatic && !item.inDatabase,
  ).length;
  const svgTemplateCount = allItems.filter((item) => item.hasSvgTemplate).length;

  let filtered = allItems.filter((item) =>
    matchesAdminDesignSearch(item, options?.search ?? ''),
  );

  if (options?.category && options.category !== 'all') {
    filtered = filtered.filter((item) => item.category === options.category);
  }

  if (options?.storage === 'database') {
    filtered = filtered.filter((item) => item.inDatabase);
  } else if (options?.storage === 'code-only') {
    filtered = filtered.filter((item) => item.isStatic && !item.inDatabase);
  }

  const page = clampCatalogPage(options?.page ?? 1, filtered.length, pageSize);

  return {
    items: sliceCatalogPage(filtered, page, pageSize),
    total: filtered.length,
    page,
    pageSize,
    inDatabaseCount,
    codeOnlyCount,
    svgTemplateCount,
  };
}

/** @deprecated Use listAdminDesignsPage */
export async function listAdminDesigns(options?: {
  category?: DesignCategory | 'all';
  availability?: DesignAvailability | 'all';
  exclusive?: boolean | 'all';
  search?: string;
}) {
  const result = await listAdminDesignsPage({
    category: options?.category,
    search: options?.search,
    page: 1,
    pageSize: Number.MAX_SAFE_INTEGER,
  });
  return result.items;
}

export async function resolveAdminDesign(
  id: string,
): Promise<ResolvedAdminDesign | null> {
  const staticTemplate = getDesignTemplate(id) ?? null;
  const managed = await catalogDesignsDb.findById(id);

  if (!staticTemplate && !managed) return null;

  const template =
    staticTemplate ??
    ({
      id: managed!.id,
      category: managed!.category,
      image: managed!.image,
      tags: managed!.tags,
      kind: managed!.kind,
      svgTemplateId: managed!.svgTemplateId ?? undefined,
      layoutId: managed!.layoutId ?? undefined,
    } as const);

  const svgTemplateId = template.svgTemplateId ?? managed?.svgTemplateId ?? null;
  const svgTemplate = svgTemplateId
    ? getSvgDesignTemplate(svgTemplateId) ?? null
    : null;
  const svgManaged = svgTemplateId
    ? await managedSvgTemplatesDb.findByTemplateId(svgTemplateId)
    : null;

  return {
    id,
    staticTemplate: staticTemplate ?? template,
    managed,
    svgTemplate,
    svgDefaults: svgManaged?.defaults ?? null,
    displayNameMk: managed?.nameMk ?? id,
    displayNameEn: managed?.nameEn ?? id,
  };
}

export async function getAdminDesign(id: string) {
  return catalogDesignsDb.findById(id);
}

export async function saveAdminDesign(input: CatalogDesignInput) {
  const saved = await catalogDesignsDb.upsert(input);
  revalidateDesignCatalogCache();
  return saved;
}

export async function updateAdminDesign(
  id: string,
  patch: Partial<CatalogDesignInput> & {
    availability?: DesignAvailability;
    reservedOrderId?: string | null;
    soldOrderId?: string | null;
  },
) {
  const saved = await catalogDesignsDb.update(id, patch);
  revalidateDesignCatalogCache();
  return saved;
}

export async function deleteAdminDesign(id: string) {
  await catalogDesignsDb.delete(id);
  revalidateDesignCatalogCache();
}

export async function saveAdminSvgTemplateDefaults(input: {
  templateId: string;
  defaults: ManagedSvgTemplateDefaultsPayload;
}) {
  const saved = await managedSvgTemplatesDb.upsert(input);
  revalidateTag(MANAGED_SVG_TEMPLATES_CACHE_TAG, 'max');
  return saved;
}

export async function deleteAdminSvgTemplateDefaults(templateId: string) {
  await managedSvgTemplatesDb.delete(templateId);
  revalidateTag(MANAGED_SVG_TEMPLATES_CACHE_TAG, 'max');
}

export async function importStaticDesignToDatabase(id: string) {
  const staticTemplate = getDesignTemplate(id);
  if (!staticTemplate) {
    throw new Error(`Design ${id} not found in static catalog`);
  }

  const existing = await catalogDesignsDb.findById(id);
  if (existing) return existing;

  return saveAdminDesign({
    id: staticTemplate.id,
    category: staticTemplate.category,
    kind: staticTemplate.kind,
    image: staticTemplate.image,
    tags: staticTemplate.tags,
    thumbAspect: staticTemplate.thumbAspect ?? null,
    nameEn: staticTemplate.id,
    nameMk: staticTemplate.id,
    svgTemplateId: staticTemplate.svgTemplateId ?? null,
    layoutId: staticTemplate.layoutId ?? null,
    availability: 'available',
    exclusive: false,
  });
}
