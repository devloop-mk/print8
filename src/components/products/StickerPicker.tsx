'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';
import { useTranslations } from 'next-intl';
import {
  STICKER_CATEGORIES,
  getStickerById,
  getStickersByCategory,
  type StickerCategory,
} from '@/lib/products/sticker-library';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import {
  Flame,
  Heart,
  Sparkles,
  PartyPopper,
  Flower2,
  Flag,
  MessageSquareText,
  Plus,
} from 'lucide-react';

const CATEGORY_ICONS: Record<
  StickerCategory,
  ComponentType<{ className?: string }>
> = {
  reactions: Flame,
  love: Heart,
  vibes: Sparkles,
  fun: PartyPopper,
  cute: Flower2,
  flags: Flag,
  text: MessageSquareText,
};

type StickerPickerProps = {
  onSelect: (stickerId: string) => void;
  disabled?: boolean;
  /** Mobile bottom-sheet layout: shorter, scrollable grid, sticky add bar */
  compact?: boolean;
  className?: string;
};

export function StickerPicker({
  onSelect,
  disabled,
  compact,
  className,
}: StickerPickerProps) {
  const t = useTranslations('products.customizer');
  const [category, setCategory] = useState<StickerCategory>('reactions');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickers = getStickersByCategory(category);

  useEffect(() => {
    setSelectedId(null);
  }, [category]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function updateScrollHint() {
      const canScroll = el.scrollHeight > el.clientHeight + 4;
      const nearBottom =
        el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
      setShowScrollHint(canScroll && !nearBottom);
    }

    updateScrollHint();
    el.addEventListener('scroll', updateScrollHint, { passive: true });
    const observer = new ResizeObserver(updateScrollHint);
    observer.observe(el);

    return () => {
      el.removeEventListener('scroll', updateScrollHint);
      observer.disconnect();
    };
  }, [category, stickers.length, compact]);

  const selectedSticker = selectedId ? getStickerById(selectedId) : null;

  function handleAdd() {
    if (!selectedId || disabled) return;
    onSelect(selectedId);
    setSelectedId(null);
  }

  const footer = (
    <div
      className={cn(
        'shrink-0 bg-white',
        compact
          ? 'border-t border-ink-100 pt-3 pb-[max(0.25rem,env(safe-area-inset-bottom,0px))]'
          : 'pt-2',
        selectedSticker && compact && 'shadow-[0_-8px_24px_rgba(15,23,42,0.06)]',
      )}
    >
      {selectedSticker ? (
        <Button
          type="button"
          onClick={handleAdd}
          disabled={disabled}
          className="mb-2 w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('addSelectedSticker')}
        </Button>
      ) : null}
      <p className="text-xs leading-relaxed text-ink-500">{t('stickerHint')}</p>
    </div>
  );

  return (
    <div
      className={cn(
        compact ? 'flex h-full min-h-0 flex-col' : 'space-y-3',
        className,
      )}
    >
      <div
        className={cn(
          'flex shrink-0 gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          compact && 'pb-2',
        )}
        role="tablist"
        aria-label={t('stickerCategories')}
      >
        {STICKER_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat];
          const active = category === cat;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={disabled}
              onClick={() => setCategory(cat)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                active
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-700',
                disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {t(`stickerCategory.${cat}`)}
            </button>
          );
        })}
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          className={cn(
            'h-full overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]',
            compact ? 'min-h-[10rem]' : 'max-h-[min(24rem,55vh)]',
          )}
          role="tabpanel"
        >
          <div
            className={cn(
              'grid grid-cols-4 gap-2 sm:grid-cols-5',
              compact && 'grid-cols-4 gap-1.5 pb-2',
            )}
          >
            {stickers.map((sticker) => {
              const isSelected = selectedId === sticker.id;
              return (
                <button
                  key={sticker.id}
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    setSelectedId((current) =>
                      current === sticker.id ? null : sticker.id,
                    )
                  }
                  className={cn(
                    'relative flex aspect-square items-center justify-center rounded-xl border bg-gradient-to-br from-ink-50 to-white p-2 transition',
                    compact && 'p-1.5',
                    isSelected
                      ? 'border-brand-500 ring-2 ring-brand-200'
                      : 'border-ink-100 hover:border-brand-300 hover:shadow-sm',
                    disabled && 'cursor-not-allowed opacity-50',
                  )}
                  aria-label={t(`sticker.${sticker.id}`)}
                  aria-pressed={isSelected}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sticker.src}
                    alt=""
                    draggable={false}
                    className="h-full w-full object-contain"
                  />
                  {isSelected ? (
                    <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white shadow-md">
                      <Plus className="h-3 w-3" aria-hidden />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {showScrollHint ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-white via-white/90 to-transparent pb-1 pt-8"
            aria-hidden
          >
            <span className="rounded-full bg-ink-100 px-2.5 py-0.5 text-[10px] font-medium text-ink-600">
              {t('stickerScrollMore')}
            </span>
          </div>
        ) : null}
      </div>

      {footer}
    </div>
  );
}
