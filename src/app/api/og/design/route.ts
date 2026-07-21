import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export const runtime = 'nodejs';

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const RESPONSE_HEADERS = {
  'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
};
const RENDER_TIMEOUT_MS = 8000;

// 1x1 transparent PNG — absolute last-resort body so a meta-tag inspector
// always gets back real image bytes instead of an HTML error page.
const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

/**
 * Compositor for design/product-design share images that need to show TWO
 * raster images side by side (dual-sided front+back designs, or couple-pack
 * partner designs). Unlike `/api/og`, this route never touches satori/next-og
 * or SVG — it only reads/fetches known-raster (png/jpg/webp) bitmaps and
 * composites them with `sharp`, which is far more robust for photographic
 * mockup art than satori's flexbox layout engine.
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

/**
 * Query values are either a site-relative `public/` path (e.g.
 * `/NEW_DESIGNS/couple/king.png`) or an already-absolute CDN URL from
 * `resolveAssetUrl`. Local paths are read straight off disk — no HTTP
 * round-trip into our own app — matching the pattern already used for the
 * brand logo in `/api/og`.
 */
async function loadRasterBuffer(value: string | null): Promise<Buffer | null> {
  if (!value) return null;
  if (isSvgPath(value) || !ALLOWED_RASTER_EXT.test(value)) return null;

  try {
    if (/^https?:/i.test(value)) {
      const response = await withTimeout(fetch(value), RENDER_TIMEOUT_MS, 'design og fetch');
      if (!response.ok) return null;
      return Buffer.from(await response.arrayBuffer());
    }
    const relative = value.startsWith('/') ? value.slice(1) : value;
    const filePath = path.join(process.cwd(), 'public', decodeURIComponent(relative));
    return await readFile(filePath);
  } catch (error) {
    console.error('[api/og/design] Failed to load image:', value, error);
    return null;
  }
}

let cachedBackground: Buffer | null | undefined;

async function getBackgroundBuffer(): Promise<Buffer> {
  if (cachedBackground === undefined) {
    try {
      cachedBackground = await readFile(
        path.join(process.cwd(), 'public', 'og', 'design-bg.jpg'),
      );
    } catch (error) {
      console.error('[api/og/design] Failed to read background asset:', error);
      cachedBackground = null;
    }
  }
  if (cachedBackground) return cachedBackground;

  // Static asset missing for some reason — flat brand-colored canvas so the
  // route still produces a real image instead of throwing.
  return sharp({
    create: { width: OG_WIDTH, height: OG_HEIGHT, channels: 3, background: { r: 28, g: 67, b: 95 } },
  })
    .jpeg()
    .toBuffer();
}

/** White card holding a single design image, contained + centered. */
async function buildCard(imageBuffer: Buffer, cardWidth: number, cardHeight: number): Promise<Buffer> {
  const padding = 44;
  const innerWidth = Math.max(cardWidth - padding * 2, 1);
  const innerHeight = Math.max(cardHeight - padding * 2, 1);

  const resizedArt = await sharp(imageBuffer)
    .resize({
      width: innerWidth,
      height: innerHeight,
      fit: 'contain',
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

  if (images.length >= 2) {
    const cardWidth = 500;
    const cardHeight = 460;
    const gap = 36;
    const totalWidth = cardWidth * 2 + gap;
    const startX = Math.round((OG_WIDTH - totalWidth) / 2);
    const top = Math.round((OG_HEIGHT - cardHeight) / 2);

    const [cardA, cardB] = await Promise.all([
      buildCard(images[0], cardWidth, cardHeight),
      buildCard(images[1], cardWidth, cardHeight),
    ]);
    composites.push({ input: cardA, left: startX, top });
    composites.push({ input: cardB, left: startX + cardWidth + gap, top });
  } else {
    const cardWidth = 720;
    const cardHeight = 500;
    const left = Math.round((OG_WIDTH - cardWidth) / 2);
    const top = Math.round((OG_HEIGHT - cardHeight) / 2);
    const card = await buildCard(images[0], cardWidth, cardHeight);
    composites.push({ input: card, left, top });
  }

  return sharp(background)
    .resize(OG_WIDTH, OG_HEIGHT)
    .composite(composites)
    .jpeg({ quality: 88 })
    .toBuffer();
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
    const fallback = await readFile(path.join(process.cwd(), 'public', 'og', 'default.jpg'));
    return new Response(toBodyInit(fallback), {
      status: 200,
      headers: { ...RESPONSE_HEADERS, 'Content-Type': 'image/jpeg' },
    });
  } catch (error) {
    console.error('[api/og/design] Fallback default.jpg unavailable:', error);
  }
  return new Response(toBodyInit(TRANSPARENT_PNG), {
    status: 200,
    headers: { ...RESPONSE_HEADERS, 'Content-Type': 'image/png' },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const a = searchParams.get('a');
  const b = searchParams.get('b');

  try {
    const [bufferA, bufferB] = await Promise.all([loadRasterBuffer(a), loadRasterBuffer(b)]);
    const images = [bufferA, bufferB].filter((value): value is Buffer => Boolean(value));

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
