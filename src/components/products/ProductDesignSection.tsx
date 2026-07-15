'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  isImageDesignTemplate,
  isOverlayDesignTemplate,
  isTextDesignTemplate,
  type Product,
  type ProductDesignTemplate,
} from '@/lib/data/catalog';
import { buildCustomizerUrl } from '@/lib/products/paths';
import { resolveAssetUrl } from '@/lib/storage/asset-url';
import {
  getDesignApplicableColors,
  resolveDesignPreviewColor,
} from '@/lib/products/design-applicable-colors';
import { normalizeHex } from '@/lib/products/design-overlay';
import {
  buildPremadeDesignCartPayload,
} from '@/lib/products/premade-design-order';
import { capturePreviewElement } from '@/lib/products/capture-preview';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/components/cart/CartProvider';
import { useRouter } from '@/i18n/navigation';
import { DesignTemplatePreview } from '@/components/products/DesignTemplatePreview';
import { DesignColorPicker } from '@/components/products/DesignColorPicker';
import { CatalogGridLayout } from '@/components/catalog/CatalogGrid';
import { resolveProductDesignDisplayName } from '@/lib/products/design-display-name';
import Image from 'next/image';

type ProductDesignSectionProps = {
  id: string;
  icon?: React.ReactNode;
  title?: string;
  hint?: string;
  product: Product;
  size?: string;
  designs: ProductDesignTemplate[];
  limit?: number;
  seeAllHref?: string;
  seeAllLabel?: string;
  /** Hide the section heading when the parent page already provides one. */
  showHeader?: boolean;
  /** When set, all design previews follow this filter color. */
  colorFilter?: string | 'all';
};

export function ProductDesignSection({
  id,
  icon,
  title,
  hint,
  product,
  size,
  designs,
  limit,
  seeAllHref,
  seeAllLabel,
  showHeader = true,
  colorFilter = 'all',
}: ProductDesignSectionProps) {
  const visibleDesigns = limit ? designs.slice(0, limit) : designs;
  const showSeeAll = Boolean(seeAllHref && limit && designs.length > limit);

  return (
    <section id={id} className="scroll-mt-28">
      {showHeader && title ? (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            {icon}
            <div>
              <h2 className="text-2xl font-bold text-ink-900">{title}</h2>
              {hint ? <p className="text-ink-500">{hint}</p> : null}
            </div>
          </div>
          {showSeeAll ? (
            <Link
              href={seeAllHref!}
              className="shrink-0 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              {seeAllLabel} →
            </Link>
          ) : null}
        </div>
      ) : null}

      <CatalogGridLayout>
        {visibleDesigns.map((design) => (
          <DesignCard
            key={design.id}
            product={product}
            design={design}
            size={size}
            colorFilter={colorFilter}
          />
        ))}
      </CatalogGridLayout>

      {showSeeAll ? (
        <div className="mt-6 flex justify-center sm:hidden">
          <Link href={seeAllHref!} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full">
              {seeAllLabel}
            </Button>
          </Link>
        </div>
      ) : null}
    </section>
  );
}

function resolveCardColor(
  design: ProductDesignTemplate,
  product: Product,
  applicableColors: string[],
  colorFilter: string | 'all',
): string {
  if (colorFilter !== 'all') {
    const matched = applicableColors.find(
      (value) => normalizeHex(value) === normalizeHex(colorFilter),
    );
    if (matched) return matched;
  }
  return resolveDesignPreviewColor(design, product);
}

function DesignCard({
  product,
  design,
  size,
  colorFilter,
}: {
  product: Product;
  design: ProductDesignTemplate;
  size?: string;
  colorFilter: string | 'all';
}) {
  const previewRef = useRef<HTMLDivElement>(null);
  const applicableColors = useMemo(
    () => getDesignApplicableColors(design, product),
    [design, product],
  );
  const [color, setColor] = useState(() =>
    resolveCardColor(design, product, applicableColors, colorFilter),
  );

  useEffect(() => {
    setColor(resolveCardColor(design, product, applicableColors, colorFilter));
  }, [applicableColors, colorFilter, design, product]);

  const previewColor = resolveDesignPreviewColor(design, product, color);

  const t = useTranslations('products');
  const td = useTranslations('products.detail');
  const tp = useTranslations('products.types');
  const ti = useTranslations('products.items');
  const locale = useLocale() as 'mk' | 'en';
  const productLabel = product.nameKey
    ? ti(product.nameKey)
    : tp(product.type);
  const displayName = resolveProductDesignDisplayName(design, locale, (key) =>
    t(key),
  );

  const canQuickOrder =
    isImageDesignTemplate(design) || isOverlayDesignTemplate(design);

  return (
    <Card className="overflow-hidden p-0">
      <div ref={previewRef}>
        {isTextDesignTemplate(design) || isOverlayDesignTemplate(design) ? (
          <DesignTemplatePreview
            product={product}
            color={color}
            design={design}
            typeLabel={productLabel}
          />
        ) : isImageDesignTemplate(design) ? (
          <div className="relative aspect-square overflow-hidden bg-white">
            <Image
              src={resolveAssetUrl(design.image!)}
              alt={displayName}
              fill
              sizes="(max-width: 768px) 50vw, 300px"
              className="object-contain p-4"
            />
          </div>
        ) : null}
      </div>

      <div className="space-y-3 p-4">
        <p className="font-medium text-ink-900">
          {displayName}
        </p>
        {isTextDesignTemplate(design) && design.textStyle && (
          <p className="line-clamp-2 whitespace-pre-line text-sm text-ink-500">
            {design.textStyle.text}
          </p>
        )}

        <DesignColorPicker
          colors={applicableColors}
          value={color}
          onChange={setColor}
          variant="compact"
        />

        <div className="border-t border-ink-100 pt-3">
          <div className="flex flex-col gap-2.5">
            {canQuickOrder ? (
              <OrderWithDesignButton
                product={product}
                design={design}
                color={previewColor}
                size={size}
                previewRef={previewRef}
                productLabel={productLabel}
                displayName={displayName}
              />
            ) : (
              <Link
                href={buildCustomizerUrl(product.id, product.type, {
                  design: design.id,
                  color: previewColor,
                  size,
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
                  size,
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

function OrderWithDesignButton({
  product,
  design,
  color,
  size,
  previewRef,
  productLabel,
  displayName,
}: {
  product: Product;
  design: ProductDesignTemplate;
  color: string;
  size?: string;
  previewRef: React.RefObject<HTMLDivElement | null>;
  productLabel: string;
  displayName: string;
}) {
  const td = useTranslations('products.detail');
  const tCustomizer = useTranslations('products.customizer');
  const { addItem } = useCart();
  const router = useRouter();
  const [ordering, setOrdering] = useState(false);

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
          color,
          size,
          name: `${productLabel} — ${displayName}`,
          price: product.basePrice,
          capturedPreview,
        }),
      );
      router.push('/cart');
    } finally {
      setOrdering(false);
    }
  }

  return (
    <Button
      size="sm"
      className="w-full normal-case tracking-normal shadow-none hover:translate-y-0 active:translate-y-0 active:shadow-none"
      onClick={handleOrder}
      loading={ordering}
      disabled={ordering}
    >
      {ordering ? tCustomizer('capturing') : td('orderWithDesign')}
    </Button>
  );
}
