'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { flushSync } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Pencil,
  ShoppingCart,
  Upload,
} from 'lucide-react';
import { useCart } from '@/components/cart/CartProvider';
import { useUploadSession } from '@/hooks/useUploadSession';
import { ProductPhotoUpload } from '@/components/products/ProductPhotoUpload';
import { BrandingPackMockup } from '@/components/products/branding-pack/BrandingPackMockup';
import { BrandingPackQuantityInput } from '@/components/products/branding-pack/BrandingPackQuantityInput';
import { BrandingPackStepNav } from '@/components/products/branding-pack/BrandingPackStepNav';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn, formatPrice } from '@/lib/utils';
import { getProductById } from '@/lib/cart/product-cart';
import { getProductMockup, type ProductSide } from '@/lib/data/catalog';
import {
  BRANDING_PACK_WIZARD_STEPS,
  calculateBrandingPackTotal,
  clampSizeSelectionsToColorTotal,
  createDefaultBrandingPackState,
  createDefaultSidePlacements,
  formatBrandingPackSizeBreakdown,
  getAvailablePrintSides,
  getBrandingPackLineItems,
  getMaxSizeQuantityForEntry,
  getProductColorQuantity,
  getProductSizeQuantity,
  getSelectedBrandingPackProducts,
  hydrateBrandingPackLogo,
  productHasMultipleSides,
  type BrandingPackPreviewImage,
  type BrandingPackProductState,
  type BrandingPackState,
  type BrandingPackWizardStep,
} from '@/lib/products/branding-pack-state';
import type { BrandingPackProductType } from '@/lib/products/branding-pack-config';
import {
  buildBrandingPackCartPayload,
  createBrandingPackId,
  getBrandingPackStateFromCartItem,
} from '@/lib/products/branding-pack-cart';
import {
  clearBrandingPackDraft,
  readBrandingPackDraft,
  writeBrandingPackDraft,
} from '@/lib/drafts/branding-pack-draft';
import type { UploadedFile } from '@/lib/products/design-state';
import {
  capturePreviewElement,
  waitForImages,
  waitForPaint,
} from '@/lib/products/capture-preview';
import { clampPhotoScale } from '@/lib/products/crop-image';
import { getProductColorLabelKey } from '@/lib/products/product-color-labels';

async function waitForCaptureRef(
  ref: RefObject<HTMLDivElement | null>,
): Promise<boolean> {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    await waitForPaint();
    if (ref.current && ref.current.offsetWidth > 0 && ref.current.offsetHeight > 0) {
      return true;
    }
  }
  return false;
}

export function BrandingPackWizard() {
  const t = useTranslations('products.brandingPack');
  const tp = useTranslations('products.types');
  const tc = useTranslations('products.customizer');
  const tColors = useTranslations('products.productColors');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editCartItemId = searchParams.get('edit');
  const { addItem, updateItem, items: cartItems, hydrated: cartHydrated } =
    useCart();
  const {
    token,
    loading: uploadLoading,
    error: uploadError,
    refreshSession,
  } = useUploadSession();

  const [state, setState] = useState<BrandingPackState>(() =>
    createDefaultBrandingPackState(createBrandingPackId()),
  );

  const [step, setStep] = useState<BrandingPackWizardStep>('logo');
  const [customizeIndex, setCustomizeIndex] = useState(0);
  const [activeSide, setActiveSide] = useState<ProductSide>('front');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [captureTarget, setCaptureTarget] = useState<{
    productType: BrandingPackProductType;
    side: ProductSide;
    color: string;
  } | null>(null);

  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cartHydrated || draftLoaded) return;

    if (editCartItemId) {
      const item = cartItems.find((cartItem) => cartItem.id === editCartItemId);
      const fromCart = item ? getBrandingPackStateFromCartItem(item) : null;
      if (fromCart) {
        setState(hydrateBrandingPackLogo(fromCart, token));
      }
      setDraftLoaded(true);
      return;
    }

    const draft = readBrandingPackDraft();
    if (draft) {
      setState(draft.state);
      setStep(draft.step);
      setCustomizeIndex(draft.customizeIndex);
      setActiveSide(draft.activeSide);
    }
    setDraftLoaded(true);
  }, [cartHydrated, cartItems, draftLoaded, editCartItemId]);

  useEffect(() => {
    if (!draftLoaded || editCartItemId) return;

    const timeout = window.setTimeout(() => {
      writeBrandingPackDraft({
        state,
        step,
        customizeIndex,
        activeSide,
        updatedAt: new Date().toISOString(),
      });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [state, step, customizeIndex, activeSide, draftLoaded, editCartItemId]);

  const stepLabels = useMemo(
    (): Record<BrandingPackWizardStep, string> => ({
      logo: t('steps.logo'),
      products: t('steps.products'),
      customize: t('steps.customize'),
      review: t('steps.review'),
      order: t('steps.order'),
    }),
    [t],
  );

  const selectedProducts = useMemo(
    () => getSelectedBrandingPackProducts(state),
    [state],
  );

  const currentCustomizeProduct = selectedProducts[customizeIndex];
  const currentCatalogProduct = currentCustomizeProduct
    ? getProductById(currentCustomizeProduct.productId)
    : undefined;

  const totalPrice = useMemo(() => calculateBrandingPackTotal(state), [state]);

  const getColorLabel = useCallback(
    (color: string) => {
      const key = getProductColorLabelKey(color);
      return key ? tColors(key) : color;
    },
    [tColors],
  );

  const updateProduct = useCallback(
    (
      productType: BrandingPackProductType,
      patch: Partial<BrandingPackProductState>,
    ) => {
      setState((prev) => ({
        ...prev,
        products: prev.products.map((p) =>
          p.productType === productType ? { ...p, ...patch } : p,
        ),
      }));
    },
    [],
  );

  const updateColorQuantity = useCallback(
    (
      productType: BrandingPackProductType,
      color: string,
      quantity: number,
    ) => {
      setState((prev) => ({
        ...prev,
        products: prev.products.map((p) => {
          if (p.productType !== productType) return p;
          const withColors = {
            ...p,
            colorSelections: p.colorSelections.map((sel) =>
              sel.color === color
                ? { ...sel, quantity: Math.max(0, quantity) }
                : sel,
            ),
          };
          return clampSizeSelectionsToColorTotal(withColors);
        }),
      }));
    },
    [],
  );

  const updateSizeQuantity = useCallback(
    (
      productType: BrandingPackProductType,
      size: string,
      quantity: number,
    ) => {
      setState((prev) => ({
        ...prev,
        products: prev.products.map((p) => {
          if (p.productType !== productType) return p;
          const maxForSize = getMaxSizeQuantityForEntry(p, size);
          const clampedQuantity = Math.min(Math.max(0, quantity), maxForSize);
          return {
            ...p,
            sizeSelections: p.sizeSelections.map((sel) =>
              sel.size === size
                ? { ...sel, quantity: clampedQuantity }
                : sel,
            ),
          };
        }),
      }));
    },
    [],
  );

  const togglePrintSide = useCallback(
    (productType: BrandingPackProductType, side: ProductSide) => {
      setState((prev) => ({
        ...prev,
        products: prev.products.map((p) => {
          if (p.productType !== productType) return p;
          const has = p.printSides.includes(side);
          const printSides = has
            ? p.printSides.filter((s) => s !== side)
            : [...p.printSides, side];
          const sidePlacements = { ...p.sidePlacements };
          if (!has && !sidePlacements[side]) {
            const defaults = createDefaultSidePlacements(productType);
            sidePlacements[side] = defaults[side] ?? defaults.front!;
          }
          return { ...p, printSides, sidePlacements };
        }),
      }));
    },
    [],
  );

  function handleLogoUpload(fileId: string, name: string, previewUrl: string) {
    const uploaded: UploadedFile = {
      fileId,
      name,
      previewUrl,
      isImage: true,
    };
    setState((prev) => ({ ...prev, logo: uploaded }));
    setError(null);
  }

  function goToStep(next: BrandingPackWizardStep) {
    setError(null);
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleStepNavClick(target: BrandingPackWizardStep) {
    if (target === step) return;

    if (target === 'customize') {
      setCustomizeIndex(0);
      const first = selectedProducts[0];
      setActiveSide(first?.printSides[0] ?? 'front');
    }

    goToStep(target);
  }

  function validateLogoStep(): boolean {
    if (!state.logo?.previewUrl) {
      setError(t('logoRequired'));
      return false;
    }
    return true;
  }

  function validateProductsStep(): boolean {
    if (selectedProducts.length === 0) {
      setError(t('selectColorQty'));
      return false;
    }
    for (const product of selectedProducts) {
      if (product.printSides.length === 0) {
        setError(t('selectPrintSide'));
        return false;
      }

      const catalog = getProductById(product.productId);
      if (catalog?.sizes?.length) {
        const colorTotal = getProductColorQuantity(product);
        const sizeTotal = getProductSizeQuantity(product);
        if (sizeTotal === 0) {
          setError(t('selectSizeQty'));
          return false;
        }
        if (colorTotal !== sizeTotal) {
          setError(t('sizeColorQtyMismatch'));
          return false;
        }
      }
    }
    return true;
  }

  function editProductFromReview(
    productType: BrandingPackProductType,
    side?: ProductSide,
  ) {
    const index = selectedProducts.findIndex((p) => p.productType === productType);
    if (index < 0) return;
    setCustomizeIndex(index);
    setActiveSide(
      side ?? selectedProducts[index]?.printSides[0] ?? 'front',
    );
    goToStep('customize');
  }

  async function capturePreview(
    productType: BrandingPackProductType,
    side: ProductSide,
    color: string,
    ref: RefObject<HTMLDivElement | null>,
  ): Promise<string | undefined> {
    flushSync(() => setCaptureTarget({ productType, side, color }));
    const ready = await waitForCaptureRef(ref);
    if (!ready || !ref.current) return undefined;
    await waitForImages(ref.current);
    return capturePreviewElement(ref.current, { backgroundColor: '#ffffff' });
  }

  async function buildPreviewImages(): Promise<BrandingPackPreviewImage[]> {
    const images: BrandingPackPreviewImage[] = [];

    for (const product of selectedProducts) {
      const previewColor =
        product.colorSelections.find((c) => c.quantity > 0)?.color ??
        product.previewColor;

      for (const side of product.printSides) {
        const dataUrl = await capturePreview(
          product.productType,
          side,
          previewColor,
          captureRef,
        );
        if (dataUrl) {
          images.push({
            productType: product.productType,
            side,
            color: previewColor,
            dataUrl,
          });
        }
      }
    }

    flushSync(() => setCaptureTarget(null));
    return images;
  }

  async function handleNextFromCustomize() {
    if (customizeIndex < selectedProducts.length - 1) {
      setCustomizeIndex((i) => i + 1);
      const next = selectedProducts[customizeIndex + 1];
      setActiveSide(next?.printSides[0] ?? 'front');
      return;
    }

    setCustomizeIndex(0);
    goToStep('review');
  }

  async function handleAddToCart() {
    if (!state.logo) {
      setError(t('logoRequired'));
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      let finalState = state;
      if (!finalState.previewImages?.length) {
        const previewImages = await buildPreviewImages();
        finalState = { ...finalState, previewImages };
        setState(finalState);
      }

      const payload = buildBrandingPackCartPayload({
        state: finalState,
        packLabel: t('packName'),
      });

      if (editCartItemId) {
        updateItem(editCartItemId, payload);
      } else {
        addItem(payload);
        clearBrandingPackDraft();
      }

      router.push('/cart');
    } finally {
      setProcessing(false);
      setCaptureTarget(null);
    }
  }

  const captureProductState = captureTarget
    ? state.products.find((p) => p.productType === captureTarget.productType)
    : null;
  const captureCatalogProduct = captureProductState
    ? getProductById(captureProductState.productId)
    : null;

  function renderLogoStep() {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-ink-900">{t('logoTitle')}</h2>
        <p className="mt-1 text-sm text-ink-500">{t('logoHint')}</p>
        <div className="mt-4">
          <ProductPhotoUpload
            token={token}
            uploadLoading={uploadLoading}
            uploadError={uploadError}
            refreshSession={refreshSession}
            hasPhoto={Boolean(state.logo)}
            previewUrl={state.logo?.previewUrl}
            skipCrop
            onUploadComplete={handleLogoUpload}
          />
        </div>
        {state.logo?.previewUrl ? (
          <div className="mt-6 flex justify-center rounded-xl border border-ink-100 bg-ink-50 p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={state.logo.previewUrl}
              alt={state.logo.name}
              className="max-h-48 max-w-full object-contain"
            />
          </div>
        ) : (
          <p className="mt-3 flex items-center gap-2 text-sm text-ink-500">
            <Upload className="h-4 w-4" />
            {t('logoEmpty')}
          </p>
        )}
      </Card>
    );
  }

  function renderProductsStep() {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-ink-900">
          {t('productsTitle')}
        </h2>
        <p className="mt-1 text-sm text-ink-500">{t('productsStepHint')}</p>

        <div className="mt-4 space-y-4">
          {state.products.map((item) => {
            const product = getProductById(item.productId);
            if (!product) return null;
            const multiSided = productHasMultipleSides(item.productId);
            const availableSides = getAvailablePrintSides(item.productId);
            const productImage =
              getProductMockup(product, item.previewColor, 'front') ??
              product.image;
            const colorTotal = getProductColorQuantity(item);
            const sizeTotal = getProductSizeQuantity(item);

            return (
              <div
                key={item.productType}
                className={cn(
                  'rounded-xl border p-4',
                  item.enabled
                    ? 'border-ink-200 bg-white'
                    : 'border-ink-100 bg-ink-50/80 opacity-70',
                )}
              >
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={(e) =>
                      updateProduct(item.productType, {
                        enabled: e.target.checked,
                      })
                    }
                    className="mt-1 h-4 w-4 shrink-0 rounded border-ink-300 text-brand-600"
                  />
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ink-100 bg-ink-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={productImage}
                        alt={tp(item.productType)}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <span className="min-w-0">
                      <span className="block font-semibold text-ink-900">
                        {tp(item.productType)}
                      </span>
                      <span className="text-sm text-ink-500">
                        {formatPrice(product.basePrice, locale)} {t('perItem')}
                      </span>
                    </span>
                  </div>
                </label>

                {item.enabled ? (
                  <div className="mt-4 space-y-4 pl-7">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                        {t('colorsTitle')}
                      </p>
                      <div className="mt-2 space-y-2">
                        {item.colorSelections.map((selection) => {
                          const selected = selection.quantity > 0;
                          return (
                            <div
                              key={selection.color}
                              className="flex flex-wrap items-center gap-3 rounded-lg border border-ink-100 px-3 py-2"
                            >
                              <label className="flex min-w-[10rem] flex-1 cursor-pointer items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={(e) =>
                                    updateColorQuantity(
                                      item.productType,
                                      selection.color,
                                      e.target.checked ? 1 : 0,
                                    )
                                  }
                                  className="h-4 w-4 rounded border-ink-300 text-brand-600"
                                />
                                <span
                                  className="h-7 w-7 shrink-0 rounded-full border border-ink-200"
                                  style={{ backgroundColor: selection.color }}
                                />
                                <span className="text-sm font-medium text-ink-700">
                                  {getColorLabel(selection.color)}
                                </span>
                              </label>
                              {selected ? (
                                <BrandingPackQuantityInput
                                  value={selection.quantity}
                                  onChange={(quantity) =>
                                    updateColorQuantity(
                                      item.productType,
                                      selection.color,
                                      quantity,
                                    )
                                  }
                                />
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {product.sizes?.length ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                          {t('sizesTitle')}
                        </p>
                        <p className="mt-1 text-sm text-ink-500">
                          {t('sizesHint')}
                        </p>
                        <div className="mt-2 space-y-2">
                          {item.sizeSelections.map((selection) => (
                            <div
                              key={selection.size}
                              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-100 px-3 py-2"
                            >
                              <span className="min-w-[3rem] text-sm font-semibold text-ink-800">
                                {selection.size}
                              </span>
                              <BrandingPackQuantityInput
                                value={selection.quantity}
                                max={getMaxSizeQuantityForEntry(
                                  item,
                                  selection.size,
                                )}
                                onChange={(quantity) =>
                                  updateSizeQuantity(
                                    item.productType,
                                    selection.size,
                                    quantity,
                                  )
                                }
                              />
                            </div>
                          ))}
                        </div>
                        {colorTotal > 0 || sizeTotal > 0 ? (
                          <p
                            className={cn(
                              'mt-2 text-xs',
                              colorTotal === sizeTotal && colorTotal > 0
                                ? 'text-ink-500'
                                : 'text-amber-700',
                            )}
                          >
                            {t('sizeColorTotal', {
                              colors: colorTotal,
                              sizes: sizeTotal,
                            })}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {multiSided ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                          {t('printSidesTitle')}
                        </p>
                        <p className="mt-1 text-sm text-ink-500">
                          {t('printSidesHint')}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-3">
                          {availableSides.map((side) => (
                            <label
                              key={side}
                              className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={item.printSides.includes(side)}
                                onChange={() =>
                                  togglePrintSide(item.productType, side)
                                }
                                className="h-4 w-4 rounded border-ink-300 text-brand-600"
                              />
                              {tc(side)}
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Card>
    );
  }

  function renderCustomizeStep() {
    if (!currentCustomizeProduct || !currentCatalogProduct || !state.logo) {
      return null;
    }

    const placement =
      currentCustomizeProduct.sidePlacements[activeSide] ??
      currentCustomizeProduct.sidePlacements.front;

    return (
      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
          {t('customizeProgress', {
            current: customizeIndex + 1,
            total: selectedProducts.length,
          })}
        </p>
        <h2 className="mt-1 text-lg font-semibold text-ink-900">
          {t('editorTitle', {
            product: tp(currentCustomizeProduct.productType),
          })}
        </h2>
        <p className="mt-1 text-sm text-ink-500">{t('editorHint')}</p>

        {currentCustomizeProduct.printSides.length > 1 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {currentCustomizeProduct.printSides.map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => setActiveSide(side)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-sm font-medium',
                  activeSide === side
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-ink-200 text-ink-600',
                )}
              >
                {tc(side)}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-4">
          <BrandingPackMockup
            product={currentCatalogProduct}
            color={currentCustomizeProduct.previewColor}
            side={activeSide}
            logoUrl={state.logo.previewUrl}
            placement={placement}
            typeLabel={tp(currentCustomizeProduct.productType)}
            printAreaLabel={tc('printAreaGuide')}
            wrapAreaLabel={tc('drinkwareWrapArea')}
            frontPreviewLabel={tc('drinkwareFrontPreview')}
            drinkwareWrapHint={tc('drinkwareWrapHint')}
            interactive
            onLogoScaleChange={(scale) =>
              updateProduct(currentCustomizeProduct.productType, {
                sidePlacements: {
                  ...currentCustomizeProduct.sidePlacements,
                  [activeSide]: {
                    ...(currentCustomizeProduct.sidePlacements[activeSide] ??
                      placement!),
                    scale: clampPhotoScale(scale),
                  },
                },
              })
            }
            onLogoPositionChange={(position) =>
              updateProduct(currentCustomizeProduct.productType, {
                sidePlacements: {
                  ...currentCustomizeProduct.sidePlacements,
                  [activeSide]: {
                    ...(currentCustomizeProduct.sidePlacements[activeSide] ??
                      placement!),
                    position,
                  },
                },
              })
            }
          />
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-ink-700">
            {t('previewColor')}
          </label>
          <div className="flex flex-wrap gap-2">
            {(currentCatalogProduct.colors ?? []).map((color) => (
              <button
                key={color}
                type="button"
                onClick={() =>
                  updateProduct(currentCustomizeProduct.productType, {
                    previewColor: color,
                  })
                }
                className={cn(
                  'h-9 w-9 rounded-full border-2',
                  currentCustomizeProduct.previewColor === color
                    ? 'border-brand-600 ring-2 ring-brand-200'
                    : 'border-ink-200',
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  function renderReviewStep() {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-ink-900">
          {t('reviewTitle')}
        </h2>
        <p className="mt-1 text-sm text-ink-500">{t('reviewHint')}</p>

        {state.logo?.previewUrl ? (
          <div className="mt-4 flex items-center gap-4 rounded-lg border border-ink-100 p-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-ink-50 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={state.logo.previewUrl}
                alt=""
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-ink-900">{t('yourLogo')}</p>
              <p className="text-xs text-ink-500">{state.logo.name}</p>
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {selectedProducts.flatMap((product) => {
            const catalog = getProductById(product.productId);
            if (!catalog || !state.logo?.previewUrl) return [];

            const previewColor =
              product.colorSelections.find((c) => c.quantity > 0)?.color ??
              product.previewColor;

            return product.printSides.map((side) => (
              <div
                key={`${product.productType}-${side}`}
                className="overflow-hidden rounded-xl border border-ink-100"
              >
                <BrandingPackMockup
                  product={catalog}
                  color={previewColor}
                  side={side}
                  logoUrl={state.logo?.previewUrl}
                  placement={
                    product.sidePlacements[side] ??
                    product.sidePlacements.front
                  }
                  typeLabel={tp(product.productType)}
                  printAreaLabel=""
                  interactive={false}
                />
                <p className="flex items-center justify-between gap-2 border-t border-ink-100 px-3 py-2 text-sm">
                  <span className="font-medium text-ink-700">
                    {tp(product.productType)} · {tc(side)}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      editProductFromReview(product.productType, side)
                    }
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-ink-400 transition hover:text-brand-600"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {t('editDesign')}
                  </button>
                </p>
              </div>
            ));
          })}
        </div>

        <ul className="mt-6 space-y-2 border-t border-ink-100 pt-4">
          {getBrandingPackLineItems(state).map((line) => {
            const catalog = getProductById(line.product.productId);
            return (
              <li
                key={`${line.product.productType}-${line.color}`}
                className="flex justify-between text-sm"
              >
                <span className="text-ink-600">
                  {tp(line.product.productType)} · {getColorLabel(line.color)} ×{' '}
                  {line.quantity}
                  {line.product.sizeSelections.some((s) => s.quantity > 0)
                    ? ` · ${formatBrandingPackSizeBreakdown(line.product)}`
                    : ''}
                  {line.product.printSides.length > 1
                    ? ` · ${line.product.printSides.map((s) => tc(s)).join(', ')}`
                    : ''}
                </span>
                <span className="font-medium">
                  {formatPrice(
                    (catalog?.basePrice ?? 0) * line.quantity,
                    locale,
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
    );
  }

  function renderOrderStep() {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-ink-900">{t('orderTitle')}</h2>
        <p className="mt-1 text-sm text-ink-500">{t('orderHint')}</p>

        <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50 p-4">
          <p className="text-sm text-brand-800">{t('singlePackNote')}</p>
        </div>

        <div className="mt-6 flex justify-between border-t border-ink-200 pt-4">
          <span className="font-semibold">{t('total')}</span>
          <span className="text-xl font-bold text-brand-600">
            {formatPrice(totalPrice, locale)}
          </span>
        </div>
      </Card>
    );
  }

  function handlePrimaryNext() {
    if (step === 'logo') {
      if (!validateLogoStep()) return;
      goToStep('products');
      return;
    }
    if (step === 'products') {
      if (!validateProductsStep()) return;
      setCustomizeIndex(0);
      const first = selectedProducts[0];
      setActiveSide(first?.printSides[0] ?? 'front');
      goToStep('customize');
      return;
    }
    if (step === 'customize') {
      void handleNextFromCustomize();
      return;
    }
    if (step === 'review') {
      goToStep('order');
      return;
    }
    if (step === 'order') {
      void handleAddToCart();
    }
  }

  function handleBack() {
    const index = BRANDING_PACK_WIZARD_STEPS.indexOf(step);
    if (index <= 0) return;
    const prev = BRANDING_PACK_WIZARD_STEPS[index - 1];
    if (step === 'customize' && customizeIndex > 0) {
      setCustomizeIndex((i) => i - 1);
      return;
    }
    goToStep(prev);
  }

  const primaryLabel =
    step === 'order'
      ? editCartItemId
        ? t('updateCart')
        : t('addToCart')
      : step === 'customize' &&
          customizeIndex < selectedProducts.length - 1
        ? t('nextProduct')
        : step === 'customize'
          ? t('finishCustomize')
          : t('next');

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/products/custom"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('back')}
      </Link>

      <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">{t('title')}</h1>
      <p className="mt-2 text-ink-600">{t('subtitle')}</p>

      <BrandingPackStepNav
        current={step}
        labels={stepLabels}
        onStepClick={handleStepNavClick}
      />

      {step === 'logo' ? renderLogoStep() : null}
      {step === 'products' ? renderProductsStep() : null}
      {step === 'customize' ? renderCustomizeStep() : null}
      {step === 'review' ? renderReviewStep() : null}
      {step === 'order' ? renderOrderStep() : null}

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        {step !== 'logo' ? (
          <Button type="button" variant="outline" onClick={handleBack}>
            {t('backStep')}
          </Button>
        ) : null}
        <Button
          type="button"
          className="gap-2"
          loading={processing}
          disabled={processing}
          onClick={handlePrimaryNext}
        >
          {step === 'order' ? (
            <ShoppingCart className="h-5 w-5" />
          ) : (
            <ArrowRight className="h-5 w-5" />
          )}
          {primaryLabel}
        </Button>
      </div>

      {captureTarget && captureProductState && captureCatalogProduct ? (
        <div
          aria-hidden
          className="pointer-events-none fixed left-0 top-0 -z-50 w-[28rem] opacity-0"
        >
          <BrandingPackMockup
            ref={captureRef}
            product={captureCatalogProduct}
            color={captureTarget.color}
            side={captureTarget.side}
            logoUrl={state.logo?.previewUrl}
            placement={
              captureProductState.sidePlacements[captureTarget.side] ??
              captureProductState.sidePlacements.front
            }
            typeLabel={tp(captureTarget.productType)}
            printAreaLabel=""
            interactive={false}
            className="max-w-none"
          />
        </div>
      ) : null}
    </div>
  );
}
