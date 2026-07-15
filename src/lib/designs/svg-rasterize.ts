import html2canvas from 'html2canvas';
import { toAbsoluteSvgAssetUrls } from '@/lib/designs/svg-background-assets';
import { embedSvgWebFonts, ensureSvgFontsReady } from '@/lib/designs/svg-fonts';
import { waitForPaint } from '@/lib/products/capture-preview';

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

function stripXmlDeclaration(svg: string): string {
  return svg.replace(/<\?xml[^?]*\?>\s*/i, '').trim();
}

/**
 * SVG-as-image font fallback is unreliable. For Cyrillic text, put
 * Cyrillic-capable script fonts first so capture matches the editor.
 */
function promoteCyrillicScriptFonts(svg: string): string {
  return svg.replace(
    /(<text\b[^>]*\bfont-family=(["']))([^"']+)(\2[^>]*>)([\s\S]*?)(<\/text>)/gi,
    (full, pre, _quote, family, mid, content, close) => {
      if (!/[\u0400-\u04FF]/.test(content)) return full;
      if (!/Marck Script|Bad Script/i.test(family)) return full;

      const parts = family.split(',').map((part: string) => part.trim());
      const preferred = parts.filter((part: string) =>
        /Marck Script|Bad Script/i.test(part),
      );
      const rest = parts.filter(
        (part: string) => !/Marck Script|Bad Script/i.test(part),
      );
      return `${pre}${[...preferred, ...rest].join(', ')}${mid}${content}${close}`;
    },
  );
}

async function waitForSvgImages(svgEl: SVGSVGElement): Promise<void> {
  const images = [...svgEl.querySelectorAll('image')];
  await Promise.all(
    images.map(async (node) => {
      const href =
        node.getAttribute('href') ??
        node.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
      if (!href || href.startsWith('data:')) return;

      await new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = href;
      });
    }),
  );
}

function loadSvgAsImage(svg: string): Promise<HTMLImageElement> {
  const blob = new Blob([stripXmlDeclaration(svg)], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('SVG image load failed'));
    };
    image.src = url;
  });
}

/**
 * Prefer native SVG→canvas when fonts are embedded as data URLs.
 * html2canvas often substitutes system fonts for SVG `<text>`.
 */
async function rasterizeEmbeddedSvgToCanvas(
  svg: string,
  canvasWidth: number,
  canvasHeight: number,
  backgroundColor?: string | null,
): Promise<HTMLCanvasElement> {
  const sized = stripXmlDeclaration(svg).replace(
    /<svg\b/i,
    `<svg width="${canvasWidth}" height="${canvasHeight}"`,
  );

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D unavailable');

  const paint = async () => {
    const image = await loadSvgAsImage(sized);
    await image.decode().catch(() => undefined);
    await waitForPaint();

    if (backgroundColor) {
      context.fillStyle = backgroundColor;
      context.fillRect(0, 0, canvasWidth, canvasHeight);
    } else {
      context.clearRect(0, 0, canvasWidth, canvasHeight);
    }

    context.drawImage(image, 0, 0, canvasWidth, canvasHeight);
  };

  // First paint can race ahead of @font-face data URLs inside the SVG image.
  await paint();
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 80);
  });
  await paint();

  return canvas;
}

async function rasterizeMountedSvgWithHtml2Canvas(
  svg: string,
  canvasWidth: number,
  canvasHeight: number,
  backgroundColor?: string | null,
): Promise<HTMLCanvasElement> {
  await ensureSvgFontsReady(svg);

  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  Object.assign(host.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    width: `${canvasWidth}px`,
    height: `${canvasHeight}px`,
    overflow: 'hidden',
    pointerEvents: 'none',
  });
  host.innerHTML = stripXmlDeclaration(svg);
  document.body.appendChild(host);

  try {
    const svgEl = host.querySelector('svg');
    if (!svgEl) {
      throw new Error('SVG element missing');
    }

    svgEl.setAttribute('width', String(canvasWidth));
    svgEl.setAttribute('height', String(canvasHeight));

    await waitForSvgImages(svgEl);
    await ensureSvgFontsReady(svg);
    await waitForPaint();

    return await html2canvas(host, {
      backgroundColor: backgroundColor ?? null,
      scale: 1,
      width: canvasWidth,
      height: canvasHeight,
      useCORS: true,
      allowTaint: true,
      logging: false,
      imageTimeout: 15000,
    });
  } finally {
    host.remove();
  }
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
  const preparedSvg = promoteCyrillicScriptFonts(toAbsoluteSvgAssetUrls(svg));
  const embeddedSvg = await embedSvgWebFonts(preparedSvg);

  try {
    const canvas = await rasterizeEmbeddedSvgToCanvas(
      embeddedSvg,
      canvasWidth,
      canvasHeight,
      options?.backgroundColor ?? null,
    );
    return canvas.toDataURL('image/png', 0.95);
  } catch (error) {
    console.warn('[svg-rasterize] embedded font capture failed, falling back', error);
    const canvas = await rasterizeMountedSvgWithHtml2Canvas(
      embeddedSvg,
      canvasWidth,
      canvasHeight,
      options?.backgroundColor ?? null,
    );
    return canvas.toDataURL('image/png', 0.95);
  }
}
