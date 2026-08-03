'use client';

import { useMemo, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import {
  getCouplePackTemplate,
  partnerDesignToTemplate,
} from '@/lib/data/couple-pack';
import { products, type ProductDesignTemplate } from '@/lib/data/catalog';
import {
  getDesignApplicableColors,
  resolveDesignPreviewColor,
} from '@/lib/products/design-applicable-colors';
import {
  buildCouplePackCartItems,
  getCouplePackPrice,
} from '@/lib/products/couple-pack-order';
import { capturePreviewElement } from '@/lib/products/capture-preview';
import { PRODUCT_OFFERING_PATHS } from '@/lib/products/paths';
import { getProductSpecs } from '@/lib/products/product-specs';
import { useMergedProductDesignTemplate } from '@/lib/products/use-merged-product-design-template';
import { formatPrice } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArchiveBackLink } from '@/components/products/ArchiveBackLink';
import { DesignTemplatePreview } from '@/components/products/DesignTemplatePreview';
import { DesignColorPicker } from '@/components/products/DesignColorPicker';
import { useCart } from '@/components/cart/CartProvider';
import { Reveal } from '@/components/motion/Reveal';
import { Heart, Leaf, ShoppingCart } from 'lucide-react';

export function CouplePackDetail({
  packId,
  initialDesign1,
  initialDesign2,
}: {
  packId: string;
  /** Server-merged partner templates (admin overlay placement applied). */
  initialDesign1?: ProductDesignTemplate | null;
  initialDesign2?: ProductDesignTemplate | null;
}) {
  const t = useTranslations('products');
  const td = useTranslations('products.detail');
  const tdp = useTranslations('products.designPdp');
  const tc = useTranslations('products.couplePacks');
  const tCustomizer = useTranslations('products.customizer');
  const locale = useLocale();
  const router = useRouter();
  const { addItem } = useCart();
  const preview1Ref = useRef<HTMLDivElement>(null);
  const preview2Ref = useRef<HTMLDivElement>(null);
  const [ordering, setOrdering] = useState(false);

  const pack = getCouplePackTemplate(packId);
  const partner1 = pack?.partnerDesigns[0];
  const partner2 = pack?.partnerDesigns[1];

  const staticDesign1 =
    pack && partner1 ? partnerDesignToTemplate(pack, partner1) : null;
  const staticDesign2 =
    pack && partner2 ? partnerDesignToTemplate(pack, partner2) : null;

  const design1 = useMergedProductDesignTemplate(
    partner1?.designId,
    initialDesign1 ?? staticDesign1,
  );
  const design2 = useMergedProductDesignTemplate(
    partner2?.designId,
    initialDesign2 ?? staticDesign2,
  );

  const product = useMemo(() => {
    if (!pack) return null;
    return (
      products.find((item) => pack.productTypes.includes(item.type)) ??
      products.find((item) => item.id === 'tshirt-unisex') ??
      null
    );
  }, [pack]);

  const [partner1Color, setPartner1Color] = useState(() => {
    if (!pack || !product || !staticDesign1) return '#ffffff';
    return resolveDesignPreviewColor(
      staticDesign1,
      product,
      pack.recommendedColor,
    );
  });
  const [partner2Color, setPartner2Color] = useState(() => {
    if (!pack || !product || !staticDesign2) return '#ffffff';
    return resolveDesignPreviewColor(
      staticDesign2,
      product,
      pack.recommendedColor,
    );
  });
  const [partner1Size, setPartner1Size] = useState(product?.sizes?.[0] ?? '');
  const [partner2Size, setPartner2Size] = useState(product?.sizes?.[0] ?? '');
  const [sharedSize, setSharedSize] = useState(true);

  if (!pack || !product || !partner1 || !partner2 || !design1 || !design2) {
    return <p>{td('notFound')}</p>;
  }

  const partner1Colors = getDesignApplicableColors(design1, product);
  const partner2Colors = getDesignApplicableColors(design2, product);
  const previewColor1 = resolveDesignPreviewColor(
    design1,
    product,
    partner1Color,
  );
  const previewColor2 = resolveDesignPreviewColor(
    design2,
    product,
    partner2Color,
  );
  const specs = getProductSpecs(product.type);
  const title = locale === 'mk' ? pack.titleMk : pack.titleEn;
  const packPrice = getCouplePackPrice(product, pack, [design1, design2]);
  const partner1Label = locale === 'mk' ? partner1.labelMk : partner1.labelEn;
  const partner2Label = locale === 'mk' ? partner2.labelMk : partner2.labelEn;
  const showColorPickers =
    partner1Colors.length > 1 || partner2Colors.length > 1;

  async function handleAddCouplePack() {
    if (!pack || !product || !design1 || !design2) return;

    setOrdering(true);
    try {
      const previews: [string | undefined, string | undefined] = [
        undefined,
        undefined,
      ];
      if (preview1Ref.current) {
        previews[0] = await capturePreviewElement(preview1Ref.current);
      }
      if (preview2Ref.current) {
        previews[1] = await capturePreviewElement(preview2Ref.current);
      }

      const items = buildCouplePackCartItems({
        pack,
        product,
        partner1Color: previewColor1,
        partner2Color: previewColor2,
        partner1Size,
        partner2Size: sharedSize ? partner1Size : partner2Size,
        name: title,
        capturedPreviews: previews,
        designs: [design1, design2],
      });

      for (const item of items) {
        addItem(item);
      }
      router.push('/cart');
    } finally {
      setOrdering(false);
    }
  }

  return (
    <div className="space-y-10 pb-24 lg:pb-0">
      <ArchiveBackLink
        fallbackHref={PRODUCT_OFFERING_PATHS.couplesReadyDesigns}
        label={tdp('backToReadyDesigns')}
        className="hover:text-brand-600"
      />

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <Reveal>
          <div className="grid grid-cols-2 gap-3">
            <Card className="overflow-hidden p-2">
              <p className="mb-2 text-center text-xs font-medium text-ink-500">
                {partner1Label}
              </p>
              <div ref={preview1Ref}>
                <DesignTemplatePreview
                  product={product}
                  color={previewColor1}
                  design={design1}
                  typeLabel={partner1.labelEn}
                />
              </div>
            </Card>
            <Card className="overflow-hidden p-2">
              <p className="mb-2 text-center text-xs font-medium text-ink-500">
                {partner2Label}
              </p>
              <div ref={preview2Ref}>
                <DesignTemplatePreview
                  product={product}
                  color={previewColor2}
                  design={design2}
                  typeLabel={partner2.labelEn}
                />
              </div>
            </Card>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="flex flex-col gap-6">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700">
                <Heart className="h-3.5 w-3.5" aria-hidden />
                {tc('badge')}
              </span>
              <h1 className="mt-3 text-3xl font-bold text-ink-900">{title}</h1>
              <p className="mt-2 text-2xl font-semibold text-brand-600">
                {formatPrice(packPrice, locale)}
              </p>
              <p className="mt-2 text-sm text-ink-500">{tc('packIncludes')}</p>
            </div>

            {showColorPickers ? (
              <div className="space-y-4">
                <p className="text-xs text-ink-500">{tc('independentColorHint')}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {partner1Colors.length > 1 ? (
                    <DesignColorPicker
                      colors={partner1Colors}
                      value={previewColor1}
                      onChange={setPartner1Color}
                      variant="default"
                      label={tc('partnerColor', { partner: partner1Label })}
                    />
                  ) : null}
                  {partner2Colors.length > 1 ? (
                    <DesignColorPicker
                      colors={partner2Colors}
                      value={previewColor2}
                      onChange={setPartner2Color}
                      variant="default"
                      label={tc('partnerColor', { partner: partner2Label })}
                    />
                  ) : null}
                </div>
              </div>
            ) : null}

            {product.sizes ? (
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={sharedSize}
                    onChange={(event) => setSharedSize(event.target.checked)}
                    className="rounded border-ink-300 text-brand-600"
                  />
                  <span className="font-medium text-ink-700">{tc('sameSize')}</span>
                </label>

                {sharedSize ? (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-ink-700">
                      {t('customizer.selectSize')}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setPartner1Size(value)}
                          className={`min-h-10 min-w-10 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                            partner1Size === value
                              ? 'bg-brand-600 text-white'
                              : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-ink-700">
                        {tc('partner1Size')}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setPartner1Size(value)}
                            className={`min-h-10 min-w-10 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                              partner1Size === value
                                ? 'bg-brand-600 text-white'
                                : 'bg-ink-100 text-ink-600'
                            }`}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-ink-700">
                        {tc('partner2Size')}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map((value) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setPartner2Size(value)}
                            className={`min-h-10 min-w-10 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                              partner2Size === value
                                ? 'bg-brand-600 text-white'
                                : 'bg-ink-100 text-ink-600'
                            }`}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            <Button
              className="w-full normal-case tracking-normal sm:w-auto"
              onClick={handleAddCouplePack}
              loading={ordering}
              disabled={ordering}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {ordering ? tCustomizer('capturing') : tc('addCouplePack')}
            </Button>

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
                      {tdp(`specs.${specs.fitKey}`)}
                    </dd>
                  </div>
                  <div className="flex items-center gap-2 pt-1 text-emerald-700">
                    <Leaf className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="text-sm font-medium">
                      {tdp(`specs.${specs.ecoFriendlyKey}`)}
                    </span>
                  </div>
                </dl>
              </Card>
            ) : null}
          </div>
        </Reveal>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <Button
          className="mx-auto w-full max-w-lg normal-case tracking-normal"
          onClick={handleAddCouplePack}
          loading={ordering}
          disabled={ordering}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {tc('addCouplePack')}
        </Button>
      </div>
    </div>
  );
}
