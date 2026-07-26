import { getCustomizerCanvasFontFamily } from '@/lib/products/customizer-fonts';
import {
  DRINKWARE_FLAT_CANVAS_HEIGHT_PX,
  getDrinkwareWrapTextureSize,
  getDrinkwareTextureFontSize,
  getHandleGapEdgeFraction,
  type DrinkwareWrapTextureSize,
} from '@/lib/products/drinkware-3d-config';
import type { ProductType } from '@/lib/data/catalog';
import type { PlacedTextLayer } from '@/lib/products/text-layers';
import type { PrintAreaInsets } from '@/lib/products/print-area';

export type DrinkwareImageLayer = {
  src: string;
  scale: number;
  position: { x: number; y: number };
};

export type BuildDrinkwareWrapTextureInput = {
  productType: ProductType;
  productId?: string;
  productColor: string;
  /** Kept for API compat; placement uses the full unwrap canvas 1:1. */
  printBounds: PrintAreaInsets;
  images?: DrinkwareImageLayer[];
  textLayers?: PlacedTextLayer[];
  /** Measured 2D canvas height (CSS px) so text size matches the flat editor. */
  canvasHeightPx?: number;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Draw an image with size/position as % of the unwrap canvas.
 * scale = width as % of canvas width (same meaning as the 2D editor).
 */
function drawImageLayer(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  scale: number,
  position: { x: number; y: number },
  canvasWidth: number,
  canvasHeight: number,
) {
  const width = (scale / 100) * canvasWidth;
  const height = width * (img.naturalHeight / Math.max(1, img.naturalWidth));
  const centerX = (position.x / 100) * canvasWidth;
  const centerY = (position.y / 100) * canvasHeight;
  ctx.drawImage(img, centerX - width / 2, centerY - height / 2, width, height);
}

function drawTextLayer(
  ctx: CanvasRenderingContext2D,
  layer: PlacedTextLayer,
  canvasWidth: number,
  canvasHeight: number,
  canvasHeightPx: number,
) {
  if (!layer.text.trim()) return;

  const centerX = (layer.position.x / 100) * canvasWidth;
  const centerY = (layer.position.y / 100) * canvasHeight;
  const fontSize = getDrinkwareTextureFontSize(
    layer.size,
    canvasHeight,
    canvasHeightPx,
  );

  const lines = layer.text.split('\n');
  const lineHeightPx = fontSize * layer.lineHeight;

  ctx.save();
  ctx.font = `${layer.fontWeight} ${fontSize}px ${getCustomizerCanvasFontFamily(layer.fontFamily)}`;
  ctx.fillStyle = layer.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = layer.letterSpacing;
  ctx.shadowColor = 'rgba(0,0,0,0.15)';
  ctx.shadowBlur = Math.max(1, fontSize * 0.06);

  if (lines.length === 1) {
    ctx.fillText(layer.text, centerX, centerY);
  } else {
    lines.forEach((line, index) => {
      const lineY = centerY + (index - (lines.length - 1) / 2) * lineHeightPx;
      ctx.fillText(line, centerX, lineY);
    });
  }

  ctx.restore();
}

/** Flat ceramic fill + subtle vertical glaze (same look everywhere on the wrap). */
function paintCeramicRect(
  ctx: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fullHeight: number,
) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);

  const gradient = ctx.createLinearGradient(0, 0, 0, fullHeight);
  gradient.addColorStop(0, 'rgba(255,255,255,0.08)');
  gradient.addColorStop(0.45, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.05)');
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, ctx.canvas.width, fullHeight);
  ctx.restore();
}

function paintBaseColor(
  ctx: CanvasRenderingContext2D,
  color: string,
  width: number,
  height: number,
) {
  paintCeramicRect(ctx, color, 0, 0, width, height, height);
}

/**
 * Clear left/right seam strips back to ceramic so art wraps the body
 * but never prints under the handle (unwrap edges = one physical seam).
 * Uses the same ceramic fill as the body so the gap isn't a darker stroke.
 * Bleeds 1px across u=0/u=1 so the cylinder UV seam samples matching colors.
 */
function clearHandleGap(
  ctx: CanvasRenderingContext2D,
  color: string,
  width: number,
  height: number,
  edgeFraction: number,
) {
  if (edgeFraction <= 0) return;
  const edgePx = Math.max(1, Math.round(width * edgeFraction));
  if (edgePx <= 0) return;

  paintCeramicRect(ctx, color, 0, 0, edgePx, height, height);
  paintCeramicRect(ctx, color, width - edgePx, 0, edgePx, height, height);

  // Make leftmost / rightmost columns identical so UV seam filtering doesn't crack.
  const left = ctx.getImageData(0, 0, 1, height);
  ctx.putImageData(left, width - 1, 0);
}

/**
 * Builds the cylinder unwrap texture.
 * Layer % positions/scales match the flat 2D editor 1:1.
 */
export async function buildDrinkwareWrapTexture(
  input: BuildDrinkwareWrapTextureInput,
): Promise<HTMLCanvasElement> {
  const textureSize = getDrinkwareWrapTextureSize(
    input.productType,
    input.productId,
  );
  const canvas = document.createElement('canvas');
  canvas.width = textureSize.width;
  canvas.height = textureSize.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not create wrap texture canvas');
  }

  paintBaseColor(ctx, input.productColor, textureSize.width, textureSize.height);

  const loadedImages = await Promise.all(
    (input.images ?? []).map(async (layer) => ({
      layer,
      img: await loadImage(layer.src),
    })),
  );

  for (const { layer, img } of loadedImages) {
    drawImageLayer(
      ctx,
      img,
      layer.scale,
      layer.position,
      textureSize.width,
      textureSize.height,
    );
  }

  const canvasHeightPx = input.canvasHeightPx ?? DRINKWARE_FLAT_CANVAS_HEIGHT_PX;
  for (const textLayer of input.textLayers ?? []) {
    drawTextLayer(
      ctx,
      textLayer,
      textureSize.width,
      textureSize.height,
      canvasHeightPx,
    );
  }

  clearHandleGap(
    ctx,
    input.productColor,
    textureSize.width,
    textureSize.height,
    getHandleGapEdgeFraction(input.productType, input.productId),
  );

  return canvas;
}

export type { DrinkwareWrapTextureSize };
