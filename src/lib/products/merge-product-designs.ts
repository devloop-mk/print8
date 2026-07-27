import type { ProductDesignTemplate } from '@/lib/data/catalog';
import type { ManagedProductDesignRecord } from '@/lib/db/managed-product-designs';
import type { CatalogSource } from '@/lib/products/catalog-source';

function pickDefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  ) as Partial<T>;
}

/** Deep-merge a managed template onto a static catalog entry. */
export function mergeProductDesignTemplate(
  base: ProductDesignTemplate,
  override: ProductDesignTemplate,
): ProductDesignTemplate {
  return {
    ...base,
    ...pickDefined(override),
    overlayRecolor: override.overlayRecolor
      ? { ...base.overlayRecolor, ...override.overlayRecolor }
      : base.overlayRecolor,
    overlayColorVariants:
      override.overlayColorVariants ?? base.overlayColorVariants,
    overlayPosition: override.overlayPosition
      ? { ...base.overlayPosition, ...override.overlayPosition }
      : base.overlayPosition,
    overlayByProductType: override.overlayByProductType
      ? { ...base.overlayByProductType, ...override.overlayByProductType }
      : base.overlayByProductType,
    backOverlay: mergeSideOverlay(base.backOverlay, override.backOverlay),
    textStyle: override.textStyle
      ? { ...base.textStyle, ...override.textStyle }
      : base.textStyle,
    applicableColors: override.applicableColors ?? base.applicableColors,
    applicableColorsByFit: override.applicableColorsByFit
      ? { ...base.applicableColorsByFit, ...override.applicableColorsByFit }
      : base.applicableColorsByFit,
    applicableColorsByProductType: override.applicableColorsByProductType
      ? {
          ...base.applicableColorsByProductType,
          ...override.applicableColorsByProductType,
        }
      : base.applicableColorsByProductType,
    applicableFits: override.applicableFits ?? base.applicableFits,
    productTypes: override.productTypes?.length
      ? override.productTypes
      : base.productTypes,
    productIds: override.productIds ?? base.productIds,
    designSides: override.designSides ?? base.designSides,
  };
}

function mergeSideOverlay(
  base?: ProductDesignTemplate['backOverlay'],
  override?: ProductDesignTemplate['backOverlay'],
): ProductDesignTemplate['backOverlay'] | undefined {
  if (!override) return base;
  if (!base) return override;

  return {
    ...base,
    ...pickDefined(override),
    overlayRecolor: override.overlayRecolor
      ? { ...base.overlayRecolor, ...override.overlayRecolor }
      : base.overlayRecolor,
    overlayColorVariants:
      override.overlayColorVariants ?? base.overlayColorVariants,
    overlayPosition: override.overlayPosition
      ? { ...base.overlayPosition, ...override.overlayPosition }
      : base.overlayPosition,
    overlayByProductType: override.overlayByProductType
      ? { ...base.overlayByProductType, ...override.overlayByProductType }
      : base.overlayByProductType,
  };
}

function readDisplayOrder(
  displayOrder: ReadonlyMap<string, number> | Readonly<Record<string, number>> | undefined,
  id: string,
): number | undefined {
  if (!displayOrder) return undefined;
  if (displayOrder instanceof Map) return displayOrder.get(id);
  return Object.prototype.hasOwnProperty.call(displayOrder, id)
    ? (displayOrder as Record<string, number>)[id]
    : undefined;
}

function sortProductDesignCatalog(
  templates: ProductDesignTemplate[],
  managedById: Map<string, ManagedProductDesignRecord>,
  displayOrder?: ReadonlyMap<string, number> | Readonly<Record<string, number>>,
): ProductDesignTemplate[] {
  return [...templates].sort((a, b) => {
    const overrideA = readDisplayOrder(displayOrder, a.id);
    const overrideB = readDisplayOrder(displayOrder, b.id);
    const orderA = overrideA ?? managedById.get(a.id)?.sortOrder ?? 0;
    const orderB = overrideB ?? managedById.get(b.id)?.sortOrder ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Build the storefront product-design catalog.
 *
 * - `database`: active DB rows only; if none, fall back to static packs (dev safety)
 * - `merge`: static packs + DB overrides (inactive DB rows hide the static twin)
 * - `static`: code packs only
 */
export function mergeProductDesignCatalog(
  staticTemplates: ProductDesignTemplate[],
  managedRecords: ManagedProductDesignRecord[],
  displayOrder?: ReadonlyMap<string, number> | Readonly<Record<string, number>>,
  source: CatalogSource = 'merge',
): ProductDesignTemplate[] {
  const managedById = new Map(
    managedRecords.map((record) => [record.id, record]),
  );

  if (source === 'static') {
    return sortProductDesignCatalog(staticTemplates, managedById, displayOrder);
  }

  if (source === 'database') {
    const activeManaged = managedRecords.filter((record) => record.active);
    if (activeManaged.length > 0) {
      return sortProductDesignCatalog(
        activeManaged.map((record) => record.template),
        managedById,
        displayOrder,
      );
    }
    // Empty / unavailable DB — keep local storefront working from packs.
    return sortProductDesignCatalog(staticTemplates, managedById, displayOrder);
  }

  const staticIds = new Set(staticTemplates.map((template) => template.id));
  const merged: ProductDesignTemplate[] = [];

  for (const staticTemplate of staticTemplates) {
    const managed = managedById.get(staticTemplate.id);
    if (managed && !managed.active) continue;
    merged.push(
      managed
        ? mergeProductDesignTemplate(staticTemplate, managed.template)
        : staticTemplate,
    );
  }

  for (const managed of managedRecords) {
    if (staticIds.has(managed.id) || !managed.active) continue;
    merged.push(managed.template);
  }

  return sortProductDesignCatalog(merged, managedById, displayOrder);
}
