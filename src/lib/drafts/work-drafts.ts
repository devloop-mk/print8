import { dispatchDraftsChanged, dispatchDesignSaved } from '@/lib/drafts/draft-events';
import type { ProductSide, ProductType } from '@/lib/data/catalog';
import type { SideDesign } from '@/lib/products/design-state';
import type { TshirtPrintPackage } from '@/lib/products/tshirt-print-pricing';

const PRODUCT_DRAFTS_KEY = 'print8-product-customizer-drafts';
const DESIGN_EDITOR_DRAFTS_KEY = 'print8-design-editor-drafts';

export type ProductCustomizerDraft = {
  id: string;
  name: string;
  productId: string;
  productType: ProductType;
  designId: string | null;
  color: string;
  size: string;
  quantity: number;
  activeSide: ProductSide;
  sideDesigns: Partial<Record<ProductSide, SideDesign>>;
  printPackage?: TshirtPrintPackage;
  updatedAt: string;
};

export type DesignEditorDraft = {
  id: string;
  name: string;
  templateId: string;
  kind: 'layout' | 'svg';
  payload: Record<string, unknown>;
  updatedAt: string;
};

function readJson<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJson<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

function serializeSideDesign(design: SideDesign): SideDesign {
  return {
    ...design,
    uploadedFile: design.uploadedFile
      ? {
          fileId: design.uploadedFile.fileId,
          name: design.uploadedFile.name,
          isImage: design.uploadedFile.isImage,
        }
      : null,
    uploadedPhotos: design.uploadedPhotos.map((photo) => ({
      instanceId: photo.instanceId,
      fileId: photo.fileId,
      name: photo.name,
      scale: photo.scale,
      position: photo.position,
    })),
  };
}

export function serializeSideDesigns(
  sideDesigns: Partial<Record<ProductSide, SideDesign>>,
) {
  const result: Partial<Record<ProductSide, SideDesign>> = {};
  for (const [side, design] of Object.entries(sideDesigns)) {
    if (design) {
      result[side as ProductSide] = serializeSideDesign(design);
    }
  }
  return result;
}

export function upsertProductCustomizerDraft(draft: ProductCustomizerDraft) {
  const drafts = readJson<ProductCustomizerDraft>(PRODUCT_DRAFTS_KEY);
  const index = drafts.findIndex((item) => item.id === draft.id);
  const next =
    index === -1
      ? [draft, ...drafts]
      : drafts.map((item, itemIndex) => (itemIndex === index ? draft : item));
  writeJson(PRODUCT_DRAFTS_KEY, next.slice(0, 24));
  dispatchDraftsChanged();
  if (index === -1) {
    dispatchDesignSaved();
  }
}

export function upsertDesignEditorDraft(draft: DesignEditorDraft) {
  const drafts = readJson<DesignEditorDraft>(DESIGN_EDITOR_DRAFTS_KEY);
  const index = drafts.findIndex((item) => item.id === draft.id);
  const next =
    index === -1
      ? [draft, ...drafts]
      : drafts.map((item, itemIndex) => (itemIndex === index ? draft : item));
  writeJson(DESIGN_EDITOR_DRAFTS_KEY, next.slice(0, 24));
  dispatchDraftsChanged();
  if (index === -1) {
    dispatchDesignSaved();
  }
}

export function readProductCustomizerDrafts() {
  return readJson<ProductCustomizerDraft>(PRODUCT_DRAFTS_KEY);
}

export function readDesignEditorDrafts() {
  return readJson<DesignEditorDraft>(DESIGN_EDITOR_DRAFTS_KEY);
}

export function deleteProductCustomizerDraft(id: string) {
  const next = readProductCustomizerDrafts().filter((draft) => draft.id !== id);
  writeJson(PRODUCT_DRAFTS_KEY, next);
  dispatchDraftsChanged();
}

export function deleteDesignEditorDraft(id: string) {
  const next = readDesignEditorDrafts().filter((draft) => draft.id !== id);
  writeJson(DESIGN_EDITOR_DRAFTS_KEY, next);
  dispatchDraftsChanged();
}
