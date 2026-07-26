export const CATALOG_GRID_PREFERENCES_KEY = 'print8-catalog-grid';

export type MobileColumns = 1 | 2;
export type DesktopColumns = 3 | 4;

export type CatalogGridPreferences = {
  mobileColumns?: MobileColumns;
  desktopColumns?: DesktopColumns;
};

function isMobileColumns(value: unknown): value is MobileColumns {
  return value === 1 || value === 2;
}

function isDesktopColumns(value: unknown): value is DesktopColumns {
  return value === 3 || value === 4;
}

export function readCatalogGridPreferences(): CatalogGridPreferences | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(CATALOG_GRID_PREFERENCES_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    const record = parsed as Record<string, unknown>;
    const preferences: CatalogGridPreferences = {};

    if (isMobileColumns(record.mobileColumns)) {
      preferences.mobileColumns = record.mobileColumns;
    }
    if (isDesktopColumns(record.desktopColumns)) {
      preferences.desktopColumns = record.desktopColumns;
    }

    return Object.keys(preferences).length > 0 ? preferences : null;
  } catch {
    return null;
  }
}

export function writeCatalogGridPreferences(
  patch: CatalogGridPreferences,
): void {
  if (typeof window === 'undefined') return;

  const current = readCatalogGridPreferences() ?? {};
  const next: CatalogGridPreferences = { ...current, ...patch };

  localStorage.setItem(CATALOG_GRID_PREFERENCES_KEY, JSON.stringify(next));
}
