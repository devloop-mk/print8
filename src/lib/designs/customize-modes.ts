export const DESIGN_CUSTOMIZE_MODES = ['form', 'canvas'] as const;

export type DesignCustomizeMode = (typeof DESIGN_CUSTOMIZE_MODES)[number];

export function isDesignCustomizeMode(value: string): value is DesignCustomizeMode {
  return DESIGN_CUSTOMIZE_MODES.includes(value as DesignCustomizeMode);
}

export function getDesignCustomizeHref(templateId: string, mode?: DesignCustomizeMode) {
  if (!mode) return `/designs/${templateId}/customize`;
  return `/designs/${templateId}/customize/${mode}`;
}
