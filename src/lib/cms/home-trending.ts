import { unstable_cache } from 'next/cache';
import { cmsDb } from '@/lib/db/cms';
import {
  DEFAULT_TRENDING_PRODUCT_DESIGN_IDS,
  TRENDING_DESIGN_ACCENTS,
  type TrendingDesignAccent,
} from '@/lib/data/trending-designs';
import type { ProductDesignTemplate } from '@/lib/data/catalog';
import { getMergedProductDesignTemplates } from '@/lib/products/merged-product-designs';

export const CMS_HOME_TRENDING_CACHE_TAG = 'cms-home-trending';

export type TrendingProductDesign = ProductDesignTemplate & TrendingDesignAccent;

const getTrendingRowsCached = unstable_cache(
  async () => cmsDb.homeTrending.list(),
  ['cms-home-trending-rows'],
  {
    revalidate: 300,
    tags: [CMS_HOME_TRENDING_CACHE_TAG],
  },
);

function accentForRank(rank: number): Omit<TrendingDesignAccent, 'id'> {
  const preset = TRENDING_DESIGN_ACCENTS[rank % TRENDING_DESIGN_ACCENTS.length];
  return {
    gradient: preset.gradient,
    ring: preset.ring,
    badge: preset.badge,
  };
}

export function pickTrendingProductDesigns(
  templates: ProductDesignTemplate[],
  designIds: string[],
): TrendingProductDesign[] {
  const byId = new Map(templates.map((template) => [template.id, template]));

  return designIds.flatMap((id, index) => {
    const design = byId.get(id);
    if (!design) return [];
    return [{ ...design, id, ...accentForRank(index) }];
  });
}

export async function getHomeTrendingProductDesigns(): Promise<TrendingProductDesign[]> {
  const [rows, templates] = await Promise.all([
    getTrendingRowsCached(),
    getMergedProductDesignTemplates(),
  ]);

  const activeIds =
    rows.length > 0
      ? rows
          .filter((row) => row.active)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((row) => row.designId)
      : DEFAULT_TRENDING_PRODUCT_DESIGN_IDS;

  return pickTrendingProductDesigns(templates, activeIds);
}
