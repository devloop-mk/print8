const PRODUCT_COLOR_KEYS: Record<string, string> = {
  '#c5ccd6': 'white',
  '#1c1a1d': 'black',
  '#db0213': 'red',
  '#272d37': 'navy',
  '#00806a': 'green',
  '#a09fa4': 'gray',
  '#0f287c': 'royalBlue',
  '#79804c': 'olive',
  '#ceb499': 'cream',
  '#ffffff': 'white',
  '#000000': 'black',
  '#1e40af': 'blue',
  '#2563eb': 'royalBlue',
  '#dc2626': 'red',
  '#1e293b': 'navy',
  '#2d6a4f': 'green',
  '#b0b4b8': 'heatherGray',
  '#6b7280': 'gray',
  '#6b705c': 'olive',
  '#e8dcc8': 'cream',
  '#d8c3a5': 'beige',
  '#7eb8da': 'lightBlue',
  '#add8e6': 'lightBlue',
  '#1f2937': 'charcoal',
  '#374151': 'gray',
  '#2f7cb2': 'blue',
  '#e8f4fc': 'ice',
  '#f5f5f4': 'stone',
  '#7891b7': 'skyBlue',
  '#fdc101': 'yellow',
  '#9acdca': 'mint',
};

/** Fabric whites that read gray as raw CSS — show as pure white in UI swatches. */
const SWATCH_DISPLAY_HEX: Record<string, string> = {
  '#c5ccd6': '#ffffff',
};

export function normalizeProductColorHex(color: string): string {
  return color.trim().toLowerCase();
}

export function getProductColorLabelKey(color: string): string | null {
  return PRODUCT_COLOR_KEYS[normalizeProductColorHex(color)] ?? null;
}

/** CSS fill for color chips — keeps real hex for mockups/filters. */
export function getColorSwatchDisplayHex(color: string): string {
  const hex = normalizeProductColorHex(color);
  return SWATCH_DISPLAY_HEX[hex] ?? hex;
}

/** Light fills need a stronger border so the chip stays visible on white UI. */
export function isLightColorSwatch(color: string): boolean {
  const display = getColorSwatchDisplayHex(color).replace('#', '');
  if (display.length !== 6) return false;
  const r = Number.parseInt(display.slice(0, 2), 16);
  const g = Number.parseInt(display.slice(2, 4), 16);
  const b = Number.parseInt(display.slice(4, 6), 16);
  return (r + g + b) / 3 >= 230;
}
