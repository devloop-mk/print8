export type SvgTextTransform = {
  dx: number;
  dy: number;
  scale: number;
};

import {
  getSvgContactGroup,
  getSvgContactGroupTransformKey,
  isSvgContactField,
} from '@/lib/designs/svg-contact-groups';
import {
  getSvgLogoSlots,
  logoStateKey,
} from '@/lib/designs/svg-logo-slots';

export const SVG_TEXT_SCALE_MIN = 0.8;
export const SVG_TEXT_SCALE_MAX = 1.2;
export const SVG_LOGO_SCALE_MIN = 0.4;
export const SVG_LOGO_SCALE_MAX = 2.5;
export const SVG_TEXT_HIT_PADDING = 6;

export const SVG_TEXT_EMPTY_PLACEHOLDER = '\u00A0';

/** Keeps SVG text nodes measurable/visible when the user clears a field. */
export function resolveSvgTextDisplayValue(
  stored: string | undefined,
  defaultValue: string,
): string {
  if (stored === undefined || stored === null) return defaultValue;
  if (stored.length === 0) return SVG_TEXT_EMPTY_PLACEHOLDER;
  return stored;
}

export function defaultSvgTextTransform(): SvgTextTransform {
  return { dx: 0, dy: 0, scale: 1 };
}

export function clampSvgTextScale(scale: number): number {
  return Math.min(
    SVG_TEXT_SCALE_MAX,
    Math.max(SVG_TEXT_SCALE_MIN, Number(scale.toFixed(3))),
  );
}

export function clampLogoScale(scale: number): number {
  return Math.min(
    SVG_LOGO_SCALE_MAX,
    Math.max(SVG_LOGO_SCALE_MIN, Number(scale.toFixed(3))),
  );
}

export function getSvgTextTransform(
  transforms: Record<string, SvgTextTransform> | undefined,
  key: string,
): SvgTextTransform {
  const value = transforms?.[key];
  if (!value) return defaultSvgTextTransform();
  return {
    dx: value.dx ?? 0,
    dy: value.dy ?? 0,
    scale: clampSvgTextScale(value.scale ?? 1),
  };
}

export function getSvgLogoTransform(
  transforms: Record<string, SvgTextTransform> | undefined,
  key: string,
): SvgTextTransform {
  const value = transforms?.[key];
  if (!value) return defaultSvgTextTransform();
  return {
    dx: value.dx ?? 0,
    dy: value.dy ?? 0,
    scale: clampLogoScale(value.scale ?? 1),
  };
}

export function applySvgGroupTransform(
  node: Element,
  transform: SvgTextTransform | undefined,
  scaleClamp: (scale: number) => number = clampSvgTextScale,
) {
  const existingBase = node.getAttribute('data-print8-base-transform');
  const inlineTransform = node.getAttribute('transform');
  const base =
    existingBase ??
    (inlineTransform && !existingBase ? inlineTransform : '');

  if (!existingBase && inlineTransform) {
    node.setAttribute('data-print8-base-transform', inlineTransform);
  }

  const dx = transform?.dx ?? 0;
  const dy = transform?.dy ?? 0;
  const scale = scaleClamp(transform?.scale ?? 1);

  if (dx === 0 && dy === 0 && scale === 1) {
    if (base) {
      node.setAttribute('transform', base);
    } else {
      node.removeAttribute('transform');
    }
    return;
  }

  const userPart =
    scale === 1
      ? `translate(${dx},${dy})`
      : `translate(${dx},${dy}) scale(${scale})`;

  node.setAttribute('transform', base ? `${base} ${userPart}` : userPart);
}

export function getRenderedElementBBoxInSvg(
  svg: SVGSVGElement,
  node: SVGGraphicsElement,
): { x: number; y: number; width: number; height: number } | null {
  return getRenderedTextBBoxInSvg(svg, node);
}

export function unionBBoxes(
  boxes: { x: number; y: number; width: number; height: number }[],
) {
  if (boxes.length === 0) return null;

  const minX = Math.min(...boxes.map((box) => box.x));
  const minY = Math.min(...boxes.map((box) => box.y));
  const maxX = Math.max(...boxes.map((box) => box.x + box.width));
  const maxY = Math.max(...boxes.map((box) => box.y + box.height));

  return {
    x: minX,
    y: minY,
    width: Math.max(maxX - minX, 1),
    height: Math.max(maxY - minY, 1),
  };
}

export function applySvgTextNodeTransform(
  node: Element,
  transform: SvgTextTransform | undefined,
) {
  const baseX = parseFloat(node.getAttribute('x') ?? '0');
  const baseY = parseFloat(node.getAttribute('y') ?? '0');
  const dx = transform?.dx ?? 0;
  const dy = transform?.dy ?? 0;
  const scale = clampSvgTextScale(transform?.scale ?? 1);

  if (dx === 0 && dy === 0 && scale === 1) {
    node.removeAttribute('transform');
    return;
  }

  node.setAttribute(
    'transform',
    `translate(${dx},${dy}) translate(${baseX},${baseY}) scale(${scale}) translate(${-baseX},${-baseY})`,
  );
}

export function clientPointToSvg(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
) {
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const matrix = svg.getScreenCTM();
  if (!matrix) return { x: clientX, y: clientY };
  const svgPoint = point.matrixTransform(matrix.inverse());
  return { x: svgPoint.x, y: svgPoint.y };
}

export function getRenderedTextBBoxInSvg(
  svg: SVGSVGElement,
  node: SVGGraphicsElement,
): { x: number; y: number; width: number; height: number } | null {
  const rect = node.getBoundingClientRect();
  if (rect.width < 0.5 && rect.height < 0.5) return null;

  const topLeft = clientPointToSvg(svg, rect.left, rect.top);
  const bottomRight = clientPointToSvg(svg, rect.right, rect.bottom);

  return {
    x: topLeft.x,
    y: topLeft.y,
    width: Math.max(bottomRight.x - topLeft.x, 1),
    height: Math.max(bottomRight.y - topLeft.y, 1),
  };
}

export function updateHitRectGeometry(
  hitRect: SVGRectElement,
  hitBox: { x: number; y: number; width: number; height: number },
) {
  hitRect.setAttribute('x', String(hitBox.x));
  hitRect.setAttribute('y', String(hitBox.y));
  hitRect.setAttribute('width', String(hitBox.width));
  hitRect.setAttribute('height', String(hitBox.height));
  hitRect.setAttribute('data-hit-area', String(hitBox.width * hitBox.height));
}

export function updateResizeHandleGeometry(
  handle: SVGCircleElement,
  hitBox: { x: number; y: number; width: number; height: number },
  handleSize: number,
) {
  handle.setAttribute('cx', String(hitBox.x + hitBox.width));
  handle.setAttribute('cy', String(hitBox.y + hitBox.height));
  handle.setAttribute('r', String(handleSize / 2));
}

export function serializeSvgTemplateStateWithoutTransforms(
  state: import('@/lib/data/svg-design-templates').SvgTemplateState,
) {
  const { transforms: _transforms, ...rest } = state;
  return JSON.stringify(rest);
}

export function serializeSvgTemplateTransforms(
  state: import('@/lib/data/svg-design-templates').SvgTemplateState,
) {
  return JSON.stringify(state.transforms ?? {});
}

export function applyTransformsToSvgDom(
  svg: SVGSVGElement,
  template: import('@/lib/data/svg-design-templates').SvgDesignTemplate,
  state: import('@/lib/data/svg-design-templates').SvgTemplateState,
  side: 'front' | 'back',
) {
  const sideConfig = side === 'front' ? template.sides.front : template.sides.back;
  if (!sideConfig) return;

  const textNodes = [...svg.querySelectorAll('text')];
  const contactGroup = getSvgContactGroup(template.id, side);
  const contactTransformKey = getSvgContactGroupTransformKey(side);

  for (const field of sideConfig.texts) {
    const fieldKey = `${side}:${field.id}`;
    const node = textNodes[field.index];
    if (node && !isSvgContactField(template.id, side, field.id)) {
      applySvgTextNodeTransform(node, getSvgTextTransform(state.transforms, fieldKey));
    }
  }

  if (contactGroup) {
    const groupNode = svg.getElementById(contactGroup.groupElementId);
    if (groupNode) {
      applySvgGroupTransform(
        groupNode,
        getSvgTextTransform(state.transforms, contactTransformKey),
      );
    }
  }

  for (const slot of getSvgLogoSlots(template.id, side)) {
    const groupNode = svg.getElementById(slot.elementId);
    if (!groupNode) continue;
    applySvgGroupTransform(
      groupNode,
      getSvgLogoTransform(state.transforms, logoStateKey(side, slot.id)),
      clampLogoScale,
    );
  }
}

export function tightTextHitBox(
  bbox: { x: number; y: number; width: number; height: number },
  padding = SVG_TEXT_HIT_PADDING,
) {
  return {
    x: bbox.x - padding,
    y: bbox.y - padding,
    width: Math.max(bbox.width + padding * 2, 1),
    height: Math.max(bbox.height + padding * 2, 1),
  };
}
