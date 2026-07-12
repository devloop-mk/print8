import html2canvas from 'html2canvas';
import { toAbsoluteSvgAssetUrls } from '@/lib/designs/svg-background-assets';
import { ensureSvgFontsReady } from '@/lib/designs/svg-fonts';
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

  await ensureSvgFontsReady(preparedSvg);

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
  host.innerHTML = stripXmlDeclaration(preparedSvg);
  document.body.appendChild(host);

  try {
    const svgEl = host.querySelector('svg');
    if (!svgEl) {
      throw new Error('SVG element missing');
    }

    svgEl.setAttribute('width', String(canvasWidth));
    svgEl.setAttribute('height', String(canvasHeight));

    await waitForSvgImages(svgEl);
    await ensureSvgFontsReady(preparedSvg);
    await waitForPaint();

    // Canvas drawImage() does not accept SVGSVGElement — rasterize the mounted
    // DOM node so document fonts (preloaded above) apply to SVG text.
    const canvas = await html2canvas(host, {
      backgroundColor: options?.backgroundColor ?? null,
      scale: 1,
      width: canvasWidth,
      height: canvasHeight,
      useCORS: true,
      allowTaint: true,
      logging: false,
      imageTimeout: 15000,
    });

    return canvas.toDataURL('image/png', 0.95);
  } finally {
    host.remove();
  }
}
