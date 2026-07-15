'use client';

import { useMemo, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import {
  isImageDesignTemplate,
  isOverlayDesignTemplate,
  isTextDesignTemplate,
  type ProductDesignTemplate,
} from '@/lib/data/catalog';
import { getCouplePackPartnerDesign } from '@/lib/data/couple-pack';
import { useMergedProductDesignTemplate } from '@/lib/products/use-merged-product-design-template';
import { resolveProductDesignDisplayName } from '@/lib/products/design-display-name';
import {
  getDesignApplicableColors,
  resolveDesignPreviewColor,
} from '@/lib/products/design-applicable-colors';
import {
  getDesignApplicableFits,
  resolveDesignProduct,
  type GarmentFit,
} from '@/lib/products/garment-fit';
import { buildPremadeDesignCartPayload } from '@/lib/products/premade-design-order';
import { capturePreviewElement } from '@/lib/products/capture-preview';
import { buildCustomizerUrl, PRODUCT_OFFERING_PATHS } from '@/lib/products/paths';
import { getProductSpecs } from '@/lib/products/product-specs';
import { formatPrice } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DesignTemplatePreview } from '@/components/products/DesignTemplatePreview';
import { DesignColorPicker } from '@/components/products/DesignColorPicker';
import { GarmentFitSelector } from '@/components/products/GarmentFitSelector';
import { useCart } from '@/components/cart/CartProvider';
import { Reveal } from '@/components/motion/Reveal';
import { ArrowLeft, Leaf, Palette, ShoppingCart, Sparkles } from 'lucide-react';

export function ProductDesignDetail({
  designId,
  initialDesign,
}: {
  designId: string;
  /** Server-resolved merged template (admin overrides applied). */
  initialDesign?: ProductDesignTemplate | null;
}) {
  const t = useTranslations('products');
  const td = useTranslations('products.detail');
  const tdp = useTranslations('products.designPdp');
  const tp = useTranslations('products.types');
  const tCustomizer = useTranslations('products.customizer');
  const locale = useLocale();
  const router = useRouter();
  const { addItem } = useCart();
  const previewRef = useRef<HTMLDivElement>(null);
  const [ordering, setOrdering] = useState(false);

  const mergedDesign = useMergedProductDesignTemplate(designId, initialDesign);

  const resolved = useMemo(() => {
    const coupleMatch = getCouplePackPartnerDesign(designId);
    // Prefer merged (admin) template; fall back to static couple partner design.
    const effectiveDesign = mergedDesign ?? coupleMatch?.design ?? null;
    if (!effectiveDesign) return null;

    const applicableFits = getDesignApplicableFits(effectiveDesign);
    const initialFit = applicableFits[0] ?? 'unisex';
    const product = resolveDesignProduct(effectiveDesign, initialFit);
    return {
      design: effectiveDesign,
      product,
      couplePack: coupleMatch?.pack ?? null,
      applicableFits,
      initialFit,
    };
  }, [designId, mergedDesign]);

  const [garmentFit, setGarmentFit] = useState<GarmentFit>(
    () => resolved?.initialFit ?? 'unisex',
  );
  const product = useMemo(() => {
    if (!resolved) return null;
    return resolveDesignProduct(resolved.design, garmentFit);
  }, [resolved, garmentFit]);

  const [color, setColor] = useState(() => {
    if (!resolved) return '#c5ccd6';
    return resolveDesignPreviewColor(resolved.design, resolved.product);
  });
  const [size, setSize] = useState(
    () => product?.sizes?.[0] ?? resolved?.product.sizes?.[0] ?? '',
  );

  if (!resolved || !product) {
    return <p>{td('notFound')}</p>;
  }

  const { design, applicableFits } = resolved;
  const displayName = resolveProductDesignDisplayName(design, locale as 'mk' | 'en', (key) =>
    t(key),
  );
  const applicableColors = getDesignApplicableColors(design, product);
  const previewColor = resolveDesignPreviewColor(design, product, color);
  const specs = getProductSpecs(product.type);
  const fitLabelKey =
    product.fit === 'women'
      ? 'fittedWomenFit'
      : product.fit === 'kids'
        ? 'kidsFit'
        : specs?.fitKey ?? 'regularFit';
  const canQuickOrder =
    isImageDesignTemplate(design) || isOverlayDesignTemplate(design);

  function handleGarmentFitChange(nextFit: GarmentFit) {
    setGarmentFit(nextFit);
    const nextProduct = resolveDesignProduct(design, nextFit);
    const nextColors = getDesignApplicableColors(design, nextProduct);
    setColor(
      resolveDesignPreviewColor(
        design,
        nextProduct,
        nextColors.includes(color) ? color : undefined,
      ),
    );
    setSize(nextProduct.sizes?.[0] ?? '');
  }

  const customizeHref = buildCustomizerUrl(product.id, product.type, {
    design: design.id,
    color: previewColor,
    size: size || undefined,
    fit: garmentFit,
  });

  async function handleAddToCart() {
    if (!product) return;

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
          size: size || undefined,
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

  return (
    <div className="space-y-10 pb-24 lg:pb-0">
      <Link
        href={PRODUCT_OFFERING_PATHS.readyDesigns}
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 transition hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {tdp('backToReadyDesigns')}
      </Link>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <Reveal>
          <Card className="overflow-hidden p-4 sm:p-6">
            <div ref={previewRef}>
              {isTextDesignTemplate(design) || isOverlayDesignTemplate(design) ? (
                <DesignTemplatePreview
                  product={product}
                  color={color}
                  design={design}
                  typeLabel={tp(product.type)}
                />
              ) : isImageDesignTemplate(design) && design.image ? (
                <div className="relative aspect-square overflow-hidden bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={design.image}
                    alt={displayName}
                    className="h-full w-full object-contain p-4"
                  />
                </div>
              ) : null}
            </div>
          </Card>
        </Reveal>

        <Reveal delay={100}>
          <div className="flex flex-col gap-6">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-medium text-ink-700">
                  {tp(product.type)}
                </span>
                {design.collection ? (
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                    {design.collection}
                  </span>
                ) : null}
              </div>
              <h1 className="mt-3 text-3xl font-bold text-ink-900">{displayName}</h1>
              <p className="mt-2 text-2xl font-semibold text-brand-600">
                {formatPrice(product.basePrice, locale)}
              </p>
            </div>

            <GarmentFitSelector
              fits={applicableFits}
              value={garmentFit}
              onChange={handleGarmentFitChange}
            />

            {applicableColors.length > 1 ? (
              <DesignColorPicker
                colors={applicableColors}
                value={color}
                onChange={setColor}
                variant="default"
              />
            ) : null}

            {product.sizes ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-ink-700">
                  {t('customizer.selectSize')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSize(value)}
                      className={`min-h-10 min-w-10 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        size === value
                          ? 'bg-brand-600 text-white'
                          : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              {canQuickOrder ? (
                <Button
                  className="flex-1 normal-case tracking-normal"
                  onClick={handleAddToCart}
                  loading={ordering}
                  disabled={ordering}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {ordering ? tCustomizer('capturing') : tdp('addToCart')}
                </Button>
              ) : null}
              <Link href={customizeHref} className={canQuickOrder ? 'flex-1' : 'w-full'}>
                <Button
                  variant={canQuickOrder ? 'outline' : 'primary'}
                  className="w-full normal-case tracking-normal"
                >
                  <Palette className="mr-2 h-4 w-4" />
                  {isTextDesignTemplate(design)
                    ? td('customizeWithPhoto')
                    : tdp('customizeButton')}
                </Button>
              </Link>
            </div>

            {specs ? (
              <Card className="space-y-4 p-5">
                <h2 className="text-lg font-semibold text-ink-900">
                  {tdp('productSpecs')}
                </h2>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4 border-b border-ink-100 pb-3">
                    <dt className="text-ink-500">{tdp('material')}</dt>
                    <dd className="font-medium text-ink-900">
                      {tdp(`specs.${specs.materialKey}`)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-ink-100 pb-3">
                    <dt className="text-ink-500">{tdp('fit')}</dt>
                    <dd className="font-medium text-ink-900">
                      {tdp(`specs.${fitLabelKey}`)}
                    </dd>
                  </div>
                  {specs.careKey ? (
                    <div className="flex justify-between gap-4 border-b border-ink-100 pb-3">
                      <dt className="text-ink-500">{tdp('care')}</dt>
                      <dd className="font-medium text-ink-900">
                        {tdp(`specs.${specs.careKey}`)}
                      </dd>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-2 pt-1 text-emerald-700">
                    <Leaf className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="text-sm font-medium">
                      {tdp(`specs.${specs.ecoFriendlyKey}`)}
                    </span>
                  </div>
                </dl>
              </Card>
            ) : null}

            {isTextDesignTemplate(design) && design.textStyle ? (
              <Card className="p-5">
                <h2 className="mb-2 text-sm font-medium text-ink-500">
                  {tdp('designText')}
                </h2>
                <p className="whitespace-pre-line text-ink-800">
                  {design.textStyle.text}
                </p>
              </Card>
            ) : null}
          </div>
        </Reveal>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg gap-2">
          {canQuickOrder ? (
            <Button
              className="flex-1 normal-case tracking-normal"
              onClick={handleAddToCart}
              loading={ordering}
              disabled={ordering}
            >
              <ShoppingCart className="mr-1.5 h-4 w-4" />
              {tdp('addToCart')}
            </Button>
          ) : null}
          <Link href={customizeHref} className="flex-1">
            <Button
              variant={canQuickOrder ? 'outline' : 'primary'}
              className="w-full normal-case tracking-normal"
            >
              <Sparkles className="mr-1.5 h-4 w-4" />
              {tdp('customizeButton')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
