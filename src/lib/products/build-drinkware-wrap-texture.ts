import { getCustomizerCanvasFontFamily } from '@/lib/products/customizer-fonts';
import {
  getDrinkwareWrapTextureSize,
  getDrinkwareWrapScaleFactor,
  getDrinkwareTextureFontSize,
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
  productColor: string;
  printBounds: PrintAreaInsets;
  images?: DrinkwareImageLayer[];
  textLayers?: PlacedTextLayer[];
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

function drawImageLayer(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  scale: number,
  position: { x: number; y: number },
  canvasWidth: number,
  canvasHeight: number,
  wrapScaleFactor: number,
) {
  const width = (scale / 100) * canvasWidth * wrapScaleFactor;
  const height = width * (img.naturalHeight / img.naturalWidth);
  const centerX = (position.x / 100) * canvasWidth;
  const centerY = (position.y / 100) * canvasHeight;
  ctx.drawImage(img, centerX - width / 2, centerY - height / 2, width, height);
}

function drawTextLayer(
  ctx: CanvasRenderingContext2D,
  layer: PlacedTextLayer,
  canvasWidth: number,
  canvasHeight: number,
  productType: ProductType,
) {
  if (!layer.text.trim()) return;

  const mapped = mapOverlayPosition(layer.position, canvasWidth, canvasHeight);
  const centerX = mapped.x;
  const centerY = mapped.y;
  const fontSize = getDrinkwareTextureFontSize(
    layer.size,
    canvasHeight,
    productType,
  );

  ctx.save();
  ctx.font = `${layer.fontWeight} ${fontSize}px ${getCustomizerCanvasFontFamily(layer.fontFamily)}`;
  ctx.fillStyle = layer.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = layer.letterSpacing;
  ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = Math.max(2, fontSize * 0.08);
  ctx.fillText(layer.text, centerX, centerY);
  ctx.restore();
}

function paintBaseColor(
  ctx: CanvasRenderingContext2D,
  color: string,
  width: number,
  height: number,
) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(255,255,255,0.1)');
  gradient.addColorStop(0.5, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.06)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function mapOverlayPosition(
  position: { x: number; y: number },
  canvasWidth: number,
  canvasHeight: number,
) {
  return {
    x: (position.x / 100) * canvasWidth,
    y: (position.y / 100) * canvasHeight,
  };
}

export async function buildDrinkwareWrapTexture(
  input: BuildDrinkwareWrapTextureInput,
): Promise<HTMLCanvasElement> {
  const textureSize = getDrinkwareWrapTextureSize(input.productType);
  const canvas = document.createElement('canvas');
  canvas.width = textureSize.width;
  canvas.height = textureSize.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not create wrap texture canvas');
  }

  paintBaseColor(ctx, input.productColor, textureSize.width, textureSize.height);

  const wrapScaleFactor = getDrinkwareWrapScaleFactor(
    input.productType,
    input.printBounds,
  );

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
      wrapScaleFactor,
    );
  }

  for (const textLayer of input.textLayers ?? []) {
    drawTextLayer(
      ctx,
      textLayer,
      textureSize.width,
      textureSize.height,
      input.productType,
    );
  }

  return canvas;
}

export type { DrinkwareWrapTextureSize };
