import 'server-only';

import {
  designTemplates,
  type DesignCategory,
} from '@/lib/data/catalog';
import { exclusiveBusinessCardTemplates } from '@/lib/data/exclusive-business-cards';
import { catalogDesignsDb } from '@/lib/db/catalog-designs';
import { displayOrderDb } from '@/lib/db/display-order';
import { getPrintDesignDisplayOrderRecord } from '@/lib/cms/display-order';
import { sortByDisplayOrder } from '@/lib/products/sort-by-display-order';
import type { DisplayOrderItem } from '@/components/admin/DisplayOrderAdminPanel';

const CATEGORY_LABELS_MK: Record<DesignCategory, string> = {
  'business-cards': 'Визитници',
  wedding: 'Свадби',
  birthday: 'Родендени',
  menus: 'Мени',
  general: 'Општо',
};

export function getPrintDesignCategoryLabelsMk(): Record<string, string> {
  return CATEGORY_LABELS_MK;
}

export async function buildPrintDesignOrderItems(): Promise<DisplayOrderItem[]> {
  const [managed, printOrder] = await Promise.all([
    catalogDesignsDb.list(),
    getPrintDesignDisplayOrderRecord(),
  ]);
  const managedById = new Map(managed.map((record) => [record.id, record]));
  const staticIds = new Set(designTemplates.map((template) => template.id));
  const items: DisplayOrderItem[] = [];

  for (const template of designTemplates) {
    const record = managedById.get(template.id);
    items.push({
      id: template.id,
      title: record?.nameMk ?? template.id,
      image: record?.image ?? template.image,
      meta: `${template.id} · ${CATEGORY_LABELS_MK[template.category]}`,
      collection: template.category,
    });
  }

  for (const record of managed) {
    if (staticIds.has(record.id)) continue;
    items.push({
      id: record.id,
      title: record.nameMk,
      image: record.image,
      meta: `${record.id} · ${CATEGORY_LABELS_MK[record.category as DesignCategory] ?? record.category}`,
      collection: record.category,
    });
  }

  for (const exclusive of exclusiveBusinessCardTemplates) {
    if (staticIds.has(exclusive.id) || managedById.has(exclusive.id)) continue;
    items.push({
      id: exclusive.id,
      title: exclusive.nameMk,
      image: exclusive.image,
      meta: `${exclusive.id} · ${CATEGORY_LABELS_MK[exclusive.category]}`,
      collection: exclusive.category,
    });
  }

  if (Object.keys(printOrder).length > 0) {
    return sortByDisplayOrder(items, printOrder);
  }

  return items.sort((a, b) => {
    const orderA = managedById.get(a.id)?.sortOrder ?? 1_000_000;
    const orderB = managedById.get(b.id)?.sortOrder ?? 1_000_000;
    if (orderA !== orderB) return orderA - orderB;
    return a.id.localeCompare(b.id);
  });
}

export async function savePrintDesignDisplayOrder(
  entries: Array<{ id: string; sortOrder: number }>,
): Promise<void> {
  await displayOrderDb.printDesigns.upsertMany(entries);
}
