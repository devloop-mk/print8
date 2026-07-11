'use client';

import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  resolveDesignProduct,
  type ProductDesignCatalogEntry,
} from '@/lib/products/design-catalog';
import {
  isImageDesignTemplate,
  isOverlayDesignTemplate,
  isTextDesignTemplate,
} from '@/lib/data/catalog';
import { resolveAssetUrl } from '@/lib/storage/asset-url';
import { getProductDesignDisplayName } from '@/lib/products/design-display-name';
import {
  getDesignApplicableColors,
  resolveDesignPreviewColor,
} from '@/lib/products/design-applicable-colors';
import {
  buildPremadeDesignCartPayload,
} from '@/lib/products/premade-design-order';
import { capturePreviewElement } from '@/lib/products/capture-preview';
import { buildCustomizerUrl } from '@/lib/products/paths';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/components/cart/CartProvider';
import { useRouter } from '@/i18n/navigation';
import { DesignTemplatePreview } from '@/components/products/DesignTemplatePreview';
import { DesignColorPicker } from '@/components/products/DesignColorPicker';

type ProductDesignCatalogCardProps = {
  entry: ProductDesignCatalogEntry;
  colorFilter: string | 'all';
};

export function ProductDesignCatalogCard({
  entry,
  colorFilter,
}: ProductDesignCatalogCardProps) {
  const t = useTranslations('products');
  const locale = useLocale() as 'mk' | 'en';
  const tc = useTranslations('products.catalog');
  const tp = useTranslations('products.types');
  const td = useTranslations('products.detail');
  const tCustomizer = useTranslations('products.customizer');
  const { addItem } = useCart();
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement>(null);
  const [ordering, setOrdering] = useState(false);

  const { product } = resolveDesignProduct(entry, colorFilter);
  const { design } = entry;
  const displayName =
    getProductDesignDisplayName(design, locale) !== design.nameKey
      ? getProductDesignDisplayName(design, locale)
      : t(`designs.${design.nameKey}`);

  const applicableColors = useMemo(
    () => getDesignApplicableColors(design, product),
    [design, product],
  );

  const [color, setColor] = useState(() => {
    if (
      colorFilter !== 'all' &&
      applicableColors.some(
        (value) => value.toLowerCase() === colorFilter.toLowerCase(),
      )
    ) {
      return colorFilter;
    }
    return resolveDesignPreviewColor(design, product);
  });

  const previewColor = resolveDesignPreviewColor(design, product, color);
  const canQuickOrder =
    isImageDesignTemplate(design) || isOverlayDesignTemplate(design);

  async function handleOrder() {
    setOrdering(true);
    try {
      let capturedPreview: string | undefined;
      if (previewRef.current) {
        capturedPreview = await capturePreviewElement(previewRef.current);
      }

      addItem(
        buildPremadeDesignCartPayload({
          product,
          design,
          color: previewColor,
          name: `${tp(product.type)} — ${displayName}`,
          price: product.basePrice,
          capturedPreview,
        }),
      );
      router.push('/cart');
    } finally {
      setOrdering(false);
    }
  }

  const customizeHref = buildCustomizerUrl(product.id, product.type, {
    design: design.id,
    color: previewColor,
  });

  return (
    <Card className="group flex h-full flex-col overflow-hidden p-0 transition hover:border-brand-200 hover:shadow-md">
      <Link
        href={customizeHref}
        className="flex flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
      >
        <div ref={previewRef}>
          {isTextDesignTemplate(design) || isOverlayDesignTemplate(design) ? (
            <DesignTemplatePreview
              product={product}
              color={previewColor}
              design={design}
              typeLabel={tp(product.type)}
            />
          ) : isImageDesignTemplate(design) ? (
            <div className="relative aspect-square overflow-hidden bg-white">
              <Image
                src={resolveAssetUrl(design.image!)}
                alt={displayName}
                fill
                sizes="(max-width: 768px) 50vw, 320px"
                className="object-contain p-4 transition group-hover:scale-[1.02]"
              />
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {entry.products.map((item) => (
              <span
                key={item.id}
                className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-700"
              >
                {tp(item.type)}
              </span>
            ))}
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
              {design.defaultSide === 'back'
                ? tc('sideBack')
                : tc('sideFront')}
            </span>
          </div>

          <div>
            <p className="font-medium text-ink-900 group-hover:text-brand-700">
              {displayName}
            </p>
            {isTextDesignTemplate(design) && design.textStyle ? (
              <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm text-ink-500">
                {design.textStyle.text}
              </p>
            ) : null}
          </div>
        </div>
      </Link>

      <div className="flex flex-col gap-2 px-4 pb-4">
        <DesignColorPicker
          colors={applicableColors}
          value={previewColor}
          onChange={setColor}
          variant="compact"
        />

        <div className="mt-auto border-t border-ink-100 pt-3">
          <div className="flex flex-col gap-2.5">
            {canQuickOrder ? (
              <Button
                size="sm"
                className="w-full normal-case tracking-normal shadow-none hover:translate-y-0 active:translate-y-0 active:shadow-none"
                onClick={handleOrder}
                loading={ordering}
                disabled={ordering}
              >
                {ordering ? tCustomizer('capturing') : td('orderWithDesign')}
              </Button>
            ) : (
              <Link
                href={buildCustomizerUrl(product.id, product.type, {
                  design: design.id,
                  color: previewColor,
                })}
              >
                <Button
                  size="sm"
                  className="w-full normal-case tracking-normal shadow-none hover:translate-y-0 active:translate-y-0 active:shadow-none"
                >
                  {isTextDesignTemplate(design)
                    ? td('customizeWithPhoto')
                    : td('customizeDesign')}
                </Button>
              </Link>
            )}

            {canQuickOrder ? (
              <Link
                href={buildCustomizerUrl(product.id, product.type, {
                  design: design.id,
                  color: previewColor,
                })}
                className="block text-center text-sm font-medium text-ink-600 transition-colors hover:text-brand-700"
              >
                {isTextDesignTemplate(design)
                  ? td('customizeWithPhoto')
                  : td('customizeDesign')}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
