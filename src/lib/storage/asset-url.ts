function getAssetsCdnBase() {
  return process.env.NEXT_PUBLIC_ASSETS_CDN_URL?.replace(/\/$/, '') ?? '';
}

export function isRemoteAssetUrl(url: string) {
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('/api/')
  );
}

export function resolveAssetUrl(path: string): string {
  if (!path || isRemoteAssetUrl(path)) {
    return path;
  }

  const cdn = getAssetsCdnBase();
  if (!cdn) {
    return path;
  }

  // In dev, prefer /public paths so missing R2 uploads don't break previews.
  if (process.env.NODE_ENV === 'development') {
    return path;
  }

  const key = path.startsWith('/') ? path.slice(1) : path;
  return `${cdn}/catalog/${key}`;
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
