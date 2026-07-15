'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { CouplePackTemplate } from '@/lib/data/couple-pack';
import { partnerDesignToTemplate } from '@/lib/data/couple-pack';
import { products } from '@/lib/data/catalog';
import {
  getDesignApplicableColors,
  resolveDesignPreviewColor,
} from '@/lib/products/design-applicable-colors';
import { buildCouplePackDetailUrl } from '@/lib/products/paths';
import { getCouplePackPrice } from '@/lib/products/couple-pack-order';
import { useMergedProductDesignTemplate } from '@/lib/products/use-merged-product-design-template';
import { formatPrice } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { DesignTemplatePreview } from '@/components/products/DesignTemplatePreview';
import { Heart } from 'lucide-react';

type CouplePackCardProps = {
  pack: CouplePackTemplate;
  colorFilter?: string | 'all';
};

export function CouplePackCard({
  pack,
  colorFilter = 'all',
}: CouplePackCardProps) {
  const t = useTranslations('products');
  const tc = useTranslations('products.couplePacks');
  const tp = useTranslations('products.types');
  const locale = useLocale();

  const [partner1, partner2] = pack.partnerDesigns;
  const staticDesign1 = partnerDesignToTemplate(pack, partner1);
  const staticDesign2 = partnerDesignToTemplate(pack, partner2);
  const design1 =
    useMergedProductDesignTemplate(partner1.designId, staticDesign1) ??
    staticDesign1;
  const design2 =
    useMergedProductDesignTemplate(partner2.designId, staticDesign2) ??
    staticDesign2;

  const product = useMemo(() => {
    return (
      products.find((item) => pack.productTypes.includes(item.type)) ??
      products.find((item) => item.id === 'tshirt-basic-white')!
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
    <Card className="group flex h-full flex-col overflow-hidden p-0 transition hover:border-brand-200 hover:shadow-md">
      <Link
        href={buildCouplePackDetailUrl(pack.id)}
        className="flex flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
      >
        <div className="grid grid-cols-2 gap-0 border-b border-ink-100">
          <div className="border-r border-ink-100">
            <DesignTemplatePreview
              product={product}
              color={previewColor}
              design={design1}
              typeLabel={partner1.labelEn}
            />
          </div>
          <DesignTemplatePreview
            product={product}
            color={previewColor}
            design={design2}
            typeLabel={partner2.labelEn}
          />
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
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
                price: formatPrice(getCouplePackPrice(product), locale),
              })}
            </p>
          </div>
        </div>
      </Link>
    </Card>
  );
}
