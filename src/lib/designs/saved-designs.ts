export type SavedDesignCategory =
  | 'business-cards'
  | 'wedding'
  | 'birthday'
  | 'menus'
  | 'general';

export interface SavedDesign {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  previewDataUrl: string;
  canvasJson: Record<string, unknown>;
  selectedCategory: SavedDesignCategory;
  selectedSize: string;
  customWidth: number;
  customHeight: number;
  templateId: string | null;
  uploadedFiles: { fileId: string; name: string }[];
  backgroundColor?: string;
}

const STORAGE_KEY = 'print8-saved-designs';

export function readSavedDesigns(): SavedDesign[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as SavedDesign[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

import { dispatchDraftsChanged } from '@/lib/drafts/draft-events';

export function writeSavedDesigns(designs: SavedDesign[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
  dispatchDraftsChanged();
}

export function deleteSavedDesign(id: string) {
  writeSavedDesigns(readSavedDesigns().filter((design) => design.id !== id));
}
