export function sanitizeDownloadFilename(name: string, fallback = 'file') {
  const cleaned = name
    .replace(/[\r\n"\\]/g, '')
    .replace(/[^\w.\- ()[\]]+/g, '_')
    .trim()
    .slice(0, 180);

  return cleaned || fallback;
}

export function contentDispositionInline(filename: string) {
  const safe = sanitizeDownloadFilename(filename);
  const encoded = encodeURIComponent(safe);
  return `inline; filename="${safe}"; filename*=UTF-8''${encoded}`;
}
