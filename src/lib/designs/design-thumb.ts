import type { DesignTemplate } from '@/lib/data/catalog';
import { getDesignLayout } from '@/lib/data/design-layouts';
import { getSvgDesignTemplate } from '@/lib/data/svg-design-templates';

export function getDesignThumbAspect(design: DesignTemplate): number {
  if (design.svgTemplateId) {
    return getSvgDesignTemplate(design.svgTemplateId)?.aspectRatio ?? 4 / 3;
  }
  if (design.layoutId) {
    return getDesignLayout(design.layoutId)?.aspectRatio ?? 4 / 3;
  }
  return 4 / 3;
}

export function fitDesignThumbSize(
  containerWidth: number,
  containerHeight: number,
  aspectRatio: number,
  padding = 6,
) {
  const availW = Math.max(containerWidth - padding, 1);
  const availH = Math.max(containerHeight - padding, 1);

  let width = availW;
  let height = width / aspectRatio;

  if (height > availH) {
    height = availH;
    width = height * aspectRatio;
  }

  return { width, height };
}
