import {
  capturePreviewElement,
  waitForPaint,
} from '@/lib/products/capture-preview';
import {
  renderPrintAreaDesign,
  type RenderPrintAreaDesignInput,
} from '@/lib/products/render-print-area-design';
import {
  getPrintAreaHeightPercent,
  getPrintAreaWidthPercent,
  type PrintAreaInsets,
} from '@/lib/products/print-area';

const MIN_PRINT_AREA_WIDTH_PX = 4500;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('load-failed'));
    image.src = src;
  });
}

/** Crop a full mockup capture down to the printable region (transparent PNG). */
export async function cropDataUrlToPrintArea(
  dataUrl: string,
  insets: PrintAreaInsets,
): Promise<string | undefined> {
  try {
    const image = await loadImage(dataUrl);
    const cropX = Math.round((insets.left / 100) * image.width);
    const cropY = Math.round((insets.top / 100) * image.height);
    const cropW = Math.round(
      ((100 - insets.left - insets.right) / 100) * image.width,
    );
    const cropH = Math.round(
      ((100 - insets.top - insets.bottom) / 100) * image.height,
    );

    if (cropW < 1 || cropH < 1) return undefined;

    const canvas = document.createElement('canvas');
    canvas.width = cropW;
    canvas.height = cropH;
    const context = canvas.getContext('2d');
    if (!context) return undefined;

    context.drawImage(image, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    return canvas.toDataURL('image/png');
  } catch {
    return undefined;
  }
}

function computeHtml2CanvasScale(
  previewRoot: HTMLElement,
  insets: PrintAreaInsets,
): number {
  const rect = previewRoot.getBoundingClientRect();
  const printAreaWidthPx =
    rect.width * (getPrintAreaWidthPercent(insets) / 100);
  if (printAreaWidthPx < 1) return 8;

  const scaleForTarget = MIN_PRINT_AREA_WIDTH_PX / printAreaWidthPx;
  return Math.min(12, Math.max(4, Math.ceil(scaleForTarget)));
}

/**
 * Capture print-ready artwork for one mockup side: design layers only
 * (no garment photo), cropped to the print area with a transparent background.
 */
export async function capturePrintAreaDesign(
  previewRoot: HTMLElement,
  insets: PrintAreaInsets,
  compositor?: Omit<RenderPrintAreaDesignInput, 'insets' | 'mockupWidthPx' | 'mockupHeightPx'>,
): Promise<string | undefined> {
  if (compositor) {
    const rect = previewRoot.getBoundingClientRect();
    const rendered = await renderPrintAreaDesign({
      ...compositor,
      insets,
      mockupWidthPx: rect.width,
      mockupHeightPx: rect.height,
    });
    if (rendered) return rendered;
  }

  const contentEl = previewRoot.querySelector<HTMLElement>(
    '[data-print-area-content]',
  );
  if (!contentEl) return undefined;

  await waitForPaint();

  const scale = computeHtml2CanvasScale(previewRoot, insets);
  const raw = await capturePreviewElement(contentEl, {
    backgroundColor: 'transparent',
    scale,
  });
  if (!raw) return undefined;

  return cropDataUrlToPrintArea(raw, insets);
}
