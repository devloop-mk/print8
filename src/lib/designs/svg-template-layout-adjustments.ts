import type { SvgTextTransform } from '@/lib/designs/svg-text-transform';

/** Default per-field layout tweaks (position / extra scale on top of global text scale). */
const SVG_TEMPLATE_DEFAULT_TRANSFORMS: Record<
  string,
  Record<string, SvgTextTransform>
> = {};

export function getSvgTemplateDefaultTransforms(
  templateId: string,
): Record<string, SvgTextTransform> {
  return { ...(SVG_TEMPLATE_DEFAULT_TRANSFORMS[templateId] ?? {}) };
}
