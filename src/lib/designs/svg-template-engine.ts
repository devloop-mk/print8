import type {
  SvgColorSlot,
  SvgDesignTemplate,
  SvgTemplateState,
} from '@/lib/data/svg-design-templates';
import {
  SVG_BACKGROUND_ASSETS,
  resolveSvgEmbeddedImages,
} from '@/lib/designs/svg-background-assets';
import { resolveCanvasAssetUrl } from '@/lib/storage/asset-url';
import {
  applySvgGroupTransform,
  applySvgTextNodeTransform,
  clampLogoScale,
  getSvgLogoTransform,
  getSvgTextTransform,
  resolveSvgTextDisplayValue,
} from '@/lib/designs/svg-text-transform';
import {
  getSvgContactGroup,
  getSvgContactGroupTransformKey,
  isSvgContactField,
} from '@/lib/designs/svg-contact-groups';
import {
  getSvgLogoSlots,
  logoStateKey,
} from '@/lib/designs/svg-logo-slots';
import {
  getSvgTemplateDefaultTransforms,
} from '@/lib/designs/svg-template-layout-adjustments';
import { applySvgCyrillicFontSupport } from '@/lib/designs/svg-font-cyrillic';
import {
  resolveSvgFieldDefault,
  type SvgSiteLocale,
} from '@/lib/designs/svg-locale-defaults';
import { sanitizeCssHexColor, sanitizeSvgMarkup } from '@/lib/security/sanitize-svg';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Global boost for SVG text that reads small in previews and print exports. */
export const SVG_BASE_TEXT_SCALE = 1.175;

function applyBaseTextScale(doc: Document) {
  doc.querySelectorAll('text').forEach((node) => {
    if (node.hasAttribute('data-print8-scaled-font')) return;

    const raw = node.getAttribute('font-size');
    if (!raw) return;

    const size = parseFloat(raw);
    if (!Number.isFinite(size) || size <= 0) return;

    node.setAttribute('data-print8-base-font-size', raw);
    node.setAttribute(
      'font-size',
      String(Math.round(size * SVG_BASE_TEXT_SCALE * 10) / 10),
    );
    node.setAttribute('data-print8-scaled-font', 'true');
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeColor(color: string): string {
  return sanitizeCssHexColor(color).toUpperCase();
}

function replaceInlineColor(svg: string, from: string, to: string): string {
  const source = normalizeColor(from);
  const target = sanitizeCssHexColor(to, source);
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
    const color = sanitizeCssHexColor(colors[slot.id] ?? slot.default);
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

function applyLogoSlots(
  doc: Document,
  textNodes: Element[],
  template: SvgDesignTemplate,
  state: SvgTemplateState,
  side: 'front' | 'back',
) {
  const slots = getSvgLogoSlots(template.id, side);
  if (!slots.length) return;

  for (const slot of slots) {
    const key = logoStateKey(side, slot.id);
    const dataUrl = state.logos?.[key];
    const group =
      doc.getElementById(slot.elementId) ??
      doc.querySelector(`[data-print8-logo="${slot.id}"]`);
    if (!group) continue;

    let imageEl = group.querySelector('image[data-print8-logo-image]');
    const fallbackText =
      slot.fallbackTextIndex !== undefined
        ? textNodes[slot.fallbackTextIndex]
        : null;

    if (dataUrl) {
      if (!imageEl) {
        imageEl = doc.createElementNS(SVG_NS, 'image');
        imageEl.setAttribute('data-print8-logo-image', 'true');
        imageEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        group.appendChild(imageEl);
      }

      imageEl.setAttribute('href', dataUrl);
      imageEl.setAttributeNS('http://www.w3.org/1999/xlink', 'href', dataUrl);
      imageEl.setAttribute('x', String(slot.imageX));
      imageEl.setAttribute('y', String(slot.imageY));
      imageEl.setAttribute('width', String(slot.imageWidth));
      imageEl.setAttribute('height', String(slot.imageHeight));

      const clipId = `print8-logo-clip-${side}-${slot.id}`;
      let clipPath =
        group.querySelector(`#${CSS.escape(clipId)}`) ??
        doc.getElementById(clipId);
      if (!clipPath && slot.clip !== 'none') {
        clipPath = doc.createElementNS(SVG_NS, 'clipPath');
        clipPath.setAttribute('id', clipId);
        const shape =
          slot.clip === 'circle'
            ? (() => {
                const circle = doc.createElementNS(SVG_NS, 'circle');
                const radius = Math.min(slot.imageWidth, slot.imageHeight) / 2;
                circle.setAttribute('cx', String(slot.imageX + slot.imageWidth / 2));
                circle.setAttribute('cy', String(slot.imageY + slot.imageHeight / 2));
                circle.setAttribute('r', String(radius));
                return circle;
              })()
            : (() => {
                const rect = doc.createElementNS(SVG_NS, 'rect');
                rect.setAttribute('x', String(slot.imageX));
                rect.setAttribute('y', String(slot.imageY));
                rect.setAttribute('width', String(slot.imageWidth));
                rect.setAttribute('height', String(slot.imageHeight));
                if (slot.clipRx) rect.setAttribute('rx', String(slot.clipRx));
                return rect;
              })();
        clipPath.appendChild(shape);
        group.insertBefore(clipPath, group.firstChild);
      }
      if (clipPath && slot.clip !== 'none') {
        imageEl.setAttribute('clip-path', `url(#${clipId})`);
      }

      if (fallbackText) fallbackText.setAttribute('visibility', 'hidden');
      group.querySelectorAll('[data-print8-logo-hide-with-image]').forEach((node) => {
        node.setAttribute('visibility', 'hidden');
      });
    } else {
      imageEl?.remove();
      if (fallbackText) fallbackText.removeAttribute('visibility');
      group.querySelectorAll('[data-print8-logo-hide-with-image]').forEach((node) => {
        node.removeAttribute('visibility');
      });
    }

    applySvgGroupTransform(
      group,
      getSvgLogoTransform(state.transforms, key),
      clampLogoScale,
    );
  }
}

function applyDomEdits(
  svg: string,
  sidePath: string,
  template: SvgDesignTemplate,
  state: SvgTemplateState,
  side: 'front' | 'back',
  locale: SvgSiteLocale = 'en',
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
  applyBaseTextScale(doc);
  applySvgCyrillicFontSupport(doc);
  const contactGroup = getSvgContactGroup(template.id, side);
  const contactTransformKey = getSvgContactGroupTransformKey(side);

  for (const field of sideConfig.texts) {
    const fieldKey = `${side}:${field.id}`;
    const stored = state.texts[fieldKey];
    const fallback = resolveSvgFieldDefault(template.id, side, field, locale);
    const value = resolveSvgTextDisplayValue(stored, fallback);
    const node = textNodes[field.index];
    if (node) node.textContent = value;
    if (node && !isSvgContactField(template.id, side, field.id)) {
      applySvgTextNodeTransform(node, getSvgTextTransform(state.transforms, fieldKey));
    }
  }

  if (contactGroup) {
    const groupNode = doc.getElementById(contactGroup.groupElementId);
    if (groupNode) {
      applySvgGroupTransform(
        groupNode,
        getSvgTextTransform(state.transforms, contactTransformKey),
      );
    }
  }

  applyLogoSlots(doc, textNodes, template, state, side);

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
  locale: SvgSiteLocale = 'en',
): string {
  const sidePath =
    side === 'front'
      ? template.sides.front.path
      : (template.sides.back?.path ?? template.sides.front.path);
  let result = resolveSvgEmbeddedImages(svg, sidePath);

  result = applyCssClassColors(result, template.colors, state.colors);
  result = applyInlineColors(result, template.colors, state.colors);
  result = applyDomEdits(result, sidePath, template, state, side, locale);

  if (!result.includes('<?xml')) {
    result = `<?xml version="1.0" encoding="UTF-8"?>${result}`;
  }

  return result;
}

export function buildDefaultSvgTemplateState(
  template: SvgDesignTemplate,
  locale: SvgSiteLocale = 'en',
): SvgTemplateState {
  const texts: SvgTemplateState['texts'] = {};
  const colors: SvgTemplateState['colors'] = {};

  for (const field of template.sides.front.texts) {
    texts[`front:${field.id}`] = resolveSvgFieldDefault(
      template.id,
      'front',
      field,
      locale,
    );
  }
  if (template.sides.back) {
    for (const field of template.sides.back.texts) {
      texts[`back:${field.id}`] = resolveSvgFieldDefault(
        template.id,
        'back',
        field,
        locale,
      );
    }
  }
  for (const slot of template.colors) {
    colors[slot.id] = slot.default;
  }

  const logos: SvgTemplateState['logos'] = {};
  for (const side of ['front', 'back'] as const) {
    for (const slot of getSvgLogoSlots(template.id, side)) {
      logos[logoStateKey(side, slot.id)] = null;
    }
  }

  return { texts, colors, logos, transforms: getSvgTemplateDefaultTransforms(template.id) };
}

export function prepareSvgForInlineDom(svg: string): string {
  return sanitizeSvgMarkup(svg);
}

/** Prefix SVG ids so multiple inline previews on one page do not clash. */
export function scopeSvgIdsForInlineDom(svg: string, scope: string): string {
  if (typeof DOMParser === 'undefined') return svg;

  const safeScope = scope.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!safeScope) return svg;

  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  const root = doc.documentElement;
  if (root.querySelector('parsererror')) return svg;

  const idMap = new Map<string, string>();
  root.querySelectorAll('[id]').forEach((element) => {
    const id = element.getAttribute('id');
    if (!id) return;
    const scopedId = `${safeScope}-${id}`;
    idMap.set(id, scopedId);
    element.setAttribute('id', scopedId);
  });

  if (idMap.size === 0) return svg;

  const replaceIdRefs = (value: string) => {
    let result = value;
    const entries = [...idMap.entries()].sort((a, b) => b[0].length - a[0].length);
    for (const [oldId, newId] of entries) {
      result = result.replaceAll(`url(#${oldId})`, `url(#${newId})`);
      result = result.replaceAll(`#${oldId}`, `#${newId}`);
    }
    return result;
  };

  root.querySelectorAll('*').forEach((element) => {
    for (const attribute of [...element.attributes]) {
      if (!attribute.value.includes('#')) continue;
      const nextValue = replaceIdRefs(attribute.value);
      if (nextValue !== attribute.value) {
        element.setAttribute(attribute.name, nextValue);
      }
    }
  });

  return new XMLSerializer().serializeToString(root);
}

export async function fetchRenderedSvg(
  path: string,
  template: SvgDesignTemplate,
  state: SvgTemplateState,
  side: 'front' | 'back',
  locale: SvgSiteLocale = 'en',
): Promise<string> {
  const fetchUrl = resolveCanvasAssetUrl(path);
  const response = await fetch(fetchUrl);
  const svg = await response.text();
  return applySvgTemplate(svg, template, state, side, locale);
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
