import { DEFAULT_TEXT_SHADOW, type SideDesign } from '@/lib/products/design-state';
import {
  DEFAULT_CUSTOMIZER_FONT,
  getCustomizerFontFamily,
  isCustomizerFontId,
  type CustomizerFontId,
} from '@/lib/products/customizer-fonts';

export const MAX_TEXT_LAYERS_PER_SIDE = 4;

export interface PlacedTextLayer {
  instanceId: string;
  text: string;
  color: string;
  size: number;
  position: { x: number; y: number };
  fontFamily: CustomizerFontId;
  fontWeight: number;
  letterSpacing: string;
  lineHeight: number;
  textShadow: string;
}

export function createPlacedTextLayer(
  existingCount: number,
  overrides?: Partial<PlacedTextLayer>,
): PlacedTextLayer {
  const spread = existingCount % 4;
  return {
    instanceId: `text-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: '',
    color: '#1e3a5f',
    size: 18,
    position: {
      x: 50,
      y: 22 + spread * 10,
    },
    fontFamily: DEFAULT_CUSTOMIZER_FONT,
    fontWeight: 700,
    letterSpacing: '0.02em',
    lineHeight: 1.2,
    textShadow: DEFAULT_TEXT_SHADOW,
    ...overrides,
  };
}

export function parsePlacedTextLayers(value: unknown): PlacedTextLayer[] {
  if (typeof value !== 'string' || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item): item is PlacedTextLayer =>
          typeof item === 'object' &&
          item !== null &&
          typeof (item as PlacedTextLayer).instanceId === 'string' &&
          typeof (item as PlacedTextLayer).text === 'string' &&
          typeof (item as PlacedTextLayer).color === 'string' &&
          typeof (item as PlacedTextLayer).size === 'number' &&
          typeof (item as PlacedTextLayer).fontWeight === 'number' &&
          typeof (item as PlacedTextLayer).letterSpacing === 'string' &&
          typeof (item as PlacedTextLayer).lineHeight === 'number' &&
          typeof (item as PlacedTextLayer).textShadow === 'string' &&
          typeof (item as PlacedTextLayer).position === 'object' &&
          (item as PlacedTextLayer).position !== null &&
          typeof (item as PlacedTextLayer).position.x === 'number' &&
          typeof (item as PlacedTextLayer).position.y === 'number' &&
          isCustomizerFontId((item as PlacedTextLayer).fontFamily),
      )
      .slice(0, MAX_TEXT_LAYERS_PER_SIDE);
  } catch {
    return [];
  }
}

export function serializePlacedTextLayers(layers: PlacedTextLayer[]): string {
  return JSON.stringify(layers.slice(0, MAX_TEXT_LAYERS_PER_SIDE));
}

export function textLayerFromFlatFields(
  design: Pick<
    SideDesign,
    | 'customText'
    | 'customTextColor'
    | 'customTextSize'
    | 'customTextPosition'
    | 'customTextFontWeight'
    | 'customTextLetterSpacing'
    | 'customTextLineHeight'
    | 'customTextShadow'
  >,
): PlacedTextLayer | null {
  if (!design.customText.trim()) return null;

  return createPlacedTextLayer(0, {
    instanceId: 'legacy-text',
    text: design.customText,
    color: design.customTextColor,
    size: design.customTextSize,
    position: design.customTextPosition,
    fontWeight: design.customTextFontWeight,
    letterSpacing: design.customTextLetterSpacing,
    lineHeight: design.customTextLineHeight,
    textShadow: design.customTextShadow,
  });
}

export function normalizeSideDesignText(design: SideDesign): SideDesign {
  if (design.textLayers.length > 0) {
    return design;
  }

  const legacyLayer = textLayerFromFlatFields(design);
  if (!legacyLayer) {
    return { ...design, textLayers: [] };
  }

  return {
    ...design,
    textLayers: [legacyLayer],
  };
}

export function getVisibleTextLayers(design: SideDesign): PlacedTextLayer[] {
  return normalizeSideDesignText(design).textLayers.filter((layer) =>
    layer.text.trim(),
  );
}

export function sideHasTextContent(design: SideDesign): boolean {
  return getVisibleTextLayers(design).length > 0;
}

export function syncFlatTextFields(design: SideDesign): SideDesign {
  const normalized = normalizeSideDesignText(design);
  const first = normalized.textLayers[0];

  if (!first) {
    return {
      ...normalized,
      customText: '',
      customTextColor: '#1e3a5f',
      customTextSize: 18,
      customTextPosition: { x: 50, y: 25 },
      customTextFontWeight: 700,
      customTextLetterSpacing: '0.02em',
      customTextLineHeight: 1.2,
      customTextShadow: DEFAULT_TEXT_SHADOW,
    };
  }

  return {
    ...normalized,
    customText: first.text,
    customTextColor: first.color,
    customTextSize: first.size,
    customTextPosition: first.position,
    customTextFontWeight: first.fontWeight,
    customTextLetterSpacing: first.letterSpacing,
    customTextLineHeight: first.lineHeight,
    customTextShadow: first.textShadow,
  };
}

export function writeTextMetadata(
  metadata: Record<string, string | number | boolean>,
  prefix: string,
  design: SideDesign,
) {
  const normalized = syncFlatTextFields(design);
  const layers = getVisibleTextLayers(normalized);

  if (layers.length > 0) {
    metadata[`${prefix}TextLayers`] = serializePlacedTextLayers(layers);
  }

  metadata[`${prefix}CustomText`] = normalized.customText;
  metadata[`${prefix}CustomTextColor`] = normalized.customTextColor;
  metadata[`${prefix}CustomTextSize`] = normalized.customTextSize;
  metadata[`${prefix}CustomTextPositionX`] = normalized.customTextPosition.x;
  metadata[`${prefix}CustomTextPositionY`] = normalized.customTextPosition.y;
  metadata[`${prefix}CustomTextFontWeight`] = normalized.customTextFontWeight;
  metadata[`${prefix}CustomTextLetterSpacing`] =
    normalized.customTextLetterSpacing;
  metadata[`${prefix}CustomTextLineHeight`] = normalized.customTextLineHeight;
  metadata[`${prefix}CustomTextShadow`] = normalized.customTextShadow;

  const firstLayer = layers[0];
  if (firstLayer) {
    metadata[`${prefix}CustomTextFontFamily`] = firstLayer.fontFamily;
  }
}

export function parseTextLayersFromMetadata(
  metadata: Record<string, string | number | boolean>,
  prefix: string,
  flatDesign: Pick<
    SideDesign,
    | 'customText'
    | 'customTextColor'
    | 'customTextSize'
    | 'customTextPosition'
    | 'customTextFontWeight'
    | 'customTextLetterSpacing'
    | 'customTextLineHeight'
    | 'customTextShadow'
  >,
): PlacedTextLayer[] {
  const parsed = parsePlacedTextLayers(metadata[`${prefix}TextLayers`]);
  if (parsed.length > 0) {
    return parsed;
  }

  const legacy = textLayerFromFlatFields(flatDesign);
  return legacy ? [legacy] : [];
}

export { getCustomizerFontFamily };
