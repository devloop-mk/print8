'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Columns2, Square } from 'lucide-react';

type MobileColumns = 1 | 2;
type DesktopColumns = 3 | 4;

type CatalogGridContextValue = {
  mobileColumns: MobileColumns;
  setMobileColumns: (columns: MobileColumns) => void;
  desktopColumns: DesktopColumns;
  mobileColumnToggle: boolean;
};

const CatalogGridContext = createContext<CatalogGridContextValue | null>(null);

function useCatalogGrid() {
  const context = useContext(CatalogGridContext);
  if (!context) {
    throw new Error('Catalog grid components must be used within CatalogGridProvider');
  }
  return context;
}

export function getCatalogGridClassName({
  mobileColumns,
  desktopColumns,
  mobileColumnToggle,
  gapClassName = 'gap-4 sm:gap-6',
  className,
}: {
  mobileColumns: MobileColumns;
  desktopColumns: DesktopColumns;
  mobileColumnToggle: boolean;
  gapClassName?: string;
  className?: string;
}) {
  return cn(
    'grid',
    gapClassName,
    mobileColumnToggle
      ? cn(
          mobileColumns === 1 ? 'grid-cols-1' : 'grid-cols-2',
          desktopColumns === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3',
        )
      : cn(
          'sm:grid-cols-2',
          desktopColumns === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3',
        ),
    className,
  );
}

export function CatalogGridProvider({
  children,
  desktopColumns = 4,
  mobileColumnToggle = true,
}: {
  children: ReactNode;
  desktopColumns?: DesktopColumns;
  mobileColumnToggle?: boolean;
}) {
  const [mobileColumns, setMobileColumns] = useState<MobileColumns>(2);

  const value = useMemo(
    () => ({
      mobileColumns,
      setMobileColumns,
      desktopColumns,
      mobileColumnToggle,
    }),
    [desktopColumns, mobileColumnToggle, mobileColumns],
  );

  return (
    <CatalogGridContext.Provider value={value}>{children}</CatalogGridContext.Provider>
  );
}

export function CatalogGridToggle({
  className,
}: {
  className?: string;
}) {
  const t = useTranslations('catalogGrid');
  const { mobileColumns, setMobileColumns, mobileColumnToggle } = useCatalogGrid();

  if (!mobileColumnToggle) return null;

  return (
    <div
      className={cn('flex justify-end lg:hidden', className)}
      role="group"
      aria-label={t('view')}
    >
      <div className="inline-flex rounded-lg border border-ink-200 bg-ink-50 p-1">
        <button
          type="button"
          onClick={() => setMobileColumns(1)}
          aria-pressed={mobileColumns === 1}
          aria-label={t('oneColumn')}
          className={cn(
            'inline-flex items-center justify-center rounded-md p-2 transition',
            mobileColumns === 1
              ? 'bg-white text-brand-700 shadow-sm'
              : 'text-ink-600 hover:text-ink-900',
          )}
        >
          <Square className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setMobileColumns(2)}
          aria-pressed={mobileColumns === 2}
          aria-label={t('twoColumns')}
          className={cn(
            'inline-flex items-center justify-center rounded-md p-2 transition',
            mobileColumns === 2
              ? 'bg-white text-brand-700 shadow-sm'
              : 'text-ink-600 hover:text-ink-900',
          )}
        >
          <Columns2 className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

export function CatalogGrid({
  children,
  className,
  gapClassName,
}: {
  children: ReactNode;
  className?: string;
  gapClassName?: string;
}) {
  const { mobileColumns, desktopColumns, mobileColumnToggle } = useCatalogGrid();

  return (
    <div
      className={getCatalogGridClassName({
        mobileColumns,
        desktopColumns,
        mobileColumnToggle,
        gapClassName,
        className,
      })}
    >
      {children}
    </div>
  );
}

export function CatalogGridLayout({
  children,
  className,
  gridClassName,
  desktopColumns = 4,
  mobileColumnToggle = true,
  toggleClassName,
  gapClassName,
}: {
  children: ReactNode;
  className?: string;
  gridClassName?: string;
  desktopColumns?: DesktopColumns;
  mobileColumnToggle?: boolean;
  toggleClassName?: string;
  gapClassName?: string;
}) {
  return (
    <CatalogGridProvider
      desktopColumns={desktopColumns}
      mobileColumnToggle={mobileColumnToggle}
    >
      <div className={className}>
        <CatalogGridToggle className={cn('mb-4', toggleClassName)} />
        <CatalogGrid gapClassName={gapClassName} className={gridClassName}>
          {children}
        </CatalogGrid>
      </div>
    </CatalogGridProvider>
  );
}
