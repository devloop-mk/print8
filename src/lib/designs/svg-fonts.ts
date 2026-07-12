const loadedFontStylesheets = new Set<string>();

/** Google Fonts `@import` URLs embedded in design SVG `<style>` blocks. */
export function extractSvgFontImportUrls(svg: string): string[] {
  const urls: string[] = [];
  const importPattern = /@import\s+url\(['"]?([^'")]+)['"]?\)/gi;
  let match: RegExpExecArray | null;
  while ((match = importPattern.exec(svg)) !== null) {
    urls.push(match[1].replace(/&amp;/g, '&'));
  }
  return [...new Set(urls)];
}

function loadStylesheet(url: string): Promise<void> {
  if (loadedFontStylesheets.has(url)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLLinkElement>(
      `link[data-print8-svg-font="${CSS.escape(url)}"]`,
    );
    if (existing) {
      loadedFontStylesheets.add(url);
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.dataset.print8SvgFont = url;
    link.onload = () => {
      loadedFontStylesheets.add(url);
      resolve();
    };
    link.onerror = () => resolve();
    document.head.appendChild(link);
  });
}

/** Load fonts referenced by an SVG before rasterizing or exporting. */
export async function ensureSvgFontsReady(svg: string): Promise<void> {
  if (typeof document === 'undefined') return;

  const urls = extractSvgFontImportUrls(svg);
  await Promise.all(urls.map(loadStylesheet));
  await document.fonts.ready;
}
