import type { DesignCategory, DesignTemplate } from '@/lib/data/catalog';
import type { CatalogDesignRecord } from '@/lib/db/catalog-designs';
import type { SvgDesignTemplate } from '@/lib/data/svg-design-templates';
import type { ManagedSvgTemplateDefaultsPayload } from '@/lib/db/managed-svg-templates';

export const ADMIN_DESIGNS_PAGE_SIZE = 50;

export type AdminDesignStorage = 'all' | 'database' | 'code-only';

export type AdminDesignListItem = {
  id: string;
  title: string;
  category: DesignCategory;
  kind: DesignTemplate['kind'];
  svgTemplateId: string | null;
  inDatabase: boolean;
  isStatic: boolean;
  hasSvgTemplate: boolean;
  hasDefaultsOverride: boolean;
  availability: CatalogDesignRecord['availability'] | null;
  exclusive: boolean;
};

export type AdminDesignListPage = {
  items: AdminDesignListItem[];
  total: number;
  page: number;
  pageSize: number;
  inDatabaseCount: number;
  codeOnlyCount: number;
  svgTemplateCount: number;
};

export type ResolvedAdminDesign = {
  id: string;
  staticTemplate: DesignTemplate;
  managed: CatalogDesignRecord | null;
  svgTemplate: SvgDesignTemplate | null;
  svgDefaults: ManagedSvgTemplateDefaultsPayload | null;
  displayNameMk: string;
  displayNameEn: string;
};

export function matchesAdminDesignSearch(
  item: Pick<AdminDesignListItem, 'id' | 'title' | 'category' | 'kind'>,
  search: string,
) {
  const query = search.trim().toLowerCase();
  if (!query) return true;

  return [item.id, item.title, item.category, item.kind]
    .join(' ')
    .toLowerCase()
    .includes(query);
}

export const DESIGN_CATEGORY_OPTIONS: DesignCategory[] = [
  'business-cards',
  'wedding',
  'birthday',
  'menus',
  'general',
];
