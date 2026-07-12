export type CustomizerFontId =
  | 'inter'
  | 'space-grotesk'
  | 'roboto'
  | 'montserrat'
  | 'oswald'
  | 'playfair'
  | 'lora'
  | 'merriweather';

export type CustomizerFontOption = {
  id: CustomizerFontId;
  label: string;
  family: string;
};

export const CUSTOMIZER_FONTS: CustomizerFontOption[] = [
  { id: 'inter', label: 'Inter', family: 'var(--font-geist-sans), sans-serif' },
  {
    id: 'space-grotesk',
    label: 'Space Grotesk',
    family: 'var(--font-display), sans-serif',
  },
  {
    id: 'roboto',
    label: 'Roboto',
    family: 'var(--font-customizer-roboto), sans-serif',
  },
  {
    id: 'montserrat',
    label: 'Montserrat',
    family: 'var(--font-customizer-montserrat), sans-serif',
  },
  {
    id: 'oswald',
    label: 'Oswald',
    family: 'var(--font-customizer-oswald), sans-serif',
  },
  {
    id: 'playfair',
    label: 'Playfair',
    family: 'var(--font-customizer-playfair), serif',
  },
  { id: 'lora', label: 'Lora', family: 'var(--font-customizer-lora), serif' },
  {
    id: 'merriweather',
    label: 'Merriweather',
    family: 'var(--font-customizer-merriweather), serif',
  },
];

const fontFamilyById = new Map(
  CUSTOMIZER_FONTS.map((font) => [font.id, font.family]),
);

export const DEFAULT_CUSTOMIZER_FONT: CustomizerFontId = 'inter';

export function getCustomizerFontFamily(id: string): string {
  return fontFamilyById.get(id as CustomizerFontId) ?? fontFamilyById.get('inter')!;
}

const canvasFontFamilyById: Record<CustomizerFontId, string> = {
  inter: 'Inter, sans-serif',
  'space-grotesk': '"Space Grotesk", sans-serif',
  roboto: 'Roboto, sans-serif',
  montserrat: 'Montserrat, sans-serif',
  oswald: 'Oswald, sans-serif',
  playfair: '"Playfair Display", serif',
  lora: 'Lora, serif',
  merriweather: 'Merriweather, serif',
};

/** Canvas 2D cannot resolve CSS variables — use loaded family names instead. */
export function getCustomizerCanvasFontFamily(id: string): string {
  return (
    canvasFontFamilyById[id as CustomizerFontId] ??
    canvasFontFamilyById.inter
  );
}

export function isCustomizerFontId(value: string): value is CustomizerFontId {
  return fontFamilyById.has(value as CustomizerFontId);
}
