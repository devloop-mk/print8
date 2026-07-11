import type { ProductSide } from '@/lib/data/catalog';
import {
  hydrateBrandingPackLogo,
  normalizeBrandingPackStateForStorage,
  type BrandingPackState,
  type BrandingPackWizardStep,
} from '@/lib/products/branding-pack-state';

const STORAGE_KEY = 'print8-branding-pack-draft';

export type BrandingPackDraft = {
  state: BrandingPackState;
  step: BrandingPackWizardStep;
  customizeIndex: number;
  activeSide: ProductSide;
  updatedAt: string;
};

export function readBrandingPackDraft(): BrandingPackDraft | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as BrandingPackDraft;
    if (!parsed?.state?.packId || !Array.isArray(parsed.state.products)) {
      return null;
    }

    return {
      ...parsed,
      state: hydrateBrandingPackLogo(parsed.state),
    };
  } catch {
    return null;
  }
}

export function writeBrandingPackDraft(draft: BrandingPackDraft): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...draft,
        state: normalizeBrandingPackStateForStorage(draft.state),
        updatedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // ignore quota errors
  }
}

export function clearBrandingPackDraft(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
