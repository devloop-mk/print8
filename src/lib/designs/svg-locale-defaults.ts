import type { SvgTextField } from '@/lib/data/svg-design-templates';
import { SVG_MK_TEXT_DEFAULTS } from '@/lib/designs/svg-template-mk-defaults';

export type SvgSiteLocale = 'en' | 'mk';

export function resolveSvgFieldDefault(
  templateId: string,
  side: 'front' | 'back',
  field: Pick<SvgTextField, 'id' | 'index' | 'default'>,
  locale: SvgSiteLocale,
): string {
  if (locale === 'en') return field.default;

  const mkSide = SVG_MK_TEXT_DEFAULTS[templateId]?.[side];
  const mkValue = mkSide?.[field.index];
  return mkValue ?? field.default;
}

export function toSvgSiteLocale(locale: string): SvgSiteLocale {
  return locale === 'mk' ? 'mk' : 'en';
}
