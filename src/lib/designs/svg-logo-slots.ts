export type SvgLogoSlotConfig = {
  id: 'logo';
  elementId: string;
  /** Text node index used for the letter fallback */
  fallbackTextIndex?: number;
  imageX: number;
  imageY: number;
  imageWidth: number;
  imageHeight: number;
  clip: 'circle' | 'rect' | 'none';
  clipRx?: number;
};

const BCARD_LOGO_SLOTS: Record<string, SvgLogoSlotConfig[]> = {
  'svg-bcard-tech-wave:front': [
    {
      id: 'logo',
      elementId: 'print8-logo-front',
      fallbackTextIndex: 0,
      imageX: 80,
      imageY: 80,
      imageWidth: 80,
      imageHeight: 80,
      clip: 'circle',
    },
  ],
  'svg-bcard-tech-wave:back': [
    {
      id: 'logo',
      elementId: 'print8-logo-back',
      fallbackTextIndex: 0,
      imageX: 465,
      imageY: 180,
      imageWidth: 120,
      imageHeight: 120,
      clip: 'circle',
    },
  ],
  'svg-bcard-corporate-geo:front': [
    {
      id: 'logo',
      elementId: 'print8-logo-front',
      fallbackTextIndex: 0,
      imageX: 80,
      imageY: 80,
      imageWidth: 60,
      imageHeight: 60,
      clip: 'rect',
      clipRx: 10,
    },
  ],
  'svg-bcard-corporate-geo:back': [
    {
      id: 'logo',
      elementId: 'print8-logo-back',
      fallbackTextIndex: 0,
      imageX: 475,
      imageY: 200,
      imageWidth: 100,
      imageHeight: 100,
      clip: 'rect',
      clipRx: 15,
    },
  ],
  'svg-bcard-luxury-gold:front': [
    {
      id: 'logo',
      elementId: 'print8-logo-front',
      imageX: 480,
      imageY: 58,
      imageWidth: 90,
      imageHeight: 55,
      clip: 'none',
    },
  ],
  'svg-bcard-luxury-gold:back': [
    {
      id: 'logo',
      elementId: 'print8-logo-back',
      imageX: 450,
      imageY: 178,
      imageWidth: 150,
      imageHeight: 135,
      clip: 'none',
    },
  ],
};

function sideKey(templateId: string, side: 'front' | 'back') {
  return `${templateId}:${side}`;
}

export function getSvgLogoSlots(
  templateId: string,
  side: 'front' | 'back',
): SvgLogoSlotConfig[] {
  return BCARD_LOGO_SLOTS[sideKey(templateId, side)] ?? [];
}

export function getSvgLogoSlotFallbackTextIndices(
  templateId: string,
  side: 'front' | 'back',
): Set<number> {
  return new Set(
    getSvgLogoSlots(templateId, side)
      .map((slot) => slot.fallbackTextIndex)
      .filter((index): index is number => index !== undefined),
  );
}

export function logoStateKey(side: 'front' | 'back', slotId: string) {
  return `${side}:${slotId}`;
}

export function isSvgLogoFieldKey(fieldKey: string) {
  return /^[^:]+:logo$/.test(fieldKey);
}
