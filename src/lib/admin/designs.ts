import {
  catalogDesignsDb,
  type CatalogDesignInput,
  type CatalogDesignRecord,
  type DesignAvailability,
} from '@/lib/db/catalog-designs';
import type { DesignCategory } from '@/lib/data/catalog';

export type AdminDesignListItem = CatalogDesignRecord;

export async function listAdminDesigns(options?: {
  category?: DesignCategory | 'all';
  availability?: DesignAvailability | 'all';
  exclusive?: boolean | 'all';
  search?: string;
}) {
  return catalogDesignsDb.list(options);
}

export async function getAdminDesign(id: string) {
  return catalogDesignsDb.findById(id);
}

export async function saveAdminDesign(input: CatalogDesignInput) {
  return catalogDesignsDb.upsert(input);
}

export async function updateAdminDesign(
  id: string,
  patch: Partial<CatalogDesignInput> & {
    availability?: DesignAvailability;
    reservedOrderId?: string | null;
    soldOrderId?: string | null;
  },
) {
  return catalogDesignsDb.update(id, patch);
}

export async function deleteAdminDesign(id: string) {
  return catalogDesignsDb.delete(id);
}

export const DESIGN_AVAILABILITY_OPTIONS: DesignAvailability[] = [
  'available',
  'reserved',
  'sold',
  'draft',
  'archived',
];

export const DESIGN_CATEGORY_OPTIONS: DesignCategory[] = [
  'business-cards',
  'wedding',
  'birthday',
  'menus',
  'general',
];
