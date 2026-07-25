import type {
  Product,
  ProductDesignTemplate,
  ProductSide,
  ProductType,
} from '@/lib/data/catalog';
import { getCustomizerCanvasFontFamily } from '@/lib/products/customizer-fonts';
import type { SideDesign } from '@/lib/products/design-state';
import {
  fetchRecoloredSvgBlobUrl,
  getDesignCompositeOverlayUrl,
  normalizeHex,
  resolveComposableOverlayUrl,
  resolveOverlayColorVariant,
} from '@/lib/products/design-overlay';
import { getPremadeMasterStoragePath } from '@/lib/products/premade-artwork-source';
import { getStickerById } from '@/lib/products/sticker-library';
import type { PlacedTextLayer } from '@/lib/products/text-layers';
import {
  getPrintAreaHeightPercent,
  getPrintAreaWidthPercent,
  type PrintAreaInsets,
} from '@/lib/products/print-area';
import { resolveAssetUrl } from '@/lib/storage/asset-url';

/** Long edge (px) for print-ready PNG — ~300 DPI at typical garment print width. */
const TARGET_PRINT_WIDTH_BY_TYPE: Partial<Record<ProductType, number>> = {
  't-shirt': 4500,
  hoodie: 4500,
  bodysuit: 3600,
  cap: 3000,
  bag: 4500,
  mug: 4800,
  cup: 4800,
  thermos: 4800,
};

const DEFAULT_TARGET_PRINT_WIDTH = 4500;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('image-load-failed'));
    image.src = src;
  });
}

async function rasterizeSvgSource(
  src: string,
  scale: number,
): Promise<HTMLImageElement> {
  const absolute = src.startsWith('data:') || src.startsWith('blob:')
    ? src
    : new URL(src, window.location.origin).href;

  let svgText: string;
  if (absolute.startsWith('data:') || absolute.startsWith('blob:')) {
    const response = await fetch(absolute);
    svgText = await response.text();
  } else {
    const response = await fetch(absolute);
    if (!response.ok) throw new Error('svg-fetch-failed');
    svgText = await response.text();
  }

  const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);

  try {
    const probe = await loadImage(objectUrl);
    const width = probe.naturalWidth || 2000;
    const height = probe.naturalHeight || 2000;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('canvas-context-missing');
    context.drawImage(probe, 0, 0, canvas.width, canvas.height);
    const pngUrl = canvas.toDataURL('image/png');
    return loadImage(pngUrl);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function resolveOverlayAssetUrl(
  design: SideDesign,
  template: ProductDesignTemplate | null | undefined,
  shirtColor: string,
): string | null {
  if (template?.printMasterImage) {
    const master = resolveComposableOverlayUrl(template.printMasterImage);
    if (master) return master;
  }

  const raster =
    resolveComposableOverlayUrl(design.overlayRaster) ??
    (template ? getDesignCompositeOverlayUrl(template) : null);
  if (raster) return raster;

  if (design.overlayColorVariants) {
    const normalizedVariants = Object.fromEntries(
      Object.entries(design.overlayColorVariants).map(([key, value]) => [
        normalizeHex(key),
        value,
      ]),
    );
    return resolveOverlayColorVariant(
      {
        overlayColorVariants: normalizedVariants,
        overlayImage: design.overlayRaster ?? undefined,
      },
      shirtColor,
    );
  }

  if (template?.overlayColorVariants) {
    return resolveOverlayColorVariant(template, shirtColor);
  }

  if (design.premadeDesignImage) {
    return resolveAssetUrl(design.premadeDesignImage);
  }

  return null;
}

async function resolveDesignImage(
  design: SideDesign,
  template: ProductDesignTemplate | null | undefined,
  shirtColor: string,
  side?: ProductSide,
): Promise<HTMLImageElement | null> {
  if (design.overlaySvg && design.overlaySvgColors) {
    try {
      const blobUrl = await fetchRecoloredSvgBlobUrl(
        design.overlaySvg,
        design.overlaySvgColors,
      );
      const image = await rasterizeSvgSource(blobUrl, 4);
      URL.revokeObjectURL(blobUrl);
      return image;
    } catch {
      return null;
    }
  }

  if (template && design.premadeDesignId) {
    const masterPath = getPremadeMasterStoragePath(template, side);
    if (masterPath) {
      const masterUrl = resolveComposableOverlayUrl(masterPath);
      if (masterUrl) {
        try {
          return await loadImage(masterUrl);
        } catch {
          // fall through to overlay / upload chain
        }
      }
    }
  }

  const url = resolveOverlayAssetUrl(design, template, shirtColor);
  if (url) {
    try {
      return await loadImage(url);
    } catch {
      return null;
    }
  }

  if (design.uploadedFile?.isImage && design.uploadedFile.previewUrl) {
    try {
      return await loadImage(design.uploadedFile.previewUrl);
    } catch {
      return null;
    }
  }

  return null;
}

function getTargetPrintSize(
  productType: ProductType,
  insets: PrintAreaInsets,
): { width: number; height: number } {
  const targetWidth =
    TARGET_PRINT_WIDTH_BY_TYPE[productType] ?? DEFAULT_TARGET_PRINT_WIDTH;
  const printW = getPrintAreaWidthPercent(insets);
  const printH = getPrintAreaHeightPercent(insets);
  const aspect = printH / printW;
  return {
    width: targetWidth,
    height: Math.max(1, Math.round(targetWidth * aspect)),
  };
}

function mockupPointToCanvas(
  point: { x: number; y: number },
  insets: PrintAreaInsets,
  canvasWidth: number,
  canvasHeight: number,
): { x: number; y: number } {
  const printW = getPrintAreaWidthPercent(insets);
  const printH = getPrintAreaHeightPercent(insets);
  return {
    x: ((point.x - insets.left) / printW) * canvasWidth,
    y: ((point.y - insets.top) / printH) * canvasHeight,
  };
}

function mockupScaleToCanvasWidth(
  scalePercent: number,
  insets: PrintAreaInsets,
  canvasWidth: number,
): number {
  const printW = getPrintAreaWidthPercent(insets);
  return (scalePercent / printW) * canvasWidth;
}

function drawImageLayer(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  position: { x: number; y: number },
  scalePercent: number,
  insets: PrintAreaInsets,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const center = mockupPointToCanvas(
    position,
    insets,
    canvasWidth,
    canvasHeight,
  );
  const drawWidth = mockupScaleToCanvasWidth(
    scalePercent,
    insets,
    canvasWidth,
  );
  const aspect = image.naturalHeight / image.naturalWidth;
  const drawHeight = drawWidth * aspect;

  context.drawImage(
    image,
    center.x - drawWidth / 2,
    center.y - drawHeight / 2,
    drawWidth,
    drawHeight,
  );
}

function parseTextShadow(
  shadow: string,
): { offsetX: number; offsetY: number; blur: number; color: string } | null {
  const match = shadow.match(
    /(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(.+)/,
  );
  if (!match) return null;
  return {
    offsetX: Number(match[1]),
    offsetY: Number(match[2]),
    blur: Number(match[3]),
    color: match[4].trim(),
  };
}

function drawTextLayer(
  context: CanvasRenderingContext2D,
  layer: PlacedTextLayer,
  insets: PrintAreaInsets,
  canvasWidth: number,
  canvasHeight: number,
  mockupHeightPx: number,
): void {
  if (!layer.text.trim()) return;

  const center = mockupPointToCanvas(
    layer.position,
    insets,
    canvasWidth,
    canvasHeight,
  );
  const printH = getPrintAreaHeightPercent(insets);
  const printAreaHeightPx = mockupHeightPx * (printH / 100);
  const scaleFactor = canvasHeight / Math.max(1, printAreaHeightPx);
  const fontSize = Math.max(12, layer.size * scaleFactor);

  const fontFamily = getCustomizerCanvasFontFamily(layer.fontFamily);
  context.save();
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = layer.color;
  context.font = `${layer.fontWeight} ${fontSize}px ${fontFamily}`;

  const letterSpacingEm = Number.parseFloat(layer.letterSpacing) || 0;
  if (letterSpacingEm !== 0) {
    (context as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing =
      `${letterSpacingEm * fontSize}px`;
  }

  const shadow = parseTextShadow(layer.textShadow);
  if (shadow) {
    context.shadowColor = shadow.color;
    context.shadowBlur = shadow.blur * scaleFactor;
    context.shadowOffsetX = shadow.offsetX * scaleFactor;
    context.shadowOffsetY = shadow.offsetY * scaleFactor;
  }

  const lines = layer.text.split('\n');
  const lineHeightPx = fontSize * layer.lineHeight;
  const totalHeight = lineHeightPx * lines.length;
  let y = center.y - totalHeight / 2 + lineHeightPx / 2;

  for (const line of lines) {
    context.fillText(line, center.x, y);
    y += lineHeightPx;
  }

  context.restore();
}

export type RenderPrintAreaDesignInput = {
  design: SideDesign;
  template?: ProductDesignTemplate | null;
  product: Product;
  shirtColor: string;
  insets: PrintAreaInsets;
  mockupWidthPx: number;
  mockupHeightPx: number;
  side?: ProductSide;
};

/**
 * Composite print-ready artwork at production resolution using source assets
 * (full-res PNG/SVG, uploaded photos) instead of a low-res DOM screenshot.
 */
export async function renderPrintAreaDesign(
  input: RenderPrintAreaDesignInput,
): Promise<string | undefined> {
  const { design, template, product, shirtColor, insets, mockupHeightPx, side } =
    input;

  if (mockupHeightPx < 1) return undefined;

  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready;
  }

  const { width, height } = getTargetPrintSize(product.type, insets);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return undefined;

  const hasPremade = Boolean(template) || Boolean(design.premadeDesignId);
  const designImage = await resolveDesignImage(
    design,
    template,
    shirtColor,
    side,
  );

  if (designImage) {
    drawImageLayer(
      context,
      designImage,
      design.uploadedImagePosition,
      design.uploadedImageScale,
      insets,
      width,
      height,
    );
  } else if (
    !hasPremade &&
    design.uploadedFile?.isImage &&
    design.uploadedFile.previewUrl
  ) {
    try {
      const uploaded = await loadImage(design.uploadedFile.previewUrl);
      drawImageLayer(
        context,
        uploaded,
        design.uploadedImagePosition,
        design.uploadedImageScale,
        insets,
        width,
        height,
      );
    } catch {
      // continue with text/stickers only
    }
  }

  for (const layer of design.textLayers) {
    drawTextLayer(context, layer, insets, width, height, mockupHeightPx);
  }

  for (const sticker of design.stickers) {
    const definition = getStickerById(sticker.stickerId);
    if (!definition) continue;
    try {
      const stickerImage = await rasterizeSvgSource(
        resolveAssetUrl(definition.src) ?? definition.src,
        3,
      );
      drawImageLayer(
        context,
        stickerImage,
        sticker.position,
        sticker.scale,
        insets,
        width,
        height,
      );
    } catch {
      // skip broken sticker
    }
  }

  return canvas.toDataURL('image/png');
}
