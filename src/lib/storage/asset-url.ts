function getAssetsCdnBase() {
  return process.env.NEXT_PUBLIC_ASSETS_CDN_URL?.replace(/\/$/, '') ?? '';
}

function isProductionRuntime() {
  return (
    process.env.VERCEL_ENV === 'production' ||
    process.env.NODE_ENV === 'production'
  );
}

function preferLocalPublicAssets() {
  if (process.env.ASSETS_FORCE_CDN === '1') return false;
  return process.env.NODE_ENV === 'development';
}

function isCatalogDesignAssetPath(normalizedPath: string) {
  return (
    normalizedPath.startsWith('/NEW_DESIGNS/') ||
    normalizedPath.startsWith('/product-designs/') ||
    normalizedPath.startsWith('/masters/')
  );
}

/** Catalog keys served by `/api/catalog/*` (not print masters). */
function isCatalogProxyStorageKey(key: string) {
  const normalized = key.startsWith('/') ? key : `/${key}`;
  return (
    normalized.startsWith('/NEW_DESIGNS/') ||
    normalized.startsWith('/product-designs/')
  );
}

/**
 * Normalize a stored path, CDN URL, or same-origin proxy URL back to a catalog
 * storage key (`NEW_DESIGNS/...`, `product-designs/...`).
 */
function extractCatalogStorageKey(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('/api/catalog/')) {
    const key = trimmed.slice('/api/catalog/'.length);
    return isCatalogProxyStorageKey(key) ? key : null;
  }

  if (!isRemoteAssetUrl(trimmed)) {
    const key = trimmed.replace(/^\/+/, '');
    return isCatalogProxyStorageKey(key) ? key : null;
  }

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    let pathname = url.pathname.replace(/^\/+/, '');

    const cdn = getAssetsCdnBase();
    if (cdn) {
      try {
        const cdnUrl = new URL(cdn);
        if (url.hostname === cdnUrl.hostname) {
          const cdnPrefix = cdnUrl.pathname.replace(/^\/+|\/+$/g, '');
          if (cdnPrefix && pathname.startsWith(`${cdnPrefix}/`)) {
            pathname = pathname.slice(cdnPrefix.length + 1);
          }
        }
      } catch {
        // ignore malformed CDN base URL
      }
    }

    if (pathname.startsWith('catalog/')) {
      pathname = pathname.slice('catalog/'.length);
    }

    if (isCatalogProxyStorageKey(pathname)) {
      return pathname;
    }

    // Public `.r2.dev` URLs sometimes omit the `catalog/` prefix.
    if (url.hostname.endsWith('.r2.dev') && isCatalogProxyStorageKey(pathname)) {
      return pathname;
    }
  } catch {
    return null;
  }

  return null;
}

function pathnameFromCdnUrl(url: URL): string {
  let pathname = url.pathname.replace(/^\/+/, '');
  const cdn = getAssetsCdnBase();
  if (!cdn) return pathname;
  try {
    const cdnUrl = new URL(cdn);
    if (url.hostname !== cdnUrl.hostname) return pathname;
    const cdnPrefix = cdnUrl.pathname.replace(/^\/+|\/+$/g, '');
    if (cdnPrefix && pathname.startsWith(`${cdnPrefix}/`)) {
      pathname = pathname.slice(cdnPrefix.length + 1);
    }
  } catch {
    // ignore malformed CDN base URL
  }
  return pathname;
}

/** Print masters live at `masters/...` on the bucket (and on `.r2.dev`). */
function extractMasterStorageKey(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return null;
  }

  if (trimmed.startsWith('/api/masters/')) {
    return `masters/${trimmed.slice('/api/masters/'.length)}`;
  }

  if (trimmed.startsWith('/_next/image')) {
    try {
      const inner = new URL(trimmed, 'https://local.invalid').searchParams.get(
        'url',
      );
      return inner ? extractMasterStorageKey(inner) : null;
    } catch {
      return null;
    }
  }

  if (!isRemoteAssetUrl(trimmed)) {
    const key = trimmed.replace(/^\/+/, '');
    return key.startsWith('masters/') ? key : null;
  }

  try {
    const url = new URL(trimmed);
    if (url.pathname.startsWith('/_next/image')) {
      const inner = url.searchParams.get('url');
      return inner ? extractMasterStorageKey(inner) : null;
    }
    const pathname = pathnameFromCdnUrl(url);
    if (pathname.startsWith('masters/')) return pathname;
  } catch {
    return null;
  }

  return null;
}

function toSameOriginOptimizedUrl(remoteUrl: string): string {
  if (
    remoteUrl.startsWith('/_next/image') ||
    remoteUrl.startsWith('data:') ||
    remoteUrl.startsWith('blob:')
  ) {
    return remoteUrl;
  }
  return `/_next/image?url=${encodeURIComponent(remoteUrl)}&w=1080&q=75`;
}

function resolveCanvasMasterUrl(key: string): string {
  const relative = key.startsWith('masters/')
    ? key.slice('masters/'.length)
    : key;
  if (preferLocalPublicAssets()) {
    return `/api/masters/${relative}`;
  }
  const cdn = getAssetsCdnBase();
  if (cdn) {
    // Public `.r2.dev` does not send CORS headers (custom domain required).
    // The Next image optimizer fetches R2 server-side so the <img> is same-origin.
    return toSameOriginOptimizedUrl(`${cdn}/${key}`);
  }
  return `/api/masters/${relative}`;
}

export function isRemoteAssetUrl(url: string) {
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('/api/')
  );
}

/**
 * Resolve a catalog-relative path to a public URL.
 *
 * Production: `/NEW_DESIGNS/**` (and other catalog keys) always go through the
 * R2 CDN when `NEXT_PUBLIC_ASSETS_CDN_URL` is set — never Next `public/` as the
 * production source of truth for design art.
 *
 * Local development keeps `/public` paths so missing R2 uploads don't break
 * previews. Set `ASSETS_FORCE_CDN=1` to exercise CDN URLs locally.
 */
export function resolveAssetUrl(path: string): string {
  if (!path || isRemoteAssetUrl(path)) {
    return path;
  }

  const normalized = path.startsWith('/') ? path : `/${path}`;
  const key = normalized.slice(1);
  const cdn = getAssetsCdnBase();

  if (preferLocalPublicAssets()) {
    return normalized;
  }

  if (cdn && isCatalogDesignAssetPath(normalized)) {
    if (key.startsWith('masters/')) {
      return `${cdn}/${key}`;
    }
    return `${cdn}/catalog/${key}`;
  }

  if (!preferLocalPublicAssets() && isCatalogDesignAssetPath(normalized)) {
    return `/api/catalog/${key}`;
  }

  if (isProductionRuntime() && isCatalogDesignAssetPath(normalized)) {
    console.warn(
      `[assets] NEXT_PUBLIC_ASSETS_CDN_URL is unset; design asset may be missing in production: ${normalized}`,
    );
  }

  return normalized;
}

/**
 * Same-origin URL for catalog/master art used with `crossOrigin="anonymous"`
 * (canvas, html2canvas, Fabric). Public R2 `.r2.dev` URLs do not send
 * `Access-Control-Allow-Origin` — catalog keys go through `/api/catalog`,
 * masters through `/api/masters` (dev) or `/_next/image` (production).
 */
export function resolveCanvasAssetUrl(path: string): string {
  if (!path) return path;

  if (
    path.startsWith('blob:') ||
    path.startsWith('data:') ||
    path.startsWith('/api/catalog/') ||
    path.startsWith('/api/masters/') ||
    path.startsWith('/_next/image')
  ) {
    return path;
  }

  const catalogKey = extractCatalogStorageKey(path);
  if (catalogKey) {
    if (preferLocalPublicAssets()) {
      return `/${catalogKey}`;
    }
    return `/api/catalog/${catalogKey}`;
  }

  const masterKey = extractMasterStorageKey(path);
  if (masterKey) {
    return resolveCanvasMasterUrl(masterKey);
  }

  if (isRemoteAssetUrl(path)) {
    return path;
  }

  const normalized = path.startsWith('/') ? path : `/${path}`;
  const key = normalized.slice(1);

  if (preferLocalPublicAssets()) {
    return normalized;
  }

  if (isCatalogDesignAssetPath(normalized)) {
    return `/api/catalog/${key}`;
  }

  return resolveAssetUrl(path);
}

/** Print-ready masters live at bucket root (masters/...), not under catalog/. */
export function resolveMasterAssetUrl(path: string): string {
  if (!path || isRemoteAssetUrl(path)) {
    return path;
  }

  const normalized = path.startsWith('/') ? path : `/${path}`;
  const key = normalized.startsWith('/') ? normalized.slice(1) : normalized;

  // Local dev: serve from print-masters/ via API (reliable for admin previews).
  if (preferLocalPublicAssets() && key.startsWith('masters/')) {
    return `/api/masters/${key.slice('masters/'.length)}`;
  }

  const cdn = getAssetsCdnBase();
  if (cdn) {
    return `${cdn}/${key}`;
  }

  if (isProductionRuntime() && key.startsWith('masters/')) {
    console.warn(
      `[assets] NEXT_PUBLIC_ASSETS_CDN_URL is unset; master asset unavailable in production: ${normalized}`,
    );
  }

  if (key.startsWith('masters/')) {
    return `/api/masters/${key.slice('masters/'.length)}`;
  }

  return normalized;
}

export function toCatalogStoragePath(input: string) {
  if (!input) return input;

  const catalogKey = extractCatalogStorageKey(input);
  if (catalogKey) {
    return `/${catalogKey}`;
  }

  if (isRemoteAssetUrl(input)) {
    return input;
  }

  return input.startsWith('/') ? input : `/${input}`;
}

export function getAssetsCdnHostname() {
  const cdn = getAssetsCdnBase();
  if (!cdn) return null;

  try {
    return new URL(cdn).hostname;
  } catch {
    return null;
  }
}
