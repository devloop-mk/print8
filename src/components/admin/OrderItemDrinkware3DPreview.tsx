'use client';

import { useCallback, useMemo, useState } from 'react';
import { Download, Rotate3d } from 'lucide-react';
import {
  getCartDrinkwareSideDesign,
  getCartItemColor,
  getCartItemProduct,
} from '@/lib/cart/product-cart';
import { DrinkwareDesignPreview3D } from '@/components/products/customizer/DrinkwareDesignPreview3D';
import { adminStrings } from '@/lib/admin/strings';
import { isHeartHandleMug } from '@/lib/products/drinkware-product-options';
import { getDrinkwareArtFacingYaw } from '@/lib/products/drinkware-capture-yaws';
import {
  getOverlayPrintBounds,
  getProductMockupLayout,
  isCylindricalDrinkwareType,
} from '@/lib/products/product-mockup-layout';
import type { SideDesign } from '@/lib/products/design-state';
import { buildUploadedFileUrl } from '@/lib/upload/file-url';
import type { OrderItem } from '@/lib/orders/order-item-previews';
import type { Product } from '@/lib/data/catalog';
import type { PrintAreaInsets } from '@/lib/products/print-area';
import { SIDE_PREVIEW_CART_KEYS } from '@/lib/products/product-sides';

function uploadTokenFromUrl(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    return (
      new URL(url, 'http://local.invalid').searchParams.get('token') ?? undefined
    );
  } catch {
    return undefined;
  }
}

function isReusablePreviewUrl(url?: string): boolean {
  if (!url) return false;
  return !url.startsWith('blob:');
}

function tokenFromOrderMetadata(
  metadata?: Record<string, string | number | boolean>,
): string | undefined {
  if (!metadata) return undefined;
  for (const value of Object.values(metadata)) {
    if (typeof value !== 'string') continue;
    const token = uploadTokenFromUrl(value);
    if (token) return token;
  }
  return undefined;
}

function hydrateAdminSideDesignPhotos(
  sideDesign: SideDesign,
  extraToken?: string,
): SideDesign {
  const token =
    extraToken ||
    uploadTokenFromUrl(sideDesign.uploadedFile?.previewUrl) ||
    sideDesign.uploadedPhotos
      .map((photo) => uploadTokenFromUrl(photo.previewUrl))
      .find(Boolean);

  return {
    ...sideDesign,
    uploadedPhotos: sideDesign.uploadedPhotos.map((photo) => {
      const fileId = photo.fileId?.trim();
      const existing = photo.previewUrl;
      if (isReusablePreviewUrl(existing) && uploadTokenFromUrl(existing)) {
        return photo;
      }
      if (fileId && token) {
        return { ...photo, previewUrl: buildUploadedFileUrl(fileId, token) };
      }
      if (isReusablePreviewUrl(existing)) return photo;
      if (!fileId) return photo;
      return { ...photo, previewUrl: buildUploadedFileUrl(fileId, token) };
    }),
    uploadedFile: sideDesign.uploadedFile
      ? {
          ...sideDesign.uploadedFile,
          previewUrl: isReusablePreviewUrl(sideDesign.uploadedFile.previewUrl)
            ? sideDesign.uploadedFile.previewUrl
            : sideDesign.uploadedFile.fileId?.trim()
              ? buildUploadedFileUrl(sideDesign.uploadedFile.fileId, token)
              : sideDesign.uploadedFile.previewUrl,
        }
      : sideDesign.uploadedFile,
  };
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

function storedOrderStills(item: OrderItem): { src: string; label: string }[] {
  return (
    [
      { src: item[SIDE_PREVIEW_CART_KEYS.front], label: 'Front' },
      { src: item[SIDE_PREVIEW_CART_KEYS.left], label: 'Left' },
      { src: item[SIDE_PREVIEW_CART_KEYS.right], label: 'Right' },
    ] as { src: string | undefined; label: string }[]
  ).filter(
    (still): still is { src: string; label: string } =>
      typeof still.src === 'string' && still.src.startsWith('data:'),
  );
}

export type OrderDrinkwarePreviewModel = {
  product: Product;
  sideDesign: SideDesign;
  color: string;
  printBounds: PrintAreaInsets;
};

export function getOrderItemDrinkwarePreviewModel(
  item: OrderItem,
): OrderDrinkwarePreviewModel | null {
  const product = getCartItemProduct(item);
  if (!product || !isCylindricalDrinkwareType(product.type)) return null;
  const restored = getCartDrinkwareSideDesign(item, product);
  if (!restored) return null;
  return {
    product,
    sideDesign: hydrateAdminSideDesignPhotos(
      restored,
      tokenFromOrderMetadata(item.metadata),
    ),
    color: getCartItemColor(item) ?? product.colors?.[0] ?? '#ffffff',
    printBounds: getOverlayPrintBounds(getProductMockupLayout(product)),
  };
}

export function hasOrderItemDrinkware3DPreview(item: OrderItem): boolean {
  return Boolean(getOrderItemDrinkwarePreviewModel(item));
}

export function OrderItemDrinkware3DPreview({
  item,
  safeName,
}: {
  item: OrderItem;
  safeName: string;
}) {
  const t = adminStrings.orderDetail;
  const model = useMemo(() => getOrderItemDrinkwarePreviewModel(item), [item]);
  const previewYaw = useMemo(
    () => (model ? getDrinkwareArtFacingYaw(model.sideDesign) : 0),
    [model],
  );
  const stills = useMemo(() => storedOrderStills(item), [item]);
  const [wrapSrc, setWrapSrc] = useState<string | null>(null);

  const onWrapReady = useCallback((canvas: HTMLCanvasElement) => {
    try {
      setWrapSrc(canvas.toDataURL('image/png'));
    } catch {
      setWrapSrc(null);
    }
  }, []);

  if (!model) return null;

  return (
    <>
      <div className="mb-4 rounded-lg border border-white bg-white p-2 shadow-sm">
        <div className="mb-2 flex items-center gap-1.5">
          <Rotate3d className="h-3.5 w-3.5 text-ink-500" aria-hidden="true" />
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
            {t.preview3dTitle}
          </p>
        </div>
        <div
          className="relative mx-auto h-[20rem] w-full max-w-md overflow-hidden rounded-md border border-ink-100 bg-[#eef2f6] sm:h-[24rem]"
          data-admin-drinkware-3d="true"
        >
          <DrinkwareDesignPreview3D
            productType={model.product.type}
            productId={model.product.id}
            shirtColor={model.color}
            sideDesign={model.sideDesign}
            designTemplate={null}
            printBounds={model.printBounds}
            textLayers={model.sideDesign.textLayers}
            variant="pane"
            className="h-full w-full"
            yawOffset={previewYaw}
            orbitAutoRotate
            onWrapReady={onWrapReady}
          />
        </div>
        <p className="mt-2 text-center text-[11px] font-medium text-ink-500">
          {t.preview3dHint}
        </p>
        {isHeartHandleMug(model.product.id) ? (
          <p className="mt-1 text-center text-[11px] text-ink-500">
            {t.preview3dHeartHandleNote}
          </p>
        ) : null}
      </div>

      {wrapSrc ? (
        <div className="mb-3 rounded-lg border border-white bg-white p-2 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
              {t.preview3dWrapTitle} — {t.previewMockupSuffix}
            </p>
            <button
              type="button"
              onClick={() => downloadDataUrl(wrapSrc, `${safeName}-wrap.png`)}
              className="inline-flex items-center gap-1 rounded-md border border-ink-200 px-2 py-1 text-xs font-medium text-ink-700 transition hover:bg-ink-50"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              {t.downloadPreview}
            </button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={wrapSrc}
            alt={t.preview3dWrapTitle}
            className="max-h-40 w-full rounded border border-ink-100 bg-white object-contain"
          />
        </div>
      ) : null}

      {stills.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {stills.map((still) => (
            <div
              key={still.label}
              className="rounded-lg border border-white bg-white p-2 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
                  {still.label} — {t.previewMockupSuffix}
                </p>
                {still.src.startsWith('data:') ? (
                  <button
                    type="button"
                    onClick={() =>
                      downloadDataUrl(
                        still.src,
                        `${safeName}-${still.label.toLowerCase()}.png`,
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-md border border-ink-200 px-2 py-1 text-xs font-medium text-ink-700 transition hover:bg-ink-50"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    {t.downloadPreview}
                  </button>
                ) : null}
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={still.src}
                alt={still.label}
                className="max-h-56 w-full rounded border border-ink-100 bg-white object-contain"
              />
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
