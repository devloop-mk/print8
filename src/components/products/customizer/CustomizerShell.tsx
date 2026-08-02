'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  ZoomIn,
  ZoomOut,
  Copy,
  Shirt,
  Type,
  Image as ImageIcon,
  Sparkles,
  Palette,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { EditorPanel } from '@/components/products/customizer/types';
import type { ProductSide } from '@/lib/data/catalog';

const SPLIT_MIN = 32;
const SPLIT_MAX = 72;
const SPLIT_DEFAULT = 56;

function clampSplit(value: number) {
  return Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, value));
}

export function CustomizerShell({
  topBar,
  contextBar,
  canvas,
  panel,
  activePanel,
  onPanelChange,
  showDesignPanel,
  showColorPanel,
  sides,
  activeSide,
  onSideChange,
  sideLabel,
  sideHasContent,
  hasMultipleSides,
  copyDesignLabel,
  onCopyDesign,
  canvasZoom,
  onZoomChange,
  mobileBottomBar,
  mobileSheet,
  sidePreview,
  mobileStackedPreview = false,
}: {
  topBar: React.ReactNode;
  contextBar: React.ReactNode;
  canvas: React.ReactNode;
  panel: React.ReactNode;
  activePanel: EditorPanel;
  onPanelChange: (panel: EditorPanel) => void;
  showDesignPanel: boolean;
  /** Drinkware body-glaze swatches (classic mug white / blue / black). */
  showColorPanel?: boolean;
  sides: ProductSide[];
  activeSide: ProductSide;
  onSideChange: (side: ProductSide) => void;
  sideLabel: (side: ProductSide) => string;
  sideHasContent: (side: ProductSide) => boolean;
  hasMultipleSides: boolean;
  copyDesignLabel?: string;
  onCopyDesign?: () => void;
  canvasZoom: number;
  onZoomChange: (zoom: number) => void;
  mobileBottomBar: React.ReactNode;
  mobileSheet: React.ReactNode;
  /** Drinkware flat + 3D stack on mobile — needs taller scroll padding, no zoom bar. */
  mobileStackedPreview?: boolean;
  /** Live 3D preview shown beside the canvas on wide desktop (drinkware). */
  sidePreview?: React.ReactNode;
}) {
  const t = useTranslations('products.customizer');
  const splitRowRef = useRef<HTMLDivElement>(null);
  const [splitPercent, setSplitPercent] = useState(SPLIT_DEFAULT);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  const items = [
    {
      id: 'product' as const,
      label: t('tabProduct'),
      icon: <Shirt className="h-5 w-5" />,
    },
    {
      id: 'color' as const,
      label: t('tabColor'),
      icon: <Palette className="h-5 w-5" />,
      show: showColorPanel,
    },
    {
      id: 'text' as const,
      label: t('tabText'),
      icon: <Type className="h-5 w-5" />,
    },
    {
      id: 'photo' as const,
      label: t('tabUpload'),
      icon: <ImageIcon className="h-5 w-5" />,
    },
    {
      id: 'stickers' as const,
      label: t('tabElements'),
      icon: <Sparkles className="h-5 w-5" />,
    },
    {
      id: 'design' as const,
      label: t('designColor'),
      icon: <Palette className="h-5 w-5" />,
      show: showDesignPanel,
    },
  ].filter((item) => item.show !== false);

  const updateSplitFromClientX = useCallback((clientX: number) => {
    const row = splitRowRef.current;
    if (!row) return;
    const rect = row.getBoundingClientRect();
    if (rect.width <= 0) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setSplitPercent(clampSplit(next));
  }, []);

  useEffect(() => {
    if (!isDraggingSplit) return;

    const onMove = (event: PointerEvent) => {
      updateSplitFromClientX(event.clientX);
    };
    const onUp = () => setIsDraggingSplit(false);

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingSplit, updateSplitFromClientX]);

  const canvasColumn = (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="pointer-events-none absolute inset-x-0 top-2 z-20 flex justify-center px-4">
        <div className="pointer-events-auto">{contextBar}</div>
      </div>

      <div
        className={cn(
          'min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain p-2 [-webkit-overflow-scrolling:touch] md:p-3',
          !sidePreview && 'md:flex md:items-center md:justify-center',
        )}
      >
        <div
          className={cn(
            'mx-auto w-full min-h-min shrink-0 origin-center transition-transform duration-150',
            !sidePreview && 'md:flex md:min-h-full md:items-center md:justify-center',
          )}
          style={{ transform: `scale(${canvasZoom / 100})` }}
        >
          {canvas}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col overflow-hidden bg-white md:pb-0',
        mobileStackedPreview
          ? 'pb-[max(10.5rem,calc(9rem+env(safe-area-inset-bottom,0px)))]'
          : 'pb-[max(7.75rem,calc(6.5rem+env(safe-area-inset-bottom,0px)))]',
      )}
    >
      <div className="shrink-0">{topBar}</div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden shrink-0 md:flex" data-customizer-editor-chrome>
          <nav className="flex w-[5.25rem] flex-col items-center gap-1.5 border-r border-ink-200 bg-ink-50/80 py-3">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                title={item.label}
                onClick={() =>
                  onPanelChange(activePanel === item.id ? null : item.id)
                }
                className={cn(
                  'flex w-[4.5rem] flex-col items-center gap-1 rounded-xl px-1.5 py-2.5 text-[11px] font-semibold leading-tight transition',
                  activePanel === item.id
                    ? 'bg-white text-brand-700 shadow-sm ring-1 ring-brand-200'
                    : 'text-ink-600 hover:bg-white hover:text-ink-900',
                )}
              >
                {item.icon}
                <span className="max-w-full truncate">{item.label}</span>
              </button>
            ))}
          </nav>

          {activePanel ? (
            <div className="flex w-[22rem] flex-col border-r border-ink-200 bg-white lg:w-96">
              <div className="border-b border-ink-100 px-5 py-3.5">
                <h2 className="text-sm font-semibold text-ink-900">
                  {items.find((item) => item.id === activePanel)?.label}
                </h2>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-5">{panel}</div>
            </div>
          ) : null}
        </aside>

        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[#e9edf2]">
          {hasMultipleSides ? (
            <div
              className="flex shrink-0 flex-col items-center gap-2 border-b border-ink-200/60 bg-white/80 px-3 py-2 backdrop-blur-sm sm:flex-row sm:justify-center"
              data-customizer-editor-chrome
            >
              <div className="inline-flex rounded-lg bg-ink-100/80 p-1">
                {sides.map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => onSideChange(side)}
                    className={cn(
                      'relative rounded-md px-4 py-1.5 text-xs font-semibold transition',
                      activeSide === side
                        ? 'bg-white text-brand-700 shadow-sm'
                        : 'text-ink-600 hover:text-ink-900',
                    )}
                  >
                    {sideLabel(side)}
                    {sideHasContent(side) && activeSide !== side ? (
                      <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-brand-500" />
                    ) : null}
                  </button>
                ))}
              </div>
              {copyDesignLabel && onCopyDesign ? (
                <button
                  type="button"
                  onClick={onCopyDesign}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 transition hover:border-brand-300 hover:bg-brand-100"
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                  {copyDesignLabel}
                </button>
              ) : null}
            </div>
          ) : null}

          {sidePreview ? (
            <div ref={splitRowRef} className="flex min-h-0 flex-1">
              <div
                className="flex min-h-0 min-w-0 flex-col"
                style={{ width: `${splitPercent}%` }}
              >
                {canvasColumn}
              </div>

              <div
                role="separator"
                aria-orientation="vertical"
                aria-valuenow={Math.round(splitPercent)}
                aria-valuemin={SPLIT_MIN}
                aria-valuemax={SPLIT_MAX}
                aria-label={t('splitResizeHandle')}
                tabIndex={0}
                onPointerDown={(event) => {
                  event.preventDefault();
                  setIsDraggingSplit(true);
                  updateSplitFromClientX(event.clientX);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowLeft') {
                    event.preventDefault();
                    setSplitPercent((prev) => clampSplit(prev - 2));
                  } else if (event.key === 'ArrowRight') {
                    event.preventDefault();
                    setSplitPercent((prev) => clampSplit(prev + 2));
                  }
                }}
                className={cn(
                  'group relative z-10 flex w-3 shrink-0 cursor-col-resize items-center justify-center bg-transparent',
                  isDraggingSplit && 'bg-brand-100/40',
                )}
              >
                <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-ink-300 transition group-hover:bg-brand-400 group-focus-visible:bg-brand-500" />
                <span
                  className={cn(
                    'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-ink-200 bg-white shadow-sm transition',
                    'group-hover:border-brand-300 group-focus-visible:border-brand-400',
                    isDraggingSplit && 'border-brand-400 shadow-md',
                  )}
                >
                  <span className="flex gap-0.5" aria-hidden>
                    <span className="h-3 w-0.5 rounded-full bg-ink-400" />
                    <span className="h-3 w-0.5 rounded-full bg-ink-400" />
                  </span>
                </span>
              </div>

              <div
                className="flex min-h-0 min-w-0 flex-col border-l border-ink-200/60 bg-white"
                style={{ width: `${100 - splitPercent}%` }}
              >
                {sidePreview}
              </div>
            </div>
          ) : (
            canvasColumn
          )}

          <div
            className={cn(
              'h-12 shrink-0 items-center justify-center gap-3 border-t border-ink-200/70 bg-white px-4',
              mobileStackedPreview ? 'hidden md:flex' : 'flex',
            )}
            data-customizer-editor-chrome
          >
            <button
              type="button"
              onClick={() => onZoomChange(Math.max(40, canvasZoom - 10))}
              className="flex h-8 w-8 items-center justify-center rounded-md text-ink-500 hover:bg-ink-50"
              aria-label={t('zoomOut')}
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <input
              type="range"
              min={40}
              max={130}
              step={5}
              value={canvasZoom}
              onChange={(e) => onZoomChange(Number(e.target.value))}
              className="w-32 accent-brand-600 md:w-48"
              aria-label={t('editorZoom')}
            />
            <span className="w-10 text-center text-xs font-medium text-ink-600">
              {canvasZoom}%
            </span>
            <button
              type="button"
              onClick={() => onZoomChange(Math.min(130, canvasZoom + 10))}
              className="flex h-8 w-8 items-center justify-center rounded-md text-ink-500 hover:bg-ink-50"
              aria-label={t('zoomIn')}
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </main>
      </div>

      {mobileBottomBar}
      {mobileSheet}
    </div>
  );
}
