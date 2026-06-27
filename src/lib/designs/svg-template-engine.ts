import type {
  SvgColorSlot,
  SvgDesignTemplate,
  SvgTemplateState,
} from '@/lib/data/svg-design-templates';
import {
  SVG_BACKGROUND_ASSETS,
  resolveSvgEmbeddedImages,
} from '@/lib/designs/svg-background-assets';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeColor(color: string): string {
  return color.trim().toUpperCase();
}

function replaceInlineColor(svg: string, from: string, to: string): string {
  const source = normalizeColor(from);
  const target = to;
  const patterns = [
    new RegExp(`fill="${source}"`, 'gi'),
    new RegExp(`fill='${source}'`, 'gi'),
    new RegExp(`stop-color="${source}"`, 'gi'),
    new RegExp(`stop-color='${source}'`, 'gi'),
    new RegExp(`stroke="${source}"`, 'gi'),
    new RegExp(`stroke='${source}'`, 'gi'),
  ];

  let result = svg;
  for (const pattern of patterns) {
    result = result.replace(pattern, (match) =>
      match.replace(source, target).replace(source.toLowerCase(), target),
    );
  }
  return result;
}

function applyCssClassColors(svg: string, slots: SvgColorSlot[], colors: SvgTemplateState['colors']) {
  let result = svg;
  for (const slot of slots) {
    if (!slot.cssClass) continue;
    const color = colors[slot.id] ?? slot.default;
    const classPattern = new RegExp(
      `\\.${slot.cssClass}\\s*\\{[^}]*fill:\\s*[^;]+;`,
      'gi',
    );
    result = result.replace(classPattern, `.${slot.cssClass} { fill: ${color};`);
  }
  return result;
}

function applyInlineColors(svg: string, slots: SvgColorSlot[], colors: SvgTemplateState['colors']) {
  let result = svg;
  for (const slot of slots) {
    if (!slot.inlineReplace) continue;
    const color = colors[slot.id] ?? slot.default;
    result = replaceInlineColor(result, slot.inlineReplace, color);
  }
  return result;
}

function applyDomEdits(
  svg: string,
  sidePath: string,
  template: SvgDesignTemplate,
  state: SvgTemplateState,
  side: 'front' | 'back',
) {
  if (typeof DOMParser === 'undefined') return svg;

  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  const sideConfig = side === 'front' ? template.sides.front : template.sides.back;
  if (!sideConfig) return svg;

  doc.querySelectorAll('image').forEach((node) => {
    const href =
      node.getAttribute('href') ??
      node.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
    if (!href) return;

    const filename = href.split(/[/\\]/).pop()?.split('?')[0];
    const publicPath = filename ? SVG_BACKGROUND_ASSETS[filename] : undefined;
    if (publicPath) {
      node.setAttribute('href', publicPath);
      node.removeAttributeNS('http://www.w3.org/1999/xlink', 'href');
      return;
    }

    if (href.startsWith('file:')) node.remove();
  });

  for (const slot of template.colors) {
    if (!slot.selector || !slot.attribute) continue;
    const color = state.colors[slot.id] ?? slot.default;
    doc.querySelectorAll(slot.selector).forEach((node) => {
      node.setAttribute(slot.attribute!, color);
    });
  }

  const textNodes = [...doc.querySelectorAll('text')];
  for (const field of sideConfig.texts) {
    const value = state.texts[`${side}:${field.id}`] ?? field.default;
    const node = textNodes[field.index];
    if (node) node.textContent = value;
  }

  const serialized = new XMLSerializer().serializeToString(doc.documentElement);
  return serialized.startsWith('<?xml')
    ? serialized
    : `<?xml version="1.0" encoding="UTF-8"?>${serialized}`;
}

export function applySvgTemplate(
  svg: string,
  template: SvgDesignTemplate,
  state: SvgTemplateState,
  side: 'front' | 'back',
): string {
  const sidePath =
    side === 'front'
      ? template.sides.front.path
      : (template.sides.back?.path ?? template.sides.front.path);
  let result = resolveSvgEmbeddedImages(svg, sidePath);

  result = applyCssClassColors(result, template.colors, state.colors);
  result = applyInlineColors(result, template.colors, state.colors);
  result = applyDomEdits(result, template.sides.front.path, template, state, side);

  if (!result.includes('<?xml')) {
    result = `<?xml version="1.0" encoding="UTF-8"?>${result}`;
  }

  return result;
}

export function buildDefaultSvgTemplateState(
  template: SvgDesignTemplate,
): SvgTemplateState {
  const texts: SvgTemplateState['texts'] = {};
  const colors: SvgTemplateState['colors'] = {};

  for (const field of template.sides.front.texts) {
    texts[`front:${field.id}`] = field.default;
  }
  if (template.sides.back) {
    for (const field of template.sides.back.texts) {
      texts[`back:${field.id}`] = field.default;
    }
  }
  for (const slot of template.colors) {
    colors[slot.id] = slot.default;
  }

  return { texts, colors };
}

export function prepareSvgForInlineDom(svg: string): string {
  return svg.replace(/<\?xml[^?]*\?>\s*/i, '').trim();
}

export async function fetchRenderedSvg(
  path: string,
  template: SvgDesignTemplate,
  state: SvgTemplateState,
  side: 'front' | 'back',
): Promise<string> {
  const response = await fetch(path);
  const svg = await response.text();
  return applySvgTemplate(svg, template, state, side);
}

export async function fetchRenderedSvgBlobUrl(
  path: string,
  template: SvgDesignTemplate,
  state: SvgTemplateState,
  side: 'front' | 'back',
): Promise<string> {
  const { embedSvgExternalImages } = await import('@/lib/designs/svg-background-assets');
  const rendered = await embedSvgExternalImages(
    await fetchRenderedSvg(path, template, state, side),
  );
  const blob = new Blob([rendered], { type: 'image/svg+xml' });
  return URL.createObjectURL(blob);
}

export function decodeSvgEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}

export function encodeSvgTextValue(value: string): string {
  return escapeXml(value);
}
