import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import type { NextRequest } from 'next/server';
import { LOGO_HORIZONTAL_LIGHT } from '@/lib/brand/logos';
import { absoluteUrl } from '@/lib/seo/site';
import {
  resolveAssetUrl,
  toCatalogStoragePath,
  isRemoteAssetUrl,
} from '@/lib/storage/asset-url';
import { isAllowedOgRasterUrl } from '@/lib/security/og-fetch-allowlist';
import { enforceRateLimit } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const RESPONSE_HEADERS = {
  'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
};
const RENDER_TIMEOUT_MS = 8000;
const MAX_FETCH_BYTES = 8 * 1024 * 1024;

/** Matches design-overlay DEFAULT_OVERLAY_POSITION / DEFAULT_OVERLAY_SCALE. */
const DEFAULT_PLACEMENT = { x: 50, y: 54, scale: 40 };

// 1x1 transparent PNG — absolute last-resort body so a meta-tag inspector
// always gets back real image bytes instead of an HTML error page.
const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

/**
 * Compositor for design/product-design share images.
 *
 * Supports:
 * 1. Mockup + overlay panels (`m0`/`o0`/`x0`/`y0`/`s0`/`z0`, optional second panel)
 *    — garment/product photo with design art placed like the PDP preview.
 * 2. Pre-composited image panels (`i0`, optional `i1`).
 * 3. Legacy raw artwork (`a` / `b`) side by side on white cards.
 *
 * Never touches satori/next-og or SVG for panel art — only raster png/jpg/webp
 * via sharp. Brand logo SVG is rasterized locally for the top-center mark.
 *
 * Production note: `public/**` is excluded from serverless file tracing
 * (`next.config` outputFileTracingExcludes). Prefer HTTP fetch of CDN/site
 * URLs; disk reads only work locally or for the few `og/` + `logo/` files we
 * re-include.
 */
function isSvgPath(value: string) {
  return /\.svg(\?.*)?$/i.test(value);
}

const ALLOWED_RASTER_EXT = /\.(png|jpe?g|webp)(\?.*)?$/i;

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

async function fetchRasterUrl(url: string): Promise<Buffer | null> {
  if (!isAllowedOgRasterUrl(url)) {
    console.warn('[api/og/design] Blocked fetch to non-allowlisted host:', url);
    return null;
  }

  try {
    // encodeURI keeps already-encoded sequences but encodes spaces in paths.
    const response = await withTimeout(
      fetch(encodeURI(url)),
      RENDER_TIMEOUT_MS,
      'design og fetch',
    );
    if (!response.ok) return null;
    const length = Number(response.headers.get('content-length') ?? 0);
    if (length > MAX_FETCH_BYTES) return null;
    const buf = Buffer.from(await response.arrayBuffer());
    if (buf.byteLength > MAX_FETCH_BYTES) return null;
    return buf;
  } catch (error) {
    console.error('[api/og/design] Failed to fetch image:', url, error);
    return null;
  }
}

/**
 * Load a raster for compositing. Query values may be:
 * - absolute CDN URLs (`resolveAssetUrl` / `toOgAssetRef`)
 * - site-absolute URLs
 * - legacy site-relative `public/` paths
 *
 * Disk is attempted first for relative paths (local/dev). Production falls
 * through to CDN then the site origin, because serverless has no `public/`.
 */
async function loadRasterBuffer(value: string | null): Promise<Buffer | null> {
  if (!value) return null;
  if (isSvgPath(value) || !ALLOWED_RASTER_EXT.test(value)) return null;

  const withoutQuery = value.split('?')[0] ?? value;

  if (/^https?:/i.test(withoutQuery)) {
    const primary = await fetchRasterUrl(withoutQuery);
    if (primary) return primary;

    // CDN miss → try the same asset from the site static origin when the URL
    // maps back to a catalog-relative path.
    const local = toCatalogStoragePath(withoutQuery);
    if (local.startsWith('/') && !isRemoteAssetUrl(local)) {
      const siteUrl = absoluteUrl(local.split('?')[0] ?? local);
      if (siteUrl !== withoutQuery) {
        return fetchRasterUrl(siteUrl);
      }
    }
    return null;
  }

  const normalized = withoutQuery.startsWith('/')
    ? withoutQuery
    : `/${withoutQuery}`;
  const relative = normalized.slice(1);

  try {
    const filePath = path.join(
      process.cwd(),
      'public',
      decodeURIComponent(relative),
    );
    return await readFile(filePath);
  } catch {
    // Expected in production serverless — fall through to HTTP.
  }

  const resolved = resolveAssetUrl(normalized);
  if (/^https?:/i.test(resolved)) {
    const fromCdn = await fetchRasterUrl(resolved.split('?')[0] ?? resolved);
    if (fromCdn) return fromCdn;
  }

  return fetchRasterUrl(absoluteUrl(normalized));
}

let cachedBackground: Buffer | null | undefined;
let cachedLogo: Buffer | null | undefined;

async function getBackgroundBuffer(): Promise<Buffer> {
  if (cachedBackground === undefined) {
    try {
      cachedBackground = await readFile(
        path.join(process.cwd(), 'public', 'og', 'design-bg.jpg'),
      );
    } catch {
      cachedBackground =
        (await fetchRasterUrl(absoluteUrl('/og/design-bg.jpg'))) ?? null;
      if (!cachedBackground) {
        console.error('[api/og/design] Failed to load background asset');
      }
    }
  }
  if (cachedBackground) return cachedBackground;

  return sharp({
    create: { width: OG_WIDTH, height: OG_HEIGHT, channels: 3, background: { r: 28, g: 67, b: 95 } },
  })
    .jpeg()
    .toBuffer();
}

/** Small light brand mark for the blue OG card (top-center). */
async function getLogoBuffer(): Promise<Buffer | null> {
  if (cachedLogo !== undefined) return cachedLogo;

  try {
    const relativePath = decodeURIComponent(LOGO_HORIZONTAL_LIGHT).replace(/^\//, '');
    const svg = await readFile(
      path.join(process.cwd(), 'public', relativePath),
    );
    cachedLogo = await sharp(svg)
      .resize({ width: 200, fit: 'inside' })
      .png()
      .toBuffer();
  } catch (error) {
    console.error('[api/og/design] Failed to load brand logo:', error);
    cachedLogo = null;
  }
  return cachedLogo;
}

type Placement = { x: number; y: number; scale: number };

/**
 * Place an overlay using the same model as `getDesignOverlayLayerStyle`:
 * left/top % of the square frame, width = scale%, centered via translate(-50%,-50%).
 * Crops correctly when the layer overflows (tall couple art) — never clamps
 * destination offsets, which would shift the design.
 */
async function buildOverlayLayer(
  overlayBuffer: Buffer,
  placement: Placement,
  canvasSize: number,
): Promise<sharp.OverlayOptions | null> {
  const overlayW = Math.max(1, Math.round((canvasSize * placement.scale) / 100));
  const resizedOverlay = await sharp(overlayBuffer)
    .resize({ width: overlayW, fit: 'inside' })
    .ensureAlpha()
    .png()
    .toBuffer();
  const om = await sharp(resizedOverlay).metadata();
  const ow = om.width ?? overlayW;
  const oh = om.height ?? overlayW;
  const left = Math.round((canvasSize * placement.x) / 100 - ow / 2);
  const top = Math.round((canvasSize * placement.y) / 100 - oh / 2);

  if (left >= 0 && top >= 0 && left + ow <= canvasSize && top + oh <= canvasSize) {
    return { input: resizedOverlay, left, top };
  }

  // Visible intersection of overlay rect with the canvas.
  const dstLeft = Math.max(0, left);
  const dstTop = Math.max(0, top);
  const dstRight = Math.min(canvasSize, left + ow);
  const dstBottom = Math.min(canvasSize, top + oh);
  const width = dstRight - dstLeft;
  const height = dstBottom - dstTop;
  if (width <= 0 || height <= 0) return null;

  const cropped = await sharp(resizedOverlay)
    .extract({
      left: dstLeft - left,
      top: dstTop - top,
      width,
      height,
    })
    .png()
    .toBuffer();

  return { input: cropped, left: dstLeft, top: dstTop };
}

/**
 * Square canvas matching ProductMockupFrame: mockup object-contain, overlay
 * positioned with left/top % of the frame and width = scale% (centered).
 * Optional displayScale mirrors PDP `transform: scale(...)` + overflow clip.
 */
async function compositeMockupOverlay(
  mockupBuffer: Buffer,
  overlayBuffer: Buffer | null,
  placement: Placement,
  canvasSize: number,
  displayScale = 1,
): Promise<Buffer> {
  const canvas = await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  const mockupMeta = await sharp(mockupBuffer).metadata();
  const mw = mockupMeta.width ?? canvasSize;
  const mh = mockupMeta.height ?? canvasSize;
  const fit = Math.min(canvasSize / mw, canvasSize / mh);
  const rw = Math.max(1, Math.round(mw * fit));
  const rh = Math.max(1, Math.round(mh * fit));
  const mx = Math.round((canvasSize - rw) / 2);
  const my = Math.round((canvasSize - rh) / 2);

  const resizedMockup = await sharp(mockupBuffer)
    .resize(rw, rh, { fit: 'fill' })
    .png()
    .toBuffer();

  const layers: sharp.OverlayOptions[] = [
    { input: resizedMockup, left: mx, top: my },
  ];

  if (overlayBuffer) {
    const overlayLayer = await buildOverlayLayer(
      overlayBuffer,
      placement,
      canvasSize,
    );
    if (overlayLayer) layers.push(overlayLayer);
  }

  let composited = await sharp(canvas).composite(layers).png().toBuffer();

  // Match ProductMockupFrame overflow-hidden + inner scale transform: crop the
  // center window of size canvas/scale and enlarge back to canvasSize.
  const scale =
    Number.isFinite(displayScale) && displayScale > 1 ? displayScale : 1;
  if (scale > 1.001) {
    const cropSize = Math.max(1, Math.round(canvasSize / scale));
    const cropLeft = Math.round((canvasSize - cropSize) / 2);
    const cropTop = Math.round((canvasSize - cropSize) / 2);
    composited = await sharp(composited)
      .extract({
        left: cropLeft,
        top: cropTop,
        width: cropSize,
        height: cropSize,
      })
      .resize(canvasSize, canvasSize, { fit: 'fill' })
      .png()
      .toBuffer();
  }

  return composited;
}

/** White card holding a single design/mockup image, contained or covered. */
async function buildCard(
  imageBuffer: Buffer,
  cardWidth: number,
  cardHeight: number,
  padding: number,
  fit: 'contain' | 'cover' = 'contain',
): Promise<Buffer> {
  const innerWidth = Math.max(cardWidth - padding * 2, 1);
  const innerHeight = Math.max(cardHeight - padding * 2, 1);

  const resizedArt = await sharp(imageBuffer)
    .resize({
      width: innerWidth,
      height: innerHeight,
      fit,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer();

  const artMeta = await sharp(resizedArt).metadata();
  const artWidth = artMeta.width ?? innerWidth;
  const artHeight = artMeta.height ?? innerHeight;
  const left = Math.round((cardWidth - artWidth) / 2);
  const top = Math.round((cardHeight - artHeight) / 2);

  const whiteCard = await sharp({
    create: { width: cardWidth, height: cardHeight, channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .png()
    .toBuffer();

  return sharp(whiteCard)
    .composite([{ input: resizedArt, left, top }])
    .png()
    .toBuffer();
}

async function buildDesignOgImage(images: Buffer[]): Promise<Buffer> {
  const background = await getBackgroundBuffer();
  const composites: sharp.OverlayOptions[] = [];

  // Leave a strip at the top for the brand mark.
  const logoReserve = 48;
  const availableHeight = OG_HEIGHT - logoReserve;

  if (images.length >= 2) {
    // Square cards — mockup composites are square; landscape cards left
    // large white side gutters and made designs look undersized.
    const cardSize = Math.min(530, availableHeight - 6);
    const gap = 20;
    const padding = 6;
    const totalWidth = cardSize * 2 + gap;
    const startX = Math.round((OG_WIDTH - totalWidth) / 2);
    const top =
      logoReserve + Math.round((availableHeight - cardSize) / 2);

    const [cardA, cardB] = await Promise.all([
      buildCard(images[0], cardSize, cardSize, padding),
      buildCard(images[1], cardSize, cardSize, padding),
    ]);
    composites.push({ input: cardA, left: startX, top });
    composites.push({ input: cardB, left: startX + cardSize + gap, top });
  } else {
    // Large square card — mockup composites are square; a wide cover-fit
    // card clipped collar/hem. Fill height to minimize empty blue.
    const cardSize = Math.min(560, availableHeight - 4);
    const padding = 4;
    const left = Math.round((OG_WIDTH - cardSize) / 2);
    const top =
      logoReserve + Math.round((availableHeight - cardSize) / 2);
    const card = await buildCard(images[0], cardSize, cardSize, padding);
    composites.push({ input: card, left, top });
  }

  const logo = await getLogoBuffer();
  if (logo) {
    const logoMeta = await sharp(logo).metadata();
    const logoW = logoMeta.width ?? 200;
    const logoH = logoMeta.height ?? 40;
    composites.push({
      input: logo,
      left: Math.round((OG_WIDTH - logoW) / 2),
      top: Math.max(10, Math.round((logoReserve - logoH) / 2) + 4),
    });
  }

  return sharp(background)
    .resize(OG_WIDTH, OG_HEIGHT)
    .composite(composites)
    .jpeg({ quality: 88 })
    .toBuffer();
}

function parsePlacement(searchParams: URLSearchParams, index: number): Placement {
  const x = Number(searchParams.get(`x${index}`) ?? String(DEFAULT_PLACEMENT.x));
  const y = Number(searchParams.get(`y${index}`) ?? String(DEFAULT_PLACEMENT.y));
  const scale = Number(
    searchParams.get(`s${index}`) ?? String(DEFAULT_PLACEMENT.scale),
  );
  return {
    x: Number.isFinite(x) ? x : DEFAULT_PLACEMENT.x,
    y: Number.isFinite(y) ? y : DEFAULT_PLACEMENT.y,
    scale: Number.isFinite(scale) && scale > 0 ? scale : DEFAULT_PLACEMENT.scale,
  };
}

function parseDisplayScale(searchParams: URLSearchParams, index: number): number {
  const z = Number(searchParams.get(`z${index}`) ?? '1');
  if (!Number.isFinite(z) || z <= 0) return 1;
  // Clamp to a sane range used by storefront mockup zooms.
  return Math.min(Math.max(z, 1), 2.5);
}

async function resolvePanelBuffer(
  searchParams: URLSearchParams,
  index: number,
): Promise<Buffer | null> {
  const image = searchParams.get(`i${index}`);
  if (image) {
    return loadRasterBuffer(image);
  }

  const mockup = searchParams.get(`m${index}`);
  if (mockup) {
    const mockupBuffer = await loadRasterBuffer(mockup);
    if (!mockupBuffer) return null;
    const overlayBuffer = await loadRasterBuffer(searchParams.get(`o${index}`));
    const placement = parsePlacement(searchParams, index);
    const displayScale = parseDisplayScale(searchParams, index);
    // Composite at a resolution large enough for the OG card (~500–980px).
    return compositeMockupOverlay(
      mockupBuffer,
      overlayBuffer,
      placement,
      900,
      displayScale,
    );
  }

  return null;
}

/**
 * Node's `Buffer<ArrayBufferLike>` is a valid runtime `BodyInit` (it's a
 * `Uint8Array` under the hood), but TS's DOM lib types `BodyInit` in terms of
 * `Uint8Array<ArrayBuffer>` specifically, so it doesn't type-check directly.
 */
function toBodyInit(buffer: Buffer): BodyInit {
  return buffer as unknown as BodyInit;
}

async function fallbackResponse(): Promise<Response> {
  try {
    const fallback = await readFile(
      path.join(process.cwd(), 'public', 'og', 'default.jpg'),
    );
    return new Response(toBodyInit(fallback), {
      status: 200,
      headers: { ...RESPONSE_HEADERS, 'Content-Type': 'image/jpeg' },
    });
  } catch {
    const fetched = await fetchRasterUrl(absoluteUrl('/og/default.jpg'));
    if (fetched) {
      return new Response(toBodyInit(fetched), {
        status: 200,
        headers: { ...RESPONSE_HEADERS, 'Content-Type': 'image/jpeg' },
      });
    }
    console.error('[api/og/design] Fallback default.jpg unavailable');
  }
  return new Response(toBodyInit(TRANSPARENT_PNG), {
    status: 200,
    headers: { ...RESPONSE_HEADERS, 'Content-Type': 'image/png' },
  });
}

export async function GET(request: NextRequest) {
  const rateLimited = enforceRateLimit(
    request,
    'og-design',
    60,
    60 * 60 * 1000,
  );
  if (rateLimited) return rateLimited;

  const { searchParams } = new URL(request.url);

  try {
    const panelBuffers = await Promise.all([
      resolvePanelBuffer(searchParams, 0),
      resolvePanelBuffer(searchParams, 1),
    ]);
    let images = panelBuffers.filter((value): value is Buffer => Boolean(value));

    // Legacy raw-artwork params (`a` / `b`) — side-by-side without mockup.
    if (images.length === 0) {
      const [bufferA, bufferB] = await Promise.all([
        loadRasterBuffer(searchParams.get('a')),
        loadRasterBuffer(searchParams.get('b')),
      ]);
      images = [bufferA, bufferB].filter((value): value is Buffer => Boolean(value));
    }

    if (images.length > 0) {
      const jpeg = await withTimeout(
        buildDesignOgImage(images),
        RENDER_TIMEOUT_MS,
        'design og composite',
      );
      return new Response(toBodyInit(jpeg), {
        status: 200,
        headers: { ...RESPONSE_HEADERS, 'Content-Type': 'image/jpeg' },
      });
    }
  } catch (error) {
    console.error('[api/og/design] Composite render failed, falling back:', error);
  }

  return fallbackResponse();
}
