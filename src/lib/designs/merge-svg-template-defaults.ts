import type {
  SvgDesignTemplate,
  SvgTemplateState,
} from '@/lib/data/svg-design-templates';
import type { ManagedSvgTemplateDefaultsPayload } from '@/lib/db/managed-svg-templates';
import type { SvgSiteLocale } from '@/lib/designs/svg-locale-defaults';
import { buildDefaultSvgTemplateState } from '@/lib/designs/svg-template-engine';

export function applyManagedSvgTemplateDefaults(
  base: SvgTemplateState,
  overrides: ManagedSvgTemplateDefaultsPayload | null | undefined,
  locale: SvgSiteLocale,
): SvgTemplateState {
  if (!overrides) return base;

  const texts = { ...base.texts };
  const localeTexts =
    locale === 'mk' ? overrides.textsMk : overrides.textsEn;

  for (const [key, value] of Object.entries(localeTexts)) {
    if (typeof value === 'string' && value.length > 0) {
      texts[key] = value;
    }
  }

  const colors = { ...base.colors };
  for (const [key, value] of Object.entries(overrides.colors)) {
    if (typeof value === 'string' && value.length > 0) {
      colors[key] = value;
    }
  }

  const transforms = { ...(base.transforms ?? {}) };
  for (const [key, value] of Object.entries(overrides.transforms)) {
    if (value) transforms[key] = value;
  }

  return { ...base, texts, colors, transforms };
}

export function buildMergedDefaultSvgTemplateState(
  template: SvgDesignTemplate,
  locale: SvgSiteLocale,
  overrides?: ManagedSvgTemplateDefaultsPayload | null,
): SvgTemplateState {
  const base = buildDefaultSvgTemplateState(template, locale);
  return applyManagedSvgTemplateDefaults(base, overrides, locale);
}

export function hasManagedSvgDefaults(
  defaults: ManagedSvgTemplateDefaultsPayload | null | undefined,
) {
  if (!defaults) return false;
  return (
    Object.keys(defaults.textsEn).length > 0 ||
    Object.keys(defaults.textsMk).length > 0 ||
    Object.keys(defaults.colors).length > 0 ||
    Object.keys(defaults.transforms).length > 0
  );
}
