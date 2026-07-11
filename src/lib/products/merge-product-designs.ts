import type { ProductDesignTemplate } from '@/lib/data/catalog';
import type { ManagedProductDesignRecord } from '@/lib/db/managed-product-designs';

function pickDefined<T extends Record<string, unknown>>(value: T): Partial<T> {
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
    ...pickDefined(override as Record<string, unknown>),
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
    textStyle: override.textStyle
      ? { ...base.textStyle, ...override.textStyle }
      : base.textStyle,
    applicableColors: override.applicableColors ?? base.applicableColors,
    productTypes: override.productTypes?.length
      ? override.productTypes
      : base.productTypes,
    productIds: override.productIds ?? base.productIds,
  };
}

export function mergeProductDesignCatalog(
  staticTemplates: ProductDesignTemplate[],
  managedRecords: ManagedProductDesignRecord[],
): ProductDesignTemplate[] {
  const managedById = new Map(
    managedRecords.map((record) => [record.id, record]),
  );
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

  return merged.sort((a, b) => {
    const orderA = managedById.get(a.id)?.sortOrder ?? 0;
    const orderB = managedById.get(b.id)?.sortOrder ?? 0;
    if (orderA !== orderB) return orderA - orderB;
    return a.id.localeCompare(b.id);
  });
}
