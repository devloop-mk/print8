export const SVG_CONTACT_BLOCK_KEY = '__contactBlock__';

export type SvgContactGroup = {
  groupElementId: string;
  fieldIds: string[];
};

const CONTACT_GROUPS: Record<string, SvgContactGroup> = {
  'svg-bcard-tech-wave:front': {
    groupElementId: 'print8-contact-block',
    fieldIds: ['t4', 't5', 't6', 't7'],
  },
  'svg-bcard-luxury-gold:front': {
    groupElementId: 'print8-contact-block',
    fieldIds: ['t2', 't3', 't4', 't5'],
  },
};

function contactGroupKey(templateId: string, side: 'front' | 'back') {
  return `${templateId}:${side}`;
}

export function getSvgContactGroup(
  templateId: string,
  side: 'front' | 'back',
): SvgContactGroup | null {
  return CONTACT_GROUPS[contactGroupKey(templateId, side)] ?? null;
}

export function getSvgContactGroupTransformKey(side: 'front' | 'back') {
  return `${side}:${SVG_CONTACT_BLOCK_KEY}`;
}

export function isSvgContactField(
  templateId: string,
  side: 'front' | 'back',
  fieldId: string,
): boolean {
  const group = getSvgContactGroup(templateId, side);
  return group?.fieldIds.includes(fieldId) ?? false;
}

export function isSvgContactTransformKey(fieldKey: string) {
  return fieldKey.endsWith(`:${SVG_CONTACT_BLOCK_KEY}`);
}
