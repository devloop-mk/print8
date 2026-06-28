export const SVG_COLOR_LABEL_KEYS = [
  'textColor',
  'backgroundColor',
  'accentColor',
  'secondaryColor',
] as const;

export type SvgColorLabelKey = (typeof SVG_COLOR_LABEL_KEYS)[number];

const INLINE_COLOR_LABELS: Record<string, SvgColorLabelKey> = {
  background: 'backgroundColor',
  text: 'textColor',
  accent: 'accentColor',
  secondary: 'secondaryColor',
};

const FALLBACK_ROLES_BY_COUNT: SvgColorLabelKey[] = [
  'textColor',
  'secondaryColor',
  'accentColor',
  'backgroundColor',
];

export function resolveSvgColorLabelKey(
  slot: { id: string; labelKey: string },
  index: number,
  total: number,
): SvgColorLabelKey {
  if (SVG_COLOR_LABEL_KEYS.includes(slot.labelKey as SvgColorLabelKey)) {
    return slot.labelKey as SvgColorLabelKey;
  }

  if (slot.labelKey.startsWith('svgColors.')) {
    const colorId = slot.labelKey.slice('svgColors.'.length);
    if (INLINE_COLOR_LABELS[colorId]) {
      return INLINE_COLOR_LABELS[colorId];
    }
  }

  if (INLINE_COLOR_LABELS[slot.id]) {
    return INLINE_COLOR_LABELS[slot.id];
  }

  if (total === 1) return 'textColor';

  const role = FALLBACK_ROLES_BY_COUNT[index];
  return role ?? 'secondaryColor';
}
