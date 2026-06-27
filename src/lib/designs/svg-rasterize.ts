import { toAbsoluteSvgAssetUrls } from '@/lib/designs/svg-background-assets';

export function getSvgDimensions(svg: string): { width: number; height: number } {
  const viewBoxMatch = svg.match(/viewBox=["']([^"']+)["']/i);
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts.every((value) => Number.isFinite(value))) {
      return { width: parts[2], height: parts[3] };
    }
  }

  const widthMatch = svg.match(/\bwidth=["']([\d.]+)/i);
  const heightMatch = svg.match(/\bheight=["']([\d.]+)/i);

  return {
    width: widthMatch ? Number(widthMatch[1]) : 1200,
    height: heightMatch ? Number(heightMatch[1]) : 1600,
  };
}

export async function svgStringToPngDataUrl(
  svg: string,
  options?: {
    scale?: number;
    maxWidth?: number;
    backgroundColor?: string;
  },
): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('svgStringToPngDataUrl requires a browser environment');
  }

  const { width, height } = getSvgDimensions(svg);
  let scale = options?.scale ?? 2;

  if (options?.maxWidth && width * scale > options.maxWidth) {
    scale = options.maxWidth / width;
  }

  const canvasWidth = Math.max(1, Math.round(width * scale));
  const canvasHeight = Math.max(1, Math.round(height * scale));

  const preparedSvg = toAbsoluteSvgAssetUrls(svg);

  return new Promise((resolve, reject) => {
    const image = new Image();
    const blob = new Blob([preparedSvg], { type: 'image/svg+xml;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);

    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Canvas is not available'));
          return;
        }

        if (options?.backgroundColor) {
          context.fillStyle = options.backgroundColor;
          context.fillRect(0, 0, canvasWidth, canvasHeight);
        }

        context.drawImage(image, 0, 0, canvasWidth, canvasHeight);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL('image/png', 0.95));
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to rasterize SVG'));
    };

    image.src = objectUrl;
  });
}
