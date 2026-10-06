'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, Rotate3d } from 'lucide-react';
import {
  getCartDrinkwareSideDesign,
  getCartItemColor,
  getCartItemProduct,
} from '@/lib/cart/product-cart';
import { DrinkwareDesignPreview3D } from '@/components/products/customizer/DrinkwareDesignPreview3D';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { adminStrings } from '@/lib/admin/strings';
import { isHeartHandleMug } from '@/lib/products/drinkware-product-options';
import { getDrinkwareCaptureYaws } from '@/lib/products/drinkware-capture-yaws';
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

function hydrateAdminSideDesignPhotos(sideDesign: SideDesign): SideDesign {
  if (sideDesign.uploadedPhotos.length === 0) return sideDesign;
  return {
    ...sideDesign,
    uploadedPhotos: sideDesign.uploadedPhotos.map((photo) => {
      const fileId = photo.fileId?.trim();
      if (!fileId) return photo;
      return { ...photo, previewUrl: buildUploadedFileUrl(fileId) };
    }),
  };
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

function snapshotHostCanvas(host: HTMLElement | null): string {
  const canvas = host?.querySelector('canvas');
  if (!canvas) return '';
  try {
    return canvas.toDataURL('image/png');
  } catch {
    return '';
  }
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
    sideDesign: hydrateAdminSideDesignPhotos(restored),
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
  const yaws = useMemo(
    () => (model ? getDrinkwareCaptureYaws(model.sideDesign) : null),
    [model],
  );
  const captureViews = useMemo(
    () =>
      yaws
        ? [
            { yaw: yaws.front, label: 'Front' },
            { yaw: yaws.left, label: 'Left' },
            { yaw: yaws.right, label: 'Right' },
          ]
        : [],
    [yaws],
  );

  const hostRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const shotsRef = useRef<string[]>([]);
  const [yawOffset, setYawOffset] = useState(0);
  const [captureIndex, setCaptureIndex] = useState<number | null>(null);
  const [stills, setStills] = useState<{ src: string; label: string }[] | null>(
    null,
  );

  useEffect(() => {
    if (yaws) setYawOffset(yaws.preview);
  }, [yaws]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!startedRef.current) setStills([]);
    }, 12000);
    return () => window.clearTimeout(timeout);
  }, []);

  const onReady = useCallback(() => {
    if (startedRef.current || captureViews.length === 0) return;
    startedRef.current = true;
    shotsRef.current = [];
    setYawOffset(captureViews[0]!.yaw);
    setCaptureIndex(0);
  }, [captureViews]);

  useEffect(() => {
    if (captureIndex === null || captureIndex < 0) return;
    let cancelled = false;
    let frames = 0;

    const tick = () => {
      if (cancelled) return;
      frames += 1;
      if (frames < 8) {
        requestAnimationFrame(tick);
        return;
      }
      shotsRef.current[captureIndex] = snapshotHostCanvas(hostRef.current);
      const next = captureIndex + 1;
      if (next < captureViews.length) {
        setYawOffset(captureViews[next]!.yaw);
        setCaptureIndex(next);
        return;
      }
      setStills(
        captureViews
          .map((view, index) => ({
            src: shotsRef.current[index] ?? '',
            label: view.label,
          }))
          .filter((still) => still.src.startsWith('data:image')),
      );
      setYawOffset(yaws?.preview ?? 0);
      setCaptureIndex(-1);
    };

    const raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [captureIndex, captureViews, yaws?.preview]);

  if (!model || !yaws) return null;

  const capturing = captureIndex !== null && captureIndex >= 0;

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
          ref={hostRef}
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
            yawOffset={yawOffset}
            preserveDrawingBuffer
            orbitAutoRotate={false}
            onReady={onReady}
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

      {capturing || stills === null ? (
        <div className="mb-3 flex min-h-[8rem] items-center justify-center rounded-lg border border-white bg-white p-4 shadow-sm">
          <LoadingIndicator label={t.preview3dStillsLoading} size="sm" />
        </div>
      ) : stills.length > 0 ? (
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
