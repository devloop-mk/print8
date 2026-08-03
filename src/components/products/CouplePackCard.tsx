'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { CouplePackTemplate } from '@/lib/data/couple-pack';
import { partnerDesignToTemplate } from '@/lib/data/couple-pack';
import { products, type ProductDesignTemplate } from '@/lib/data/catalog';
import {
  getDesignApplicableColors,
  resolveDesignPreviewColor,
} from '@/lib/products/design-applicable-colors';
import { buildCouplePackDetailUrl } from '@/lib/products/paths';
import { getCouplePackPrice } from '@/lib/products/couple-pack-order';
import { useMergedProductDesignTemplate } from '@/lib/products/use-merged-product-design-template';
import { cn, formatPrice } from '@/lib/utils';
import {
  getCatalogWideItemClassName,
  useOptionalCatalogGrid,
} from '@/components/catalog/CatalogGrid';
import { Card } from '@/components/ui/Card';
import { DesignTemplatePreview } from '@/components/products/DesignTemplatePreview';
import { Heart } from 'lucide-react';

type CouplePackCardProps = {
  pack: CouplePackTemplate;
  colorFilter?: string | 'all';
  /** Server-merged partner templates keyed by designId. */
  initialDesigns?: Record<string, ProductDesignTemplate>;
  /** Extra classes on the root grid item (e.g. when wrapped by Reveal). */
  className?: string;
  /**
   * When false, skip col-span-2 (parent already spans). Default true.
   */
  spanGridColumns?: boolean;
};

const couplePreviewFrameClass =
  'rounded-none border-0 bg-transparent';

export function CouplePackCard({
  pack,
  colorFilter = 'all',
  initialDesigns,
  className,
  spanGridColumns = true,
}: CouplePackCardProps) {
  const tc = useTranslations('products.couplePacks');
  const tp = useTranslations('products.types');
  const locale = useLocale();
  const grid = useOptionalCatalogGrid();

  const [partner1, partner2] = pack.partnerDesigns;
  const staticDesign1 = partnerDesignToTemplate(pack, partner1);
  const staticDesign2 = partnerDesignToTemplate(pack, partner2);
  const design1 =
    useMergedProductDesignTemplate(
      partner1.designId,
      initialDesigns?.[partner1.designId] ?? staticDesign1,
    ) ?? staticDesign1;
  const design2 =
    useMergedProductDesignTemplate(
      partner2.designId,
      initialDesigns?.[partner2.designId] ?? staticDesign2,
    ) ?? staticDesign2;

  const product = useMemo(() => {
    return (
      products.find((item) => pack.productTypes.includes(item.type)) ??
      products.find((item) => item.id === 'tshirt-unisex')!
    );
  }, [pack.productTypes]);

  const applicableColors = getDesignApplicableColors(design1, product);
  const [color, setColor] = useState(() =>
    resolveDesignPreviewColor(staticDesign1, product, pack.recommendedColor),
  );

  useEffect(() => {
    if (colorFilter === 'all') {
      setColor(
        resolveDesignPreviewColor(design1, product, pack.recommendedColor),
      );
      return;
    }
    const matched = applicableColors.find(
      (value) => value.toLowerCase() === colorFilter.toLowerCase(),
    );
    if (matched) setColor(matched);
  }, [applicableColors, colorFilter, design1, pack.recommendedColor, product]);

  const previewColor = applicableColors.some(
    (value) => value.toLowerCase() === color.toLowerCase(),
  )
    ? color
    : resolveDesignPreviewColor(design1, product, pack.recommendedColor);

  const title = locale === 'mk' ? pack.titleMk : pack.titleEn;

  return (
    <Card
      className={cn(
        'group flex h-full flex-col overflow-hidden p-0 transition hover:border-brand-200 hover:shadow-md',
        spanGridColumns && getCatalogWideItemClassName(grid),
        className,
      )}
    >
      <Link
        href={buildCouplePackDetailUrl(pack.id)}
        className="flex flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
      >
        {/* Dual tees: equal cells, no overlap/zoom (avoids clipping & uneven scale). */}
        <div className="relative border-b border-ink-100 bg-gradient-to-b from-ink-50/70 to-white px-2 pt-2 sm:px-3 sm:pt-3">
          <div className="grid grid-cols-2 items-end gap-1.5 sm:gap-2">
            <div className="min-w-0">
              <DesignTemplatePreview
                product={product}
                color={previewColor}
                design={design1}
                typeLabel={partner1.labelEn}
                className={couplePreviewFrameClass}
              />
            </div>
            <div className="min-w-0">
              <DesignTemplatePreview
                product={product}
                color={previewColor}
                design={design2}
                typeLabel={partner2.labelEn}
                className={couplePreviewFrameClass}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2.5 p-3 sm:gap-3 sm:p-4">
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">
              <Heart className="h-3 w-3" aria-hidden />
              {tc('badge')}
            </span>
            {pack.productTypes.map((type) => (
              <span
                key={type}
                className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-700"
              >
                {tp(type)}
              </span>
            ))}
          </div>

          <div>
            <p className="font-medium text-ink-900 group-hover:text-brand-700">
              {title}
            </p>
            <p className="mt-1 text-sm text-ink-500">
              {partner1.labelEn} + {partner2.labelEn}
            </p>
            <p className="mt-2 text-sm font-semibold text-brand-600">
              {tc('packPrice', {
                price: formatPrice(
                  getCouplePackPrice(product, pack, [design1, design2]),
                  locale,
                ),
              })}
            </p>
          </div>
        </div>
      </Link>
    </Card>
  );
}
