import type { CartItem } from '@/components/cart/CartProvider';
import type { DesignOrderFieldId } from '@/lib/data/design-order-fields';
import type { DesignColorTheme } from '@/lib/data/design-layouts';
import type { SvgTemplateState } from '@/lib/data/svg-design-templates';
import {
  getDesignCustomizeHref,
  isDesignCustomizeMode,
  type DesignCustomizeMode,
} from '@/lib/designs/customize-modes';

export function isEditableDesignCartItem(item: CartItem): boolean {
  if (item.type !== 'design') return false;
  const orderType = item.metadata?.orderType;
  return (
    orderType === 'svg-template' ||
    orderType === 'customizable-template' ||
    orderType === 'template-info'
  );
}

function inferSvgCustomizeMode(
  metadata: Record<string, string | number | boolean>,
): DesignCustomizeMode {
  const raw = metadata.svgState;
  if (typeof raw === 'string') {
    try {
      const state = JSON.parse(raw) as SvgTemplateState;
      if (state.transforms && Object.keys(state.transforms).length > 0) {
        return 'canvas';
      }
    } catch {
      // ignore invalid state
    }
  }
  return 'form';
}

export function buildDesignEditUrl(item: CartItem): string | null {
  if (!isEditableDesignCartItem(item)) return null;

  const designId = item.metadata?.designTemplateId;
  if (typeof designId !== 'string') return null;

  const params = new URLSearchParams({ edit: item.id });
  const orderType = item.metadata?.orderType;

  if (orderType === 'svg-template') {
    const mode =
      typeof item.metadata?.customizeMode === 'string' &&
      isDesignCustomizeMode(item.metadata.customizeMode)
        ? item.metadata.customizeMode
        : inferSvgCustomizeMode(item.metadata);
    return `${getDesignCustomizeHref(designId, mode)}?${params.toString()}`;
  }

  if (orderType === 'customizable-template') {
    return `${getDesignCustomizeHref(designId)}?${params.toString()}`;
  }

  if (orderType === 'template-info') {
    return `/designs/${designId}?${params.toString()}`;
  }

  return null;
}

export function parseSvgStateFromCartMetadata(
  metadata: Record<string, string | number | boolean>,
): SvgTemplateState | null {
  const raw = metadata.svgState;
  if (typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw) as SvgTemplateState;
  } catch {
    return null;
  }
}

export function parseLayoutColorsFromCartMetadata(
  metadata: Record<string, string | number | boolean>,
): DesignColorTheme | null {
  const accent = metadata.accentColor;
  const background = metadata.backgroundColor;
  const text = metadata.textColor;
  const secondary = metadata.secondaryColor;
  if (
    typeof accent !== 'string' ||
    typeof background !== 'string' ||
    typeof text !== 'string' ||
    typeof secondary !== 'string'
  ) {
    return null;
  }
  return { accent, background, text, secondary };
}

export function parseOrderFieldsFromCartMetadata(
  metadata: Record<string, string | number | boolean>,
  fields: DesignOrderFieldId[],
): Partial<Record<DesignOrderFieldId, string>> {
  const values: Partial<Record<DesignOrderFieldId, string>> = {};
  for (const field of fields) {
    const value = metadata[field];
    if (typeof value === 'string') {
      values[field] = value;
    }
  }
  return values;
}

export function cartItemMatchesDesignTemplate(
  item: CartItem | undefined,
  templateId: string,
): item is CartItem {
  return (
    Boolean(item) &&
    item.type === 'design' &&
    item.metadata?.designTemplateId === templateId
  );
}
