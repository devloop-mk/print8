import {
  getProductDesignTemplate,
  type ProductDesignTemplate,
} from '@/lib/data/catalog';
import { getCouplePackPartnerDesign } from '@/lib/data/couple-pack';
import { streetwearPackTemplates } from '@/lib/data/streetwear-pack';

function findStreetwearTemplate(id: string): ProductDesignTemplate | null {
  if (!id.startsWith('tee-sw-')) return null;
  return streetwearPackTemplates.find((template) => template.id === id) ?? null;
}

/** Synchronous lookup for client components and hot paths. */
export function resolveStaticProductDesignTemplate(
  id: string,
): ProductDesignTemplate | null {
  // Prefer the shared catalog entry (same source admin merges against).
  const fromCatalog = getProductDesignTemplate(id);
  if (fromCatalog) return fromCatalog;

  const couple = getCouplePackPartnerDesign(id);
  if (couple) return couple.design;

  return findStreetwearTemplate(id);
}

/** Server lookup — merged admin overrides when available, static catalog fallback. */
export async function resolveProductDesignTemplate(
  id: string,
): Promise<ProductDesignTemplate | null> {
  const staticDesign = resolveStaticProductDesignTemplate(id);

  try {
    const { getMergedProductDesignTemplate } = await import(
      '@/lib/products/merged-product-designs'
    );
    const merged = await getMergedProductDesignTemplate(id);
    if (merged) return merged;
  } catch {
    // Supabase or cache unavailable — use static catalog.
  }

  return staticDesign;
}
