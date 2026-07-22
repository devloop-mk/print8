import { unstable_cache } from 'next/cache';
import { cmsDb } from '@/lib/db/cms';
import {
  DEFAULT_TRENDING_PRODUCT_DESIGN_IDS,
  TRENDING_DESIGN_ACCENTS,
  type TrendingDesignAccent,
} from '@/lib/data/trending-designs';
import {
  productDesignTemplates as staticProductDesignTemplates,
  type ProductDesignTemplate,
} from '@/lib/data/catalog';
import { managedProductDesignsDb } from '@/lib/db/managed-product-designs';
import { getCatalogSource } from '@/lib/products/catalog-source';
import { mergeProductDesignCatalog } from '@/lib/products/merge-product-designs';

export const CMS_HOME_TRENDING_CACHE_TAG = 'cms-home-trending';

export type TrendingProductDesign = {
  id: string;
  nameKey: string;
  titleEn?: string;
  titleMk?: string;
} & TrendingDesignAccent;

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
    // Card UI only needs id + display names; thumbnails are keyed by id.
    return [
      {
        id,
        nameKey: design.nameKey,
        ...(design.titleEn ? { titleEn: design.titleEn } : {}),
        ...(design.titleMk ? { titleMk: design.titleMk } : {}),
        ...accentForRank(index),
      },
    ];
  });
}

/**
 * Homepage trending strip. Intentionally avoids PRODUCT_DESIGNS_CACHE_TAG and
 * display-order tags so merch/admin catalog saves do not rewrite homepage ISR.
 * Invalidated only via CMS_HOME_TRENDING_CACHE_TAG (admin trending editor).
 */
const getHomeTrendingProductDesignsCached = unstable_cache(
  async (): Promise<TrendingProductDesign[]> => {
    const rows = await cmsDb.homeTrending.list();
    const activeIds =
      rows.length > 0
        ? rows
            .filter((row) => row.active)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((row) => row.designId)
        : DEFAULT_TRENDING_PRODUCT_DESIGN_IDS;

    const source = getCatalogSource();
    let managed: Awaited<ReturnType<typeof managedProductDesignsDb.list>> = [];
    if (source !== 'static') {
      try {
        managed = await managedProductDesignsDb.list();
      } catch {
        managed = [];
      }
    }

    const templates = mergeProductDesignCatalog(
      staticProductDesignTemplates,
      managed,
      {},
      source === 'static' ? 'static' : source,
    );

    return pickTrendingProductDesigns(templates, activeIds);
  },
  ['home-trending-resolved-v1'],
  {
    revalidate: 86400,
    tags: [CMS_HOME_TRENDING_CACHE_TAG],
  },
);

export async function getHomeTrendingProductDesigns(): Promise<TrendingProductDesign[]> {
  return getHomeTrendingProductDesignsCached();
}
