'use client';

import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import {
  resolveDesignProduct,
  type ProductDesignCatalogEntry,
} from '@/lib/products/design-catalog';
import {
  isImageDesignTemplate,
  isOverlayDesignTemplate,
  isTextDesignTemplate,
  type Product,
  type ProductDesignTemplate,
  type ProductType,
} from '@/lib/data/catalog';
import { resolveAssetUrl } from '@/lib/storage/asset-url';
import { resolveProductDesignDisplayName } from '@/lib/products/design-display-name';
import {
  getDesignApplicableColors,
  pickVariedDesignPreviewColor,
  resolveDesignPreviewColor,
} from '@/lib/products/design-applicable-colors';
import {
  getDesignSideMode,
  isDualSidedDesign,
} from '@/lib/products/design-sides';
import { normalizeHex } from '@/lib/products/design-overlay';
import { buildPremadeDesignCartPayload } from '@/lib/products/premade-design-order';
import { capturePreviewElement } from '@/lib/products/capture-preview';
import { captureDrinkware3DPreviews } from '@/components/products/customizer/Drinkware3DCapture';
import {
  getOverlayPrintBounds,
  getProductMockupLayout,
  shouldUseDrinkwareWrapDesignPreviewForTemplate,
} from '@/lib/products/product-mockup-layout';
import { sideDesignFromOverlayTemplate } from '@/lib/products/design-state';
import { buildCustomizerUrl, buildDesignDetailUrl } from '@/lib/products/paths';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/components/cart/CartProvider';
import { DesignTemplatePreview } from '@/components/products/DesignTemplatePreview';
import { DesignColorPicker } from '@/components/products/DesignColorPicker';
import {
  getCatalogItemClassName,
  useOptionalCatalogGrid,
} from '@/components/catalog/CatalogGrid';
import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';

type ProductDesignCatalogCardProps = {
  entry: ProductDesignCatalogEntry;
  colorFilter: string | 'all';
  /** Hash design id across applicable colors so grids aren't all the same tee. */
  varyInitialColor?: boolean;
  /**
   * When browsing a type-scoped catalog (e.g. /products/type/hoodie), prefer
   * that garment for previews and design PDP links instead of productTypes[0].
   */
  preferredProductType?: ProductType;
  /** Lock mockup/order to a specific catalog product (e.g. product /designs page). */
  preferredProductId?: string;
};

function resolvePreviewColorForFilter(
  design: ProductDesignTemplate,
  product: Product,
  applicableColors: string[],
  colorFilter: string | 'all',
  varyInitialColor = false,
): string {
  if (colorFilter !== 'all') {
    const matched = applicableColors.find(
      (value) => normalizeHex(value) === normalizeHex(colorFilter),
    );
    if (matched) return matched;
  }
  if (varyInitialColor) {
    return pickVariedDesignPreviewColor(design, product);
  }
  return resolveDesignPreviewColor(design, product);
}

export function ProductDesignCatalogCard({
  entry,
  colorFilter,
  varyInitialColor = false,
  preferredProductType,
  preferredProductId,
}: ProductDesignCatalogCardProps) {
  const t = useTranslations('products');
  const locale = useLocale() as 'mk' | 'en';
  const tc = useTranslations('products.catalog');
  const tp = useTranslations('products.types');
  const td = useTranslations('products.detail');
  const tCustomizer = useTranslations('products.customizer');
  const { addItem } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  const grid = useOptionalCatalogGrid();
  const previewRef = useRef<HTMLDivElement>(null);
  const [ordering, setOrdering] = useState(false);
  const [revealBack, setRevealBack] = useState(false);
  const [touchPinned, setTouchPinned] = useState(false);

  const { product } = resolveDesignProduct(
    entry,
    colorFilter,
    preferredProductType,
    preferredProductId,
  );
  const { design } = entry;
  const displayName = resolveProductDesignDisplayName(design, locale, (key) =>
    t(key),
  );
  const isDualSided = isDualSidedDesign(design);

  const applicableColors = useMemo(
    () => getDesignApplicableColors(design, product),
    [design, product],
  );

  const [color, setColor] = useState(() =>
    resolvePreviewColorForFilter(
      design,
      product,
      applicableColors,
      colorFilter,
      varyInitialColor,
    ),
  );

  useEffect(() => {
    setColor(
      resolvePreviewColorForFilter(
        design,
        product,
        applicableColors,
        colorFilter,
        varyInitialColor,
      ),
    );
  }, [applicableColors, colorFilter, design, product, varyInitialColor]);

  useEffect(() => {
    setRevealBack(false);
    setTouchPinned(false);
  }, [design.id]);

  const previewColor = resolveDesignPreviewColor(design, product, color);
  const canQuickOrder =
    isImageDesignTemplate(design) || isOverlayDesignTemplate(design);

  async function handleOrder() {
    setOrdering(true);
    try {
      let capturedPreview: string | undefined;
      let capturedSidePreviews:
        | { leftDesignPreview: string; rightDesignPreview: string }
        | undefined;

      const mockupSide = isDualSided ? 'front' : design.defaultSide ?? 'front';
      const useDrinkwareWrap3D =
        isOverlayDesignTemplate(design) &&
        shouldUseDrinkwareWrapDesignPreviewForTemplate(
          product,
          design,
          mockupSide,
        );

      if (useDrinkwareWrap3D) {
        const sideDesign = sideDesignFromOverlayTemplate(
          design,
          product,
          previewColor,
          mockupSide,
        );
        if (sideDesign) {
          const mockupLayout = getProductMockupLayout(product);
          const drinkware3D = await captureDrinkware3DPreviews({
            productType: product.type,
            productId: product.id,
            productColor: previewColor,
            sideDesign,
            designTemplate: design,
            textLayers: sideDesign.textLayers,
            printBounds: getOverlayPrintBounds(mockupLayout),
          });
          if (drinkware3D?.left && drinkware3D?.right) {
            capturedSidePreviews = {
              leftDesignPreview: drinkware3D.left,
              rightDesignPreview: drinkware3D.right,
            };
          }
        }
      }

      if (!capturedSidePreviews && previewRef.current) {
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
          capturedSidePreviews,
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
    returnTo,
  });
  const detailHref = buildDesignDetailUrl(design.id, {
    type: product.type,
    returnTo,
  });

  function setHoverReveal(next: boolean) {
    if (!isDualSided || touchPinned) return;
    setRevealBack(next);
  }

  function toggleTouchReveal(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!isDualSided) return;
    setTouchPinned((prev) => {
      const next = !prev;
      setRevealBack(next);
      return next;
    });
  }

  return (
    <Card
      className={cn(
        'group flex h-full flex-col overflow-hidden p-0 transition hover:border-brand-200 hover:shadow-md',
        getCatalogItemClassName(grid),
      )}
    >
      <div className="relative flex flex-1 flex-col">
        <div
          className="relative"
          onMouseEnter={() => setHoverReveal(true)}
          onMouseLeave={() => setHoverReveal(false)}
        >
          <Link
            href={detailHref}
            prefetch={false}
            className="block outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
            onFocus={() => setHoverReveal(true)}
            onBlur={() => {
              if (!touchPinned) setRevealBack(false);
            }}
          >
            {isTextDesignTemplate(design) || isOverlayDesignTemplate(design) ? (
              <>
                <div
                  ref={previewRef}
                  className={cn(
                    'transition-opacity duration-200',
                    isDualSided && revealBack && 'opacity-0',
                  )}
                  aria-hidden={isDualSided && revealBack ? true : undefined}
                >
                  <DesignTemplatePreview
                    product={product}
                    color={color}
                    design={design}
                    typeLabel={tp(product.type)}
                    side={isDualSided ? 'front' : undefined}
                  />
                </div>
                {isDualSided ? (
                  <div
                    className={cn(
                      'pointer-events-none absolute inset-0 transition-opacity duration-200',
                      revealBack ? 'opacity-100' : 'opacity-0',
                    )}
                    aria-hidden={!revealBack}
                  >
                    <DesignTemplatePreview
                      product={product}
                      color={color}
                      design={design}
                      typeLabel={tp(product.type)}
                      side="back"
                    />
                  </div>
                ) : null}
              </>
            ) : isImageDesignTemplate(design) ? (
              <div
                ref={previewRef}
                className="relative aspect-square overflow-hidden bg-white"
              >
                <Image
                  src={resolveAssetUrl(design.image!)}
                  alt={displayName}
                  fill
                  sizes="(max-width: 768px) 50vw, 320px"
                  className="object-contain p-4 transition group-hover:scale-[1.02]"
                />
              </div>
            ) : null}
          </Link>

          {isDualSided ? (
            <button
              type="button"
              onClick={toggleTouchReveal}
              aria-pressed={revealBack}
              aria-label={tc('dualSidedToggle')}
              className={cn(
                'absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-md bg-white/95 px-2 py-1 text-[11px] font-semibold text-ink-800 shadow-sm ring-1 ring-ink-200/80 backdrop-blur-sm transition',
                'hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                revealBack && 'bg-brand-50 text-brand-800 ring-brand-200',
              )}
            >
              <RefreshCw className="h-3 w-3" aria-hidden />
              <span>{tc('dualSidedBadge')}</span>
            </button>
          ) : null}
        </div>

        <Link
          href={detailHref}
          prefetch={false}
          className="flex flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
        >
          <div className="flex flex-1 flex-col gap-3 p-4 pb-3">
            <div className="flex flex-wrap gap-1.5">
              {(preferredProductType
                ? design.productTypes.filter((productType) => productType === preferredProductType)
                : design.productTypes
              ).map((productType) => (
                <span
                  key={productType}
                  className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-700"
                >
                  {tp(productType)}
                </span>
              ))}
              {!isDualSided ? (
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
                  {getDesignSideMode(design) === 'back'
                    ? tc('sideBack')
                    : tc('sideFront')}
                </span>
              ) : null}
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
      </div>

      <div className="flex flex-col gap-2 px-4 pb-4">
        <DesignColorPicker
          colors={applicableColors}
          value={color}
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
              <Link href={customizeHref} prefetch={false}>
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
                href={customizeHref}
                prefetch={false}
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
