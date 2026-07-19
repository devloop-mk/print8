import {
  getCouplePackTemplate,
  getCouplePackTemplates,
  partnerDesignToTemplate,
  type CouplePackTemplate,
} from '@/lib/data/couple-pack';
import type { ProductDesignTemplate } from '@/lib/data/catalog';
import { resolveProductDesignTemplate } from '@/lib/products/resolve-product-design-template';

export type ResolvedCouplePackDesigns = {
  design1: ProductDesignTemplate;
  design2: ProductDesignTemplate;
};

/** Server-resolve both partner templates (admin overlay placement included). */
export async function resolveCouplePackPartnerDesigns(
  packId: string,
): Promise<ResolvedCouplePackDesigns | null> {
  const pack = getCouplePackTemplate(packId);
  if (!pack) return null;

  const [partner1, partner2] = pack.partnerDesigns;
  const [merged1, merged2] = await Promise.all([
    resolveProductDesignTemplate(partner1.designId),
    resolveProductDesignTemplate(partner2.designId),
  ]);

  return {
    design1: merged1 ?? partnerDesignToTemplate(pack, partner1),
    design2: merged2 ?? partnerDesignToTemplate(pack, partner2),
  };
}

/**
 * Map of partner designId → merged template for couple pack cards/archives.
 * Keeps first paint aligned with admin placement without waiting on client fetch.
 */
export async function resolveCouplePackDesignTemplatesMap(
  packs: CouplePackTemplate[] = getCouplePackTemplates(),
): Promise<Record<string, ProductDesignTemplate>> {
  const designIds = [
    ...new Set(
      packs.flatMap((pack) =>
        pack.partnerDesigns.map((partner) => partner.designId),
      ),
    ),
  ];

  const templates: Record<string, ProductDesignTemplate> = {};

  await Promise.all(
    designIds.map(async (id) => {
      const template = await resolveProductDesignTemplate(id);
      if (template) {
        templates[id] = template;
      }
    }),
  );

  return templates;
}
