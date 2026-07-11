import { getCustomizerFontFamily } from '@/lib/products/customizer-fonts';
import {
  DRINKWARE_WRAP_TEXTURE_HEIGHT,
  DRINKWARE_WRAP_TEXTURE_WIDTH,
} from '@/lib/products/drinkware-3d-config';
import type { PlacedTextLayer } from '@/lib/products/text-layers';
import type { PrintAreaInsets } from '@/lib/products/print-area';

export type DrinkwareImageLayer = {
  src: string;
  scale: number;
  position: { x: number; y: number };
};

export type BuildDrinkwareWrapTextureInput = {
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
) {
  const width = (scale / 100) * canvasWidth;
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
) {
  if (!layer.text.trim()) return;

  const centerX = (layer.position.x / 100) * canvasWidth;
  const centerY = (layer.position.y / 100) * canvasHeight;
  const fontSize = Math.max(
    12,
    Math.round((layer.size / 400) * canvasHeight * 2.4),
  );

  ctx.save();
  ctx.font = `${layer.fontWeight} ${fontSize}px ${getCustomizerFontFamily(layer.fontFamily)}`;
  ctx.fillStyle = layer.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
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
  gradient.addColorStop(0, 'rgba(255,255,255,0.12)');
  gradient.addColorStop(0.45, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.14)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

export async function buildDrinkwareWrapTexture(
  input: BuildDrinkwareWrapTextureInput,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = DRINKWARE_WRAP_TEXTURE_WIDTH;
  canvas.height = DRINKWARE_WRAP_TEXTURE_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not create wrap texture canvas');
  }

  paintBaseColor(
    ctx,
    input.productColor,
    DRINKWARE_WRAP_TEXTURE_WIDTH,
    DRINKWARE_WRAP_TEXTURE_HEIGHT,
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
      DRINKWARE_WRAP_TEXTURE_WIDTH,
      DRINKWARE_WRAP_TEXTURE_HEIGHT,
    );
  }

  for (const textLayer of input.textLayers ?? []) {
    drawTextLayer(
      ctx,
      textLayer,
      DRINKWARE_WRAP_TEXTURE_WIDTH,
      DRINKWARE_WRAP_TEXTURE_HEIGHT,
    );
  }

  return canvas;
}
