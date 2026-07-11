const PRODUCT_COLOR_KEYS: Record<string, string> = {
  '#ffffff': 'white',
  '#000000': 'black',
  '#1e40af': 'blue',
  '#dc2626': 'red',
  '#7eb8da': 'lightBlue',
  '#add8e6': 'lightBlue',
  '#1f2937': 'charcoal',
  '#374151': 'gray',
  '#2f7cb2': 'blue',
  '#e8f4fc': 'ice',
  '#f5f5f4': 'stone',
  '#d8c3a5': 'beige',
};

export function normalizeProductColorHex(color: string): string {
  return color.trim().toLowerCase();
}

export function getProductColorLabelKey(color: string): string | null {
  return PRODUCT_COLOR_KEYS[normalizeProductColorHex(color)] ?? null;
}
