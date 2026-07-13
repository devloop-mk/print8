import type { DesignAvailability } from '@/lib/db/catalog-designs';
import type { DesignCategory } from '@/lib/data/catalog';

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
