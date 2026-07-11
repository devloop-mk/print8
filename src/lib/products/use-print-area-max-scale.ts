'use client';

import {
  useCallback,
  useLayoutEffect,
  useState,
  type RefObject,
} from 'react';
import { PRODUCT_PHOTO_MIN_SCALE } from '@/lib/products/customizer-constants';
import {
  getMaxScaleForPrintArea,
  getPrintAreaMaxScale,
  type PrintAreaInsets,
} from '@/lib/products/print-area';

function getMockupInnerElement(
  containerRef: RefObject<HTMLElement | null>,
): HTMLElement | null {
  return (
    containerRef.current?.querySelector<HTMLElement>('[data-mockup-inner]') ??
    containerRef.current
  );
}

/**
 * Computes the max image scale for the current print bounds, image aspect ratio,
 * and mockup frame size. Re-measures on resize and when the image source changes.
 */
export function usePrintAreaMaxScale(
  containerRef: RefObject<HTMLElement | null>,
  printBounds: PrintAreaInsets | undefined,
  imageSrc: string | undefined,
  fallbackMax: number,
): number {
  const [maxScale, setMaxScale] = useState(fallbackMax);

  const recompute = useCallback(() => {
    if (!printBounds) {
      setMaxScale(fallbackMax);
      return;
    }

    const parent = getMockupInnerElement(containerRef);
    if (!parent) {
      setMaxScale(getPrintAreaMaxScale(printBounds));
      return;
    }

    const rect = parent.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const parentAspect = rect.width / rect.height;

    if (!imageSrc) {
      setMaxScale(getPrintAreaMaxScale(printBounds));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!img.naturalWidth || !img.naturalHeight) {
        setMaxScale(getPrintAreaMaxScale(printBounds));
        return;
      }

      const imageAspect = img.naturalWidth / img.naturalHeight;
      const max = getMaxScaleForPrintArea(
        printBounds,
        imageAspect,
        parentAspect,
      );
      setMaxScale(
        Math.max(PRODUCT_PHOTO_MIN_SCALE, Math.floor(max)),
      );
    };
    img.onerror = () => setMaxScale(getPrintAreaMaxScale(printBounds));
    img.src = imageSrc;
  }, [containerRef, printBounds, imageSrc, fallbackMax]);

  useLayoutEffect(() => {
    recompute();

    const parent = getMockupInnerElement(containerRef);
    if (!parent) return;

    const observer = new ResizeObserver(() => recompute());
    observer.observe(parent);
    return () => observer.disconnect();
  }, [containerRef, recompute]);

  return maxScale;
}
