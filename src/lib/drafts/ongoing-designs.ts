import { readSavedDesigns, deleteSavedDesign, type SavedDesign } from '@/lib/designs/saved-designs';
import { buildCustomizerUrl } from '@/lib/products/paths';
import {
  getDesignCustomizeHref,
  isDesignCustomizeMode,
} from '@/lib/designs/customize-modes';
import {
  readDesignEditorDrafts,
  readProductCustomizerDrafts,
  deleteDesignEditorDraft,
  deleteProductCustomizerDraft,
  type DesignEditorDraft,
  type ProductCustomizerDraft,
} from '@/lib/drafts/work-drafts';

import { DRAFTS_CHANGED_EVENT } from '@/lib/drafts/draft-events';

export type OngoingDesignSource = 'studio' | 'product' | 'template';

export type OngoingDesignItem = {
  id: string;
  source: OngoingDesignSource;
  name: string;
  href: string;
  updatedAt: string;
  previewDataUrl?: string;
};

function studioItem(design: SavedDesign): OngoingDesignItem {
  return {
    id: `studio:${design.id}`,
    source: 'studio',
    name: design.name,
    href: `/designs/create?draft=${encodeURIComponent(design.id)}`,
    updatedAt: design.updatedAt,
    previewDataUrl: design.previewDataUrl,
  };
}

function productItem(draft: ProductCustomizerDraft): OngoingDesignItem {
  return {
    id: `product:${draft.id}`,
    source: 'product',
    name: draft.name,
    href: buildCustomizerUrl(draft.productId, draft.productType, {
      design: draft.designId ?? undefined,
      color: draft.color,
      size: draft.size,
    }),
    updatedAt: draft.updatedAt,
  };
}

function templateItem(draft: DesignEditorDraft): OngoingDesignItem {
  const mode = draft.payload.customizeMode;
  const href =
    typeof mode === 'string' && isDesignCustomizeMode(mode)
      ? getDesignCustomizeHref(draft.templateId, mode)
      : `/designs/${draft.templateId}/customize`;

  return {
    id: `template:${draft.id}`,
    source: 'template',
    name: draft.name,
    href,
    updatedAt: draft.updatedAt,
  };
}

export function collectOngoingDesigns(): OngoingDesignItem[] {
  const items = [
    ...readSavedDesigns().map(studioItem),
    ...readProductCustomizerDrafts().map(productItem),
    ...readDesignEditorDrafts().map(templateItem),
  ];

  return items.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function findProductCustomizerDraft(
  productId: string,
  designId: string | null,
) {
  const draftId = `product-${productId}-${designId ?? 'blank'}`;
  return readProductCustomizerDrafts().find((draft) => draft.id === draftId);
}

export function findDesignEditorDraft(templateId: string) {
  return readDesignEditorDrafts().find(
    (draft) => draft.id === `design-${templateId}`,
  );
}

export function findStudioDraft(draftId: string) {
  return readSavedDesigns().find((design) => design.id === draftId);
}

export function deleteOngoingDesign(compositeId: string) {
  const separatorIndex = compositeId.indexOf(':');
  if (separatorIndex === -1) return;

  const source = compositeId.slice(0, separatorIndex);
  const id = compositeId.slice(separatorIndex + 1);
  if (!id) return;

  if (source === 'studio') {
    deleteSavedDesign(id);
    return;
  }
  if (source === 'product') {
    deleteProductCustomizerDraft(id);
    return;
  }
  if (source === 'template') {
    deleteDesignEditorDraft(id);
  }
}

export { DRAFTS_CHANGED_EVENT };
