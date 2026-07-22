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

  if (cdn) {
    if (key.startsWith('masters/')) {
      return `${cdn}/${key}`;
    }
    return `${cdn}/catalog/${key}`;
  }

  if (isProductionRuntime() && isCatalogDesignAssetPath(normalized)) {
    console.warn(
      `[assets] NEXT_PUBLIC_ASSETS_CDN_URL is unset; design asset may be missing in production: ${normalized}`,
    );
  }

  return normalized;
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
  if (isRemoteAssetUrl(input)) {
    const cdn = getAssetsCdnBase();
    if (cdn && input.startsWith(`${cdn}/catalog/`)) {
      return `/${input.slice(`${cdn}/catalog/`.length)}`;
    }
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
