/**
 * Maps each customizable design SVG to its full-bleed background PNG.
 * Source filenames match the original file:// asset names from the design exports.
 */
import { resolveCanvasAssetUrl } from '@/lib/storage/asset-url';

export const SVG_DESIGN_BACKGROUND_MAP = [
  {
    designSvg: '/NEW_DESIGNS/wedding/wedding-print-beach.svg',
    backgroundFile: 'wedding-bg-beach.png',
    backgroundPath: '/NEW_DESIGNS/backgrounds/wedding-bg-beach.png',
  },
  {
    designSvg: '/NEW_DESIGNS/wedding/wedding-print-autumn.svg',
    backgroundFile: 'wedding-bg-autumn.png',
    backgroundPath: '/NEW_DESIGNS/backgrounds/wedding-bg-autumn.png',
  },
  {
    designSvg: '/NEW_DESIGNS/wedding/wedding-print-celestial.svg',
    backgroundFile: 'wedding-bg-celestial.png',
    backgroundPath: '/NEW_DESIGNS/backgrounds/wedding-bg-celestial.png',
  },
  {
    designSvg: '/NEW_DESIGNS/wedding/wedding-print-watercolor.svg',
    backgroundFile: 'wedding-bg-watercolor.png',
    backgroundPath: '/NEW_DESIGNS/backgrounds/wedding-bg-watercolor.png',
  },
  {
    designSvg: '/NEW_DESIGNS/wedding/wedding-print-winter.svg',
    backgroundFile: 'wedding-bg-winter.png',
    backgroundPath: '/NEW_DESIGNS/backgrounds/wedding-bg-winter.png',
  },
  {
    designSvg: '/NEW_DESIGNS/wedding/wedding-print-terracotta.svg',
    backgroundFile: 'wedding-bg-terracotta.png',
    backgroundPath: '/NEW_DESIGNS/backgrounds/wedding-bg-terracotta.png',
  },
  {
    designSvg: '/NEW_DESIGNS/birthday/bday-print-gold.svg',
    backgroundFile: 'bday-bg-gold.png',
    backgroundPath: '/NEW_DESIGNS/backgrounds/bday-bg-gold.png',
  },
  {
    designSvg: '/NEW_DESIGNS/birthday/bday-print-rosegold.svg',
    backgroundFile: 'bday-bg-rosegold.png',
    backgroundPath: '/NEW_DESIGNS/backgrounds/bday-bg-rosegold.png',
  },
  {
    designSvg: '/NEW_DESIGNS/birthday/bday-print-princess.svg',
    backgroundFile: 'bday-bg-princess.png',
    backgroundPath: '/NEW_DESIGNS/backgrounds/bday-bg-princess.png',
  },
  {
    designSvg: '/NEW_DESIGNS/birthday/bday-print-dino.svg',
    backgroundFile: 'bday-bg-dino.png',
    backgroundPath: '/NEW_DESIGNS/backgrounds/bday-bg-dino.png',
  },
  {
    designSvg: '/NEW_DESIGNS/birthday/bday-print-champagne.svg',
    backgroundFile: 'bday-bg-champagne.png',
    backgroundPath: '/NEW_DESIGNS/backgrounds/bday-bg-champagne.png',
  },
  {
    designSvg: '/NEW_DESIGNS/birthday/bday-print-unicorn.svg',
    backgroundFile: 'bday-bg-unicorn.png',
    backgroundPath: '/NEW_DESIGNS/backgrounds/bday-bg-unicorn.png',
  },
  {
    designSvg: '/NEW_DESIGNS/birthday/bday-print-bbq.svg',
    backgroundFile: 'bday-bg-bbq.png',
    backgroundPath: '/NEW_DESIGNS/backgrounds/bday-bg-bbq.png',
  },
  {
    designSvg: '/NEW_DESIGNS/birthday/bday-print-retro.svg',
    backgroundFile: 'bday-bg-retro.png',
    backgroundPath: '/NEW_DESIGNS/backgrounds/bday-bg-retro.png',
  },
  {
    designSvg: '/NEW_DESIGNS/birthday/bday-print-construction.svg',
    backgroundFile: 'bday-bg-construction.png',
    backgroundPath: '/NEW_DESIGNS/backgrounds/bday-bg-construction.png',
  },
  {
    designSvg: '/NEW_DESIGNS/birthday/bday-print-mermaid.svg',
    backgroundFile: 'bday-bg-mermaid.png',
    backgroundPath: '/NEW_DESIGNS/backgrounds/bday-bg-mermaid.png',
  },
  {
    designSvg: '/NEW_DESIGNS/birthday/bday-print-safari.svg',
    backgroundFile: 'bday-bg-safari.png',
    backgroundPath: '/NEW_DESIGNS/backgrounds/bday-bg-safari.png',
  },
  {
    designSvg: '/NEW_DESIGNS/birthday/bday-print-space.svg',
    backgroundFile: 'bday-bg-space.png',
    backgroundPath: '/NEW_DESIGNS/backgrounds/bday-bg-space.png',
  },
  {
    designSvg: '/NEW_DESIGNS/menu-print-rustic-front.svg',
    backgroundFile: 'menu-bg-rustic-front.png',
    backgroundPath: '/NEW_DESIGNS/backgrounds/menu-bg-rustic-front.png',
  },
  {
    designSvg: '/NEW_DESIGNS/menu-print-rustic-back.svg',
    backgroundFile: 'menu-bg-rustic-back.png',
    backgroundPath: '/NEW_DESIGNS/backgrounds/menu-bg-rustic-back.png',
  },
  {
    designSvg: '/NEW_DESIGNS/menu-print-finedining-front.svg',
    backgroundFile: 'menu-bg-finedining-front.png',
    backgroundPath: '/NEW_DESIGNS/backgrounds/menu-bg-finedining-front.png',
  },
  {
    designSvg: '/NEW_DESIGNS/menu-print-finedining-back.svg',
    backgroundFile: 'menu-bg-finedining-back.png',
    backgroundPath: '/NEW_DESIGNS/backgrounds/menu-bg-finedining-back.png',
  },
  {
    designSvg: '/NEW_DESIGNS/menus/menu-print-sushi-front.svg',
    backgroundFile: 'menu-bg-sushi-front.png',
    backgroundPath: '/NEW_DESIGNS/backgrounds/menu-bg-sushi-front.png',
  },
  {
    designSvg: '/NEW_DESIGNS/menus/menu-print-sushi-back.svg',
    backgroundFile: 'menu-bg-sushi-back.png',
    backgroundPath: '/NEW_DESIGNS/backgrounds/menu-bg-sushi-back.png',
  },
  {
    designSvg: '/NEW_DESIGNS/menus/menu-print-seafood-front.svg',
    backgroundFile: 'menu-bg-seafood-front.png',
    backgroundPath: '/NEW_DESIGNS/backgrounds/menu-bg-seafood-front.png',
  },
  {
    designSvg: '/NEW_DESIGNS/menus/menu-print-seafood-back.svg',
    backgroundFile: 'menu-bg-seafood-back.png',
    backgroundPath: '/NEW_DESIGNS/backgrounds/menu-bg-seafood-back.png',
  },
  {
    designSvg: '/NEW_DESIGNS/menus/menu-print-cafe-front.svg',
    backgroundFile: 'menu-bg-cafe-front.png',
    backgroundPath: '/NEW_DESIGNS/backgrounds/menu-bg-cafe-front.png',
  },
  {
    designSvg: '/NEW_DESIGNS/menus/menu-print-cafe-back.svg',
    backgroundFile: 'menu-bg-cafe-back.png',
    backgroundPath: '/NEW_DESIGNS/backgrounds/menu-bg-cafe-back.png',
  },
] as const;

/** Lookup by original embedded filename (e.g. from file:// exports). */
export const SVG_BACKGROUND_ASSETS: Record<string, string> = Object.fromEntries(
  SVG_DESIGN_BACKGROUND_MAP.map((entry) => [entry.backgroundFile, entry.backgroundPath]),
);

const designBackgroundByPath = new Map<string, string>(
  SVG_DESIGN_BACKGROUND_MAP.map((entry) => [entry.designSvg, entry.backgroundPath]),
);

export function getDesignBackgroundPath(designSvgPath: string): string | undefined {
  return designBackgroundByPath.get(designSvgPath);
}

export function resolveSvgEmbeddedImages(svg: string, designSvgPath?: string): string {
  const expectedBackground = designSvgPath
    ? getDesignBackgroundPath(designSvgPath)
    : undefined;

  return svg.replace(
    /<image\b([^>]*?)\s(?:xlink:)?href="([^"]+)"([^>]*)\/?>/gi,
    (match, before, href, after) => {
      const filename = href.split(/[/\\]/).pop()?.split('?')[0];
      if (!filename) return match;

      const publicPath =
        SVG_BACKGROUND_ASSETS[filename] ??
        (expectedBackground && href.includes(filename.replace(/\.(png|svg)$/i, ''))
          ? expectedBackground
          : undefined);

      if (!publicPath) {
        if (href.startsWith('file:')) return '';
        return match;
      }

      const trailing = after.replace(/\s*\/?\s*$/, '');
      return `<image${before} href="${publicPath}"${trailing}/>`;
    },
  );
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}

/** Inline /NEW_DESIGNS background refs so rasterization and print files are self-contained. */
export async function embedSvgExternalImages(svg: string): Promise<string> {
  const hrefPattern = /(?:xlink:)?href="(\/NEW_DESIGNS\/[^"]+)"/g;
  const urls = [...new Set([...svg.matchAll(hrefPattern)].map((match) => match[1]))];
  if (urls.length === 0) return svg;

  let result = svg;
  for (const url of urls) {
    const response = await fetch(resolveCanvasAssetUrl(url));
    if (!response.ok) continue;
    const dataUrl = await blobToDataUrl(await response.blob());
    result = result.replaceAll(`href="${url}"`, `href="${dataUrl}"`);
  }

  return result;
}

export function toAbsoluteSvgAssetUrls(svg: string): string {
  if (typeof window === 'undefined') return svg;
  return svg.replace(
    /(\s(?:xlink:)?href=")(\/NEW_DESIGNS\/[^"]+)"/g,
    (_, prefix: string, catalogPath: string) =>
      `${prefix}${resolveCanvasAssetUrl(catalogPath)}"`,
  );
}
