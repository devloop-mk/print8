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
 * Compositor for design/product-design share images.
 *
 * Supports:
 * 1. Mockup + overlay panels (`m0`/`o0`/`x0`/`y0`/`s0`, optional second panel)
 *    — garment/product photo with design art placed like the PDP preview.
 * 2. Pre-composited image panels (`i0`, optional `i1`).
 * 3. Legacy raw artwork (`a` / `b`) side by side on white cards.
 *
 * Never touches satori/next-og or SVG — only raster png/jpg/webp via sharp.
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
 * `/NEW_DESIGNS/caps/cap-skopje.png`) or an already-absolute CDN URL from
 * `resolveAssetUrl`. Local paths are read straight off disk — no HTTP
 * round-trip into our own app.
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
    // Strip cache-busting query strings (`?v=3`) before reading public/.
    const withoutQuery = value.split('?')[0] ?? value;
    const relative = withoutQuery.startsWith('/') ? withoutQuery.slice(1) : withoutQuery;
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

  return sharp({
    create: { width: OG_WIDTH, height: OG_HEIGHT, channels: 3, background: { r: 28, g: 67, b: 95 } },
  })
    .jpeg()
    .toBuffer();
}

type Placement = { x: number; y: number; scale: number };

/**
 * Square canvas matching ProductMockupFrame: mockup object-contain, overlay
 * positioned with left/top % of the frame and width = scale% (centered).
 */
async function compositeMockupOverlay(
  mockupBuffer: Buffer,
  overlayBuffer: Buffer | null,
  placement: Placement,
  canvasSize: number,
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
    const overlayW = Math.max(1, Math.round((canvasSize * placement.scale) / 100));
    const resizedOverlay = await sharp(overlayBuffer)
      .resize({ width: overlayW, fit: 'inside' })
      .ensureAlpha()
      .png()
      .toBuffer();
    const om = await sharp(resizedOverlay).metadata();
    const ow = om.width ?? overlayW;
    const oh = om.height ?? overlayW;
    const cx = (canvasSize * placement.x) / 100;
    const cy = (canvasSize * placement.y) / 100;
    const left = Math.round(cx - ow / 2);
    const top = Math.round(cy - oh / 2);

    // Sharp rejects negative offsets — pad a full-frame transparent layer.
    if (left < 0 || top < 0 || left + ow > canvasSize || top + oh > canvasSize) {
      const padded = await sharp({
        create: {
          width: canvasSize,
          height: canvasSize,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .composite([
          {
            input: resizedOverlay,
            left: Math.max(0, Math.min(left, canvasSize - 1)),
            top: Math.max(0, Math.min(top, canvasSize - 1)),
          },
        ])
        .png()
        .toBuffer();
      layers.push({ input: padded, left: 0, top: 0 });
    } else {
      layers.push({ input: resizedOverlay, left, top });
    }
  }

  return sharp(canvas).composite(layers).png().toBuffer();
}

/** White card holding a single design/mockup image, contained + centered. */
async function buildCard(imageBuffer: Buffer, cardWidth: number, cardHeight: number): Promise<Buffer> {
  const padding = 28;
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

function parsePlacement(searchParams: URLSearchParams, index: number): Placement {
  const x = Number(searchParams.get(`x${index}`) ?? '50');
  const y = Number(searchParams.get(`y${index}`) ?? '50');
  const scale = Number(searchParams.get(`s${index}`) ?? '40');
  return {
    x: Number.isFinite(x) ? x : 50,
    y: Number.isFinite(y) ? y : 50,
    scale: Number.isFinite(scale) && scale > 0 ? scale : 40,
  };
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
    // Composite at a resolution large enough for the OG card (~500–720px).
    return compositeMockupOverlay(mockupBuffer, overlayBuffer, placement, 720);
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
