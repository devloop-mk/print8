import { CYRILLIC_FONTS_URL } from '@/lib/designs/svg-font-cyrillic';

const loadedFontStylesheets = new Set<string>();
const rawFontCssCache = new Map<string, string>();
const inlinedFontCssCache = new Map<string, string>();

const CYRILLIC_FALLBACK_FAMILIES = [
  'Marck Script',
  'Bad Script',
  'Manrope',
  'PT Sans',
  'Noto Sans',
  'Cormorant Garamond',
  'Literata',
  'PT Serif',
  'Noto Serif',
] as const;

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

  const urls = [CYRILLIC_FONTS_URL, ...extractSvgFontImportUrls(svg)];
  await Promise.all([...new Set(urls)].map(loadStylesheet));
  await document.fonts.ready;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function inlineFontFaceUrls(css: string, baseUrl: string): Promise<string> {
  const urlPattern = /url\((['"]?)([^'")]+)\1\)/gi;
  const replacements = new Map<string, string>();

  for (const match of css.matchAll(urlPattern)) {
    const rawUrl = match[2];
    if (!rawUrl || rawUrl.startsWith('data:') || replacements.has(rawUrl)) continue;

    try {
      const absolute = new URL(rawUrl, baseUrl).href;
      const response = await fetch(absolute);
      if (!response.ok) continue;

      const mime =
        response.headers.get('content-type')?.split(';')[0]?.trim() ||
        (absolute.includes('.woff2')
          ? 'font/woff2'
          : absolute.includes('.woff')
            ? 'font/woff'
            : 'application/octet-stream');
      const base64 = arrayBufferToBase64(await response.arrayBuffer());
      replacements.set(rawUrl, `url(data:${mime};base64,${base64})`);
    } catch {
      // Keep the original URL if embedding fails.
    }
  }

  let result = css;
  for (const [rawUrl, dataUrl] of replacements) {
    result = result.replaceAll(`url(${rawUrl})`, dataUrl);
    result = result.replaceAll(`url('${rawUrl}')`, dataUrl);
    result = result.replaceAll(`url("${rawUrl}")`, dataUrl);
  }
  return result;
}

async function fetchRawFontCss(url: string): Promise<string> {
  const cached = rawFontCssCache.get(url);
  if (cached) return cached;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Font CSS fetch failed: ${response.status}`);
  }

  const css = await response.text();
  rawFontCssCache.set(url, css);
  return css;
}

/** Font families referenced by `font-family` attributes/styles in an SVG. */
export function extractSvgFontFamilies(svg: string): string[] {
  const families = new Set<string>();
  const pattern = /font-family\s*[:=]\s*["']?([^;"'<\n]+)/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(svg)) !== null) {
    for (const part of match[1].split(',')) {
      const name = part.trim().replace(/^["']|["']$/g, '');
      if (
        name &&
        !/^(serif|sans-serif|cursive|fantasy|monospace|inherit|initial|unset)$/i.test(
          name,
        )
      ) {
        families.add(name);
      }
    }
  }

  return [...families];
}

function filterCssToFontFamilies(css: string, families: Set<string>): string {
  if (families.size === 0) return css;

  const normalized = new Set([...families].map((name) => name.toLowerCase()));
  const blocks = css.split(/(?=@font-face)/i);

  return blocks
    .filter((block) => {
      if (!/@font-face/i.test(block)) return false;
      const familyMatch = /font-family\s*:\s*['"]?([^;'"{\n]+)/i.exec(block);
      if (!familyMatch) return false;
      const family = familyMatch[1].trim().replace(/['"]/g, '').toLowerCase();
      return normalized.has(family);
    })
    .join('\n')
    .trim();
}

async function fetchInlinedFontCssForFamilies(
  url: string,
  families: Set<string>,
): Promise<string> {
  const cacheKey = `${url}::${[...families].map((f) => f.toLowerCase()).sort().join('|')}`;
  const cached = inlinedFontCssCache.get(cacheKey);
  if (cached) return cached;

  const rawCss = await fetchRawFontCss(url);
  const filtered = filterCssToFontFamilies(rawCss, families);
  if (!filtered) {
    inlinedFontCssCache.set(cacheKey, '');
    return '';
  }

  const inlined = await inlineFontFaceUrls(filtered, url);
  inlinedFontCssCache.set(cacheKey, inlined);
  return inlined;
}

/**
 * Replace `@import` font stylesheets with `@font-face` rules that use data-URL
 * font files. Required for reliable SVG→PNG capture (html2canvas / Image).
 */
export async function embedSvgWebFonts(svg: string): Promise<string> {
  const importUrls = extractSvgFontImportUrls(svg);
  const urls = [...new Set([CYRILLIC_FONTS_URL, ...importUrls])];
  const usedFamilies = new Set([
    ...extractSvgFontFamilies(svg),
    ...CYRILLIC_FALLBACK_FAMILIES,
  ]);

  const cssBlocks = await Promise.all(
    urls.map(async (url) => {
      try {
        return await fetchInlinedFontCssForFamilies(url, usedFamilies);
      } catch {
        return '';
      }
    }),
  );

  const embeddedCss = cssBlocks.filter(Boolean).join('\n');
  if (!embeddedCss) return svg;

  let result = svg.replace(/@import\s+url\(['"]?[^'")]+['"]?\)\s*;?/gi, '');

  const styleOpen = /(<style\b[^>]*>)/i.exec(result);
  if (styleOpen && styleOpen.index != null) {
    const insertAt = styleOpen.index + styleOpen[0].length;
    result =
      result.slice(0, insertAt) +
      `\n/* print8 embedded fonts */\n${embeddedCss}\n` +
      result.slice(insertAt);
    return result;
  }

  const svgOpen = /<svg\b[^>]*>/i.exec(result);
  if (!svgOpen || svgOpen.index == null) return svg;

  const insertAt = svgOpen.index + svgOpen[0].length;
  const styleBlock = `<defs><style type="text/css"><![CDATA[\n${embeddedCss}\n]]></style></defs>`;
  return result.slice(0, insertAt) + styleBlock + result.slice(insertAt);
}
