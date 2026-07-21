import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ImageResponse } from 'next/og';
import { absoluteUrl } from '@/lib/seo/site';
import { OgImageLayout, type OgImageContent } from '@/lib/seo/og-template';
import { LOGO_HORIZONTAL_LIGHT } from '@/lib/brand/logos';

export const runtime = 'nodejs';

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const RESPONSE_HEADERS = {
  'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
};

// 1x1 transparent PNG — absolute last-resort body so a meta-tag inspector
// always gets back real image bytes instead of an HTML error page.
const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

function readParam(value: string | null, max: number, fallback = '') {
  const text = (value ?? fallback).trim();
  if (!text) return fallback;
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * satori/resvg (which power `next/og`'s ImageResponse) only reliably decode
 * PNG/JPEG/GIF bitmaps. SVG support depends on the fetch response's
 * Content-Type matching `image/svg+xml` *exactly* (no `; charset=...`
 * suffix, which static file servers commonly add) and on the SVG having a
 * parseable `viewBox`/width+height. Either can silently fail or throw deep
 * inside satori/resvg, so we never hand satori a remote `.svg` URL for the
 * preview image — only known-safe raster formats are allowed through.
 */
function isSvgPath(value: string) {
  return /\.svg(\?.*)?$/i.test(value);
}

/**
 * Preview images may already be absolute (e.g. served from a CDN via
 * resolveAssetUrl) or relative to this site (public/ paths). Satori needs a
 * fully-qualified URL either way to fetch the bitmap.
 */
function resolvePreviewImageUrl(value: string | null): string | undefined {
  if (!value) return undefined;
  if (isSvgPath(value)) return undefined;
  if (value.startsWith('data:')) return value;
  if (/^https?:/i.test(value)) return encodeURI(value);
  if (value.startsWith('/')) return encodeURI(absoluteUrl(value));
  return undefined;
}

/**
 * Read the brand logo straight off disk and inline it as a base64 data URI
 * instead of asking satori to fetch it back over HTTP. This removes a
 * network round-trip into the app on every single OG image render (which
 * can hang or fail if `NEXT_PUBLIC_SITE_URL`/deployment URL is unreachable)
 * and sidesteps satori's fragile remote-SVG content-type sniffing — the
 * logo is on every render, so it's the highest-value asset to bulletproof.
 * Cached per server instance since the file never changes at runtime.
 */
let cachedLogoDataUri: string | null | undefined;

function getLogoDataUri(): string | undefined {
  if (cachedLogoDataUri === undefined) {
    try {
      const relativePath = decodeURIComponent(LOGO_HORIZONTAL_LIGHT);
      const filePath = path.join(process.cwd(), 'public', relativePath);
      const svg = readFileSync(filePath, 'utf8');
      cachedLogoDataUri = `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
    } catch (error) {
      console.error('[api/og] Failed to read brand logo asset:', error);
      cachedLogoDataUri = null;
    }
  }
  return cachedLogoDataUri ?? undefined;
}

const RENDER_TIMEOUT_MS = 8000;

/**
 * Guards against a hung render (e.g. a CDN asset fetch that never resolves)
 * eating the whole serverless function timeout, which would otherwise also
 * surface to inspectors as a missing/incomplete image response.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * `next/og`'s `ImageResponse` renders lazily: the constructor returns
 * immediately with a `ReadableStream` whose body is only actually produced
 * (satori layout + resvg rasterization + any image fetches) once something
 * reads it — which normally happens *after* this route handler has already
 * returned, while Next.js is streaming the response to the client. A
 * try/catch around `new ImageResponse(...)` therefore never sees render
 * failures; the request just gets a 200 with headers already sent and a
 * truncated/empty body, which is exactly what "URL did not return an image"
 * reports. Reading the body ourselves with `arrayBuffer()` forces the render
 * to happen now, inside our own try/catch, so failures are catchable and we
 * can fall back before anything is sent to the client.
 */
async function renderImageBuffer(content: OgImageContent) {
  const response = new ImageResponse(<OgImageLayout {...content} />, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
  });
  const buffer = await withTimeout(response.arrayBuffer(), RENDER_TIMEOUT_MS, 'OG render');
  return buffer;
}

function imageBufferResponse(buffer: ArrayBuffer) {
  return new Response(buffer, {
    status: 200,
    headers: { ...RESPONSE_HEADERS, 'Content-Type': 'image/png' },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') === 'en' ? 'en' : 'mk';
  const defaultDescription =
    locale === 'mk'
      ? 'Визит карти, покани, маици, чашки и персонализирани производи.'
      : 'Business cards, invitations, apparel, mugs and personalized products.';

  const title = readParam(searchParams.get('title'), 80, 'Print 8');
  const description = readParam(searchParams.get('description'), 140, defaultDescription);
  const badge = readParam(searchParams.get('badge'), 40) || undefined;
  const subtitle = readParam(searchParams.get('subtitle'), 60) || undefined;
  const previewImageUrl = resolvePreviewImageUrl(searchParams.get('image'));
  const logoUrl = getLogoDataUri();

  // Never throw without a fallback image: try the full render, then retry
  // without the (most likely to fail) preview image, then fall back to a
  // fully self-contained render with no external assets at all, then — if
  // even that somehow fails — a static 1x1 PNG. Every branch returns a real
  // image response so a meta-tag inspector never sees an HTML error page.
  try {
    const buffer = await renderImageBuffer({
      locale,
      title,
      description,
      badge,
      subtitle,
      previewImageUrl,
      logoUrl,
    });
    return imageBufferResponse(buffer);
  } catch (error) {
    console.error('[api/og] Primary render failed, retrying without preview image:', error);
  }

  if (previewImageUrl) {
    try {
      const buffer = await renderImageBuffer({ locale, title, description, badge, subtitle, logoUrl });
      return imageBufferResponse(buffer);
    } catch (error) {
      console.error('[api/og] Retry without preview image failed, falling back:', error);
    }
  }

  try {
    const buffer = await renderImageBuffer({
      locale,
      title: 'Print 8',
      description: defaultDescription,
    });
    return imageBufferResponse(buffer);
  } catch (error) {
    console.error('[api/og] Fully-fallback render failed, returning static image:', error);
  }

  return new Response(TRANSPARENT_PNG, {
    status: 200,
    headers: { ...RESPONSE_HEADERS, 'Content-Type': 'image/png' },
  });
}
