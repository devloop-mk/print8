import type { CartItem } from '@/lib/cart/types';
import { idbDelete, idbGet, idbSet } from '@/lib/storage/indexed-db';

const STORAGE_KEY = 'print8-cart';
const LEGACY_LOCAL_STORAGE_KEY = 'print8-cart';

const BULKY_METADATA_KEYS = new Set([
  'svgFrontContent',
  'svgBackContent',
  'svgState',
]);

export const BULKY_METADATA_SUFFIXES = [
  'PremadeDesignImage',
  'UploadedPreviewUrl',
  'OverlayRaster',
  'OverlaySvg',
  'OverlaySvgPrimary',
  'OverlaySvgSecondary',
] as const;

export function isDataUrl(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('data:');
}

function stripBulkyMetadata(
  metadata: Record<string, string | number | boolean>,
): Record<string, string | number | boolean> {
  const next: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (BULKY_METADATA_KEYS.has(key)) continue;
    if (BULKY_METADATA_SUFFIXES.some((suffix) => key.endsWith(suffix))) {
      if (isDataUrl(value)) continue;
    }
    if (typeof value === 'string' && value.length > 2048 && isDataUrl(value)) {
      continue;
    }
    next[key] = value;
  }

  return next;
}

export function stripBulkyCartItems(items: CartItem[]): CartItem[] {
  return items.map((item) => ({
    ...item,
    designPreview: isDataUrl(item.designPreview) ? undefined : item.designPreview,
    backDesignPreview: isDataUrl(item.backDesignPreview)
      ? undefined
      : item.backDesignPreview,
    leftDesignPreview: isDataUrl(item.leftDesignPreview)
      ? undefined
      : item.leftDesignPreview,
    rightDesignPreview: isDataUrl(item.rightDesignPreview)
      ? undefined
      : item.rightDesignPreview,
    metadata: item.metadata ? stripBulkyMetadata(item.metadata) : undefined,
  }));
}

function readLegacyLocalStorageCart(): CartItem[] | null {
  if (typeof localStorage === 'undefined') return null;

  try {
    const stored = localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as CartItem[];
  } catch {
    return null;
  }
}

function clearLegacyLocalStorageCart() {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export async function loadCartFromStorage(): Promise<CartItem[] | null> {
  try {
    const fromIndexedDb = await idbGet<CartItem[]>(STORAGE_KEY);
    if (fromIndexedDb) return fromIndexedDb;
  } catch (error) {
    console.warn('[cart] Failed to load cart from IndexedDB', error);
  }

  const legacy = readLegacyLocalStorageCart();
  if (!legacy) return null;

  try {
    await saveCartToStorage(legacy);
    clearLegacyLocalStorageCart();
    return legacy;
  } catch (error) {
    console.warn('[cart] Failed to migrate cart from localStorage', error);
    return legacy;
  }
}

export async function saveCartToStorage(items: CartItem[]): Promise<void> {
  try {
    await idbSet(STORAGE_KEY, items);
    clearLegacyLocalStorageCart();
    return;
  } catch (error) {
    console.warn('[cart] Failed to save full cart to IndexedDB', error);
  }

  try {
    await idbSet(STORAGE_KEY, stripBulkyCartItems(items));
    clearLegacyLocalStorageCart();
    return;
  } catch (error) {
    console.warn('[cart] Failed to save stripped cart to IndexedDB', error);
  }

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        LEGACY_LOCAL_STORAGE_KEY,
        JSON.stringify(stripBulkyCartItems(items)),
      );
    }
  } catch (error) {
    console.warn('[cart] Failed to persist cart anywhere', error);
  }
}

export async function clearCartStorage(): Promise<void> {
  try {
    await idbDelete(STORAGE_KEY);
  } catch {
    // ignore
  }
  clearLegacyLocalStorageCart();
}
