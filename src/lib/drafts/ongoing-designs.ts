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

export type OngoingDesignSource = 'product' | 'template';

export type OngoingDesignItem = {
  id: string;
  source: OngoingDesignSource;
  name: string;
  href: string;
  updatedAt: string;
  previewDataUrl?: string;
};

function productItem(draft: ProductCustomizerDraft): OngoingDesignItem {
  return {
    id: `product:${draft.id}`,
    source: 'product',
    name: draft.name,
    href: buildCustomizerUrl(draft.productId, draft.productType, {
      design: draft.designId ?? undefined,
      color: draft.color,
      size: draft.size,
      resume: true,
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

export function deleteOngoingDesign(compositeId: string) {
  const separatorIndex = compositeId.indexOf(':');
  if (separatorIndex === -1) return;

  const source = compositeId.slice(0, separatorIndex);
  const id = compositeId.slice(separatorIndex + 1);
  if (!id) return;

  if (source === 'product') {
    deleteProductCustomizerDraft(id);
    return;
  }
  if (source === 'template') {
    deleteDesignEditorDraft(id);
  }
}

export { DRAFTS_CHANGED_EVENT };
