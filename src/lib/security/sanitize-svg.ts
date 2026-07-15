/**
 * Restrict CSS color values used in SVG/CSS interpolation to safe hex only.
 * Prevents breaking out of style attributes via values like `red;}</style>...`.
 */
export function sanitizeCssHexColor(
  value: string,
  fallback = '#000000',
): string {
  const trimmed = value.trim();
  if (
    /^#[0-9A-Fa-f]{3}$/.test(trimmed) ||
    /^#[0-9A-Fa-f]{6}$/.test(trimmed) ||
    /^#[0-9A-Fa-f]{8}$/.test(trimmed)
  ) {
    return trimmed;
  }
  return fallback;
}

/**
 * Best-effort SVG sanitizer for catalog uploads and inline previews.
 * Not a full HTML sanitizer — prefer rasterizing when vector recolor is not needed.
 */
export function sanitizeSvgMarkup(svg: string): string {
  return svg
    .replace(/<\?xml[^?]*\?>\s*/gi, '')
    .replace(/<!DOCTYPE[^>]*>\s*/gi, '')
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject\b[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/<object\b[\s\S]*?<\/object>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '')
    .trim();
}
