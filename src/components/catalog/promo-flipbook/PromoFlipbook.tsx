'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Printer, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PageFlip } from 'page-flip/dist/js/page-flip.module.js';
import { Link } from '@/i18n/navigation';
import { Logo } from '@/components/brand/Logo';
import {
  PROMO_CATALOG_PAGES_COMPACT,
  PROMO_CATALOG_PAGES_DENSE,
  calendarTocRanges,
  mapPromoCatalogPageIndex,
  merchTocRanges,
  type PromoCatalogPage,
} from '@/lib/catalog/promo-catalog';
import { PromoCatalogPageView } from '@/components/catalog/promo-flipbook/PromoCatalogPages';
import { fitPromoProductText } from '@/components/catalog/promo-flipbook/fitPromoProductText';
import '@/components/catalog/promo-flipbook/promo-flipbook.css';

type FlipPoint = { x: number; y: number };

type FlipController = {
  isPointOnCorners: (pos: FlipPoint) => boolean;
  getBoundsRect: () => { pageWidth: number; width: number; height: number };
  render: { convertToBook: (pos: FlipPoint) => FlipPoint };
};

/** Facebook / Messenger in-app browsers (and Instagram’s sibling WebView). */
const IN_APP_BROWSER_UA = /FBAN|FBAV|FB_IAB|FBIOS|FB4A|Messenger|Instagram/i;

function isMessengerInAppBrowser() {
  return IN_APP_BROWSER_UA.test(navigator.userAgent);
}

function prefersCoarsePointer() {
  return window.matchMedia('(pointer: coarse)').matches;
}

function isPageFlipInMotion(state: string) {
  return (
    state === 'flipping' || state === 'user_fold' || state === 'fold_corner'
  );
}

function readPromoCatalogPageIndex(pageCount: number) {
  const raw = new URLSearchParams(window.location.search).get('page');
  const parsed = Number.parseInt(raw ?? '1', 10);
  const page = Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
  return Math.min(page, Math.max(1, pageCount)) - 1;
}

function writePromoCatalogPageIndex(index: number) {
  const params = new URLSearchParams(window.location.search);
  const page = index + 1;
  if (page <= 1) params.delete('page');
  else params.set('page', String(page));
  const query = params.toString();
  const next = query
    ? `${window.location.pathname}?${query}${window.location.hash}`
    : `${window.location.pathname}${window.location.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (current === next) return;
  window.history.replaceState(window.history.state, '', next);
}

/** StPageFlip uses ~20% of the page diagonal as the corner hover zone. */
function isFlipbookInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('a, button, [data-catalog-goto]'));
}

function bindFlipbookPageShortcuts(host: HTMLElement, pageFlip: PageFlip) {
  let touchStart: { x: number; y: number; fromLink: boolean } | null = null;
  let ignoreClick = false;

  const stopMouseFlip = (event: Event) => {
    if (isFlipbookInteractiveTarget(event.target)) event.stopPropagation();
  };

  const onTouchStart = (event: TouchEvent) => {
    const touch = event.changedTouches[0];
    if (!touch) return;
    touchStart = {
      x: touch.clientX,
      y: touch.clientY,
      fromLink: isFlipbookInteractiveTarget(event.target),
    };
    ignoreClick = false;
  };

  const onTouchMove = (event: TouchEvent) => {
    if (!touchStart?.fromLink) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;
    if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
      event.preventDefault();
    }
  };

  const onTouchEnd = (event: TouchEvent) => {
    const start = touchStart;
    touchStart = null;
    if (!start?.fromLink) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 32 || Math.abs(dx) < Math.abs(dy) * 1.1) return;
    ignoreClick = true;
    event.preventDefault();
    if (dx < 0) pageFlip.flipNext();
    else pageFlip.flipPrev();
  };

  const goToListedPage = (event: Event) => {
    if (ignoreClick) {
      event.preventDefault();
      event.stopPropagation();
      ignoreClick = false;
      return;
    }
    const link =
      event.target instanceof Element
        ? event.target.closest('[data-catalog-goto]')
        : null;
    if (!link) return;
    event.preventDefault();
    event.stopPropagation();
    const page = Number.parseInt(link.getAttribute('data-catalog-goto') ?? '', 10);
    if (!Number.isFinite(page)) return;
    const index = Math.max(0, page - 1);
    pageFlip.turnToPage(index);
    writePromoCatalogPageIndex(index);
  };

  host.addEventListener('mousedown', stopMouseFlip, true);
  host.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
  host.addEventListener('touchmove', onTouchMove, { capture: true, passive: false });
  host.addEventListener('touchend', onTouchEnd, { capture: true, passive: false });
  host.addEventListener('click', goToListedPage, true);

  return () => {
    host.removeEventListener('mousedown', stopMouseFlip, true);
    host.removeEventListener('touchstart', onTouchStart, true);
    host.removeEventListener('touchmove', onTouchMove, true);
    host.removeEventListener('touchend', onTouchEnd, true);
    host.removeEventListener('click', goToListedPage, true);
  };
}

function restrictPageFlipCornerHit(pageFlip: PageFlip) {
  const flip = (pageFlip as unknown as { flipController?: FlipController })
    .flipController;
  if (!flip?.getBoundsRect || !flip.render?.convertToBook) return;

  flip.isPointOnCorners = function isPointOnCorners(globalPos: FlipPoint) {
    const rect = this.getBoundsRect();
    const bookPos = this.render.convertToBook(globalPos);
    const corner = Math.min(
      56,
      Math.max(36, Math.min(rect.pageWidth, rect.height) * 0.08),
    );

    return (
      bookPos.x > 0 &&
      bookPos.y > 0 &&
      bookPos.x < rect.width &&
      bookPos.y < rect.height &&
      (bookPos.x < corner || bookPos.x > rect.width - corner) &&
      (bookPos.y < corner || bookPos.y > rect.height - corner)
    );
  };
}

function CatalogPageLeaves({ pages }: { pages: PromoCatalogPage[] }) {
  return (
    <>
      {pages.map((page) => (
        <div
          key={page.id}
          data-catalog-page
          data-page-id={page.id}
          data-density={
            page.id === 'cover' || page.id === 'back' ? 'hard' : 'soft'
          }
          className="promo-flipbook-page h-full w-full"
        >
          <PromoCatalogPageView
            pageId={page.id}
            pageNumber={page.number}
            productIds={page.productIds}
            section={page.section}
            catalogPages={pages}
          />
        </div>
      ))}
    </>
  );
}

function catalogJumpLabel(
  page: PromoCatalogPage,
  t: (key: string) => string,
  merchRanges: ReturnType<typeof merchTocRanges>,
  calendarRanges: ReturnType<typeof calendarTocRanges>,
) {
  if (page.id === 'cover') return t('cover');
  if (page.id === 'contents') return t('contents');
  if (page.id === 'info') return t('infoTitle');
  if (page.id === 'back') return t('backCover');
  if (page.tocKey) return t(`contentsLines.${page.tocKey}`);
  if (page.section === 'merch') {
    const match = merchRanges.find(
      (range) =>
        page.number >= range.pageNumber &&
        page.number <= (range.endPage ?? range.pageNumber),
    );
    return match ? t(`contentsLines.${match.key}`) : t('sectionMerch');
  }
  if (page.section === 'calendars') {
    const match = calendarRanges.find(
      (range) =>
        page.number >= range.pageNumber &&
        page.number <= (range.endPage ?? range.pageNumber),
    );
    return match ? t(`contentsLines.${match.key}`) : t('sectionCalendars');
  }
  return String(page.number);
}

function CatalogPageJump({
  pages,
  pageIndex,
  pageCount,
  pageLabel,
  disabled,
  onJump,
}: {
  pages: PromoCatalogPage[];
  pageIndex: number;
  pageCount: number;
  pageLabel: string;
  disabled: boolean;
  onJump: (index: number) => void;
}) {
  const t = useTranslations('promoCatalog');
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(pageIndex + 1));
  const merchRanges = merchTocRanges(pages);
  const calendarRanges = calendarTocRanges(pages);

  useEffect(() => {
    setValue(String(pageIndex + 1));
  }, [pageIndex]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const jumpTo = (raw: string | number) => {
    const parsed = typeof raw === 'number' ? raw : Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) return;
    const index = Math.min(pageCount, Math.max(1, parsed)) - 1;
    onJump(index);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-2.5 py-1 text-sm font-medium text-ink-700 shadow-sm hover:border-brand-500 hover:text-brand-700 disabled:opacity-40"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t('goToPage')}
      >
        <span className="tabular-nums">
          {pageLabel}/{pageCount}
        </span>
        <ChevronDown className="h-3.5 w-3.5 opacity-70" />
      </button>
      {open ? (
        <form
          className="absolute left-1/2 top-[calc(100%+0.4rem)] z-30 w-[min(16.5rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-black/10 bg-white p-3 shadow-lg"
          onSubmit={(event) => {
            event.preventDefault();
            jumpTo(value);
          }}
        >
          <label className="mb-1.5 block text-xs font-medium text-ink-500">
            {t('goToPage')}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={pageCount}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="w-full rounded-lg border border-black/10 px-2.5 py-1.5 text-sm tabular-nums text-ink-800 outline-none focus:border-brand-500"
              autoFocus
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              {t('goToPageGo')}
            </button>
          </div>
          <select
            value={String(pageIndex)}
            onChange={(event) => jumpTo(Number(event.target.value) + 1)}
            className="mt-2 w-full rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-sm text-ink-800 outline-none focus:border-brand-500"
            aria-label={t('goToPage')}
          >
            {pages.map((page, index) =>
              page.id === 'blank' ? null : (
                <option key={page.id} value={index}>
                  {page.number} · {catalogJumpLabel(page, t, merchRanges, calendarRanges)}
                </option>
              ),
            )}
          </select>
        </form>
      ) : null}
    </div>
  );
}

export function PromoFlipbook() {
  const t = useTranslations('promoCatalog');
  const shellRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<PageFlip | null>(null);
  const pageIndexRef = useRef(0);
  const lastPagesRef = useRef(PROMO_CATALOG_PAGES_DENSE);
  const firstInitRef = useRef(true);
  const [compact, setCompact] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(PROMO_CATALOG_PAGES_DENSE.length);
  const compactMode = compact === true;
  const pages = compactMode
    ? PROMO_CATALOG_PAGES_COMPACT
    : PROMO_CATALOG_PAGES_DENSE;
  pageIndexRef.current = pageIndex;

  useEffect(() => {
    const query = window.matchMedia('(max-width: 860px)');
    const coarse = window.matchMedia('(pointer: coarse)');
    const sync = () => {
      setCompact(query.matches);
      const shell = shellRef.current;
      if (!shell) return;
      const webview = isMessengerInAppBrowser();
      shell.classList.toggle('promo-catalog-shell--webview', webview);
      shell.classList.toggle(
        'promo-catalog-shell--reduced-fx',
        webview || query.matches || coarse.matches,
      );
    };
    sync();
    query.addEventListener('change', sync);
    coarse.addEventListener('change', sync);
    return () => {
      query.removeEventListener('change', sync);
      coarse.removeEventListener('change', sync);
    };
  }, []);

  useEffect(() => {
    if (compact === null) return;
    const source = sourceRef.current;
    const stage = stageRef.current;
    if (!source || !stage) return;

    setReady(false);
    const fromPages = lastPagesRef.current;
    lastPagesRef.current = pages;
    const startPage = firstInitRef.current
      ? readPromoCatalogPageIndex(source.querySelectorAll('[data-catalog-page]').length)
      : mapPromoCatalogPageIndex(fromPages, pages, pageIndexRef.current);
    firstInitRef.current = false;

    const host = document.createElement('div');
    host.className = 'promo-flipbook-book';
    stage.replaceChildren(host);

    const leaves = Array.from(
      source.querySelectorAll<HTMLElement>('[data-catalog-page]'),
    ).map((node) => node.cloneNode(true) as HTMLElement);
    host.replaceChildren(...leaves);
    let pageFlip: PageFlip;
    let unbindShortcuts: (() => void) | undefined;
    let resizeTimer = 0;
    let refitTimer = 0;
    let flipping = false;
    const reducedFx =
      isMessengerInAppBrowser() || compact || prefersCoarsePointer();
    const setFlipping = (next: boolean) => {
      flipping = next;
      shellRef.current?.classList.toggle('promo-catalog-shell--flipping', next);
    };
    const refitIfIdle = () => {
      if (flipping) return;
      fitPromoProductText(host);
    };
    const updateIfIdle = () => {
      if (flipping) return;
      pageFlip.update();
      fitPromoProductText(host);
    };
    try {
      pageFlip = new PageFlip(host, {
        width: 460,
        height: 650,
        size: 'stretch',
        minWidth: 280,
        maxWidth: 560,
        minHeight: 400,
        maxHeight: 820,
        showCover: true,
        drawShadow: !reducedFx,
        flippingTime: reducedFx ? 550 : 900,
        maxShadowOpacity: reducedFx ? 0 : 0.55,
        useMouseEvents: true,
        startZIndex: 1,
        autoSize: true,
        mobileScrollSupport: false,
        swipeDistance: 24,
        clickEventForward: true,
        usePortrait: compact,
        startPage,
      });
      pageFlip.on('init', refitIfIdle);
      pageFlip.loadFromHTML(leaves);
      restrictPageFlipCornerHit(pageFlip);
      unbindShortcuts = bindFlipbookPageShortcuts(host, pageFlip);
      if (pageFlip.getCurrentPageIndex() !== startPage) {
        pageFlip.turnToPage(startPage);
      }
      requestAnimationFrame(refitIfIdle);
      refitTimer = window.setTimeout(refitIfIdle, 200);
    } catch (error) {
      console.error('Promo flipbook failed to start', error);
      unbindShortcuts?.();
      stage.replaceChildren();
      return undefined;
    }

    pageFlip.on('changeState', (event) => {
      const busy = isPageFlipInMotion(String(event.data));
      setFlipping(busy);
      if (!busy) requestAnimationFrame(refitIfIdle);
    });

    pageFlip.on('flip', (event) => {
      const index = Number(event.data) || 0;
      setPageIndex(index);
      writePromoCatalogPageIndex(index);
      requestAnimationFrame(refitIfIdle);
    });

    flipRef.current = pageFlip;
    setPageCount(pageFlip.getPageCount());
    setPageIndex(pageFlip.getCurrentPageIndex());
    setReady(true);

    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            if (flipping) return;
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(updateIfIdle, 120);
          })
        : null;
    observer?.observe(stage);

    return () => {
      unbindShortcuts?.();
      observer?.disconnect();
      window.clearTimeout(resizeTimer);
      window.clearTimeout(refitTimer);
      setFlipping(false);
      pageFlip.off('flip');
      pageFlip.off('changeState');
      pageFlip.off('init');
      try {
        pageFlip.destroy();
      } catch {
        /* host already detached */
      }
      flipRef.current = null;
      stage.replaceChildren();
    };
  }, [compact, pages]);

  const go = useCallback((delta: number) => {
    const book = flipRef.current;
    if (!book) return;
    if (delta > 0) book.flipNext();
    else book.flipPrev();
  }, []);

  const goToIndex = useCallback((index: number) => {
    const book = flipRef.current;
    if (!book) return;
    const next = Math.min(Math.max(0, index), book.getPageCount() - 1);
    book.turnToPage(next);
    const current = book.getCurrentPageIndex();
    setPageIndex(current);
    writePromoCatalogPageIndex(current);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA')
      ) {
        return;
      }
      if (event.key === 'ArrowRight') go(1);
      if (event.key === 'ArrowLeft') go(-1);
    };
    const onPopState = () => {
      const book = flipRef.current;
      if (!book) return;
      const index = readPromoCatalogPageIndex(book.getPageCount());
      if (book.getCurrentPageIndex() !== index) book.turnToPage(index);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('popstate', onPopState);
    };
  }, [go]);

  const last = pageCount - 1;
  const canPrev = pageIndex > 0;
  const canNext = pageIndex < last;
  const pageLabel =
    compactMode || pageIndex === 0 || pageIndex >= last
      ? `${pageIndex + 1}`
      : `${pageIndex + 1}–${Math.min(pageIndex + 2, pageCount)}`;

  return (
    <div
      ref={shellRef}
      className="promo-catalog-shell flex h-dvh min-h-0 min-w-0 flex-col overflow-hidden bg-[#d5dde3]"
    >
      <header className="promo-catalog-chrome promo-catalog-header flex items-center justify-between gap-3 border-b border-black/5 bg-white/80 px-4 py-2.5 backdrop-blur">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-7 w-auto" />
        </Link>
        <div className="flex min-w-0 items-center justify-center gap-2">
          <p className="hidden truncate text-center text-sm font-medium text-ink-700 sm:block">
            {t('title')}
          </p>
          <CatalogPageJump
            pages={pages}
            pageIndex={pageIndex}
            pageCount={pageCount}
            pageLabel={pageLabel}
            disabled={!ready}
            onJump={goToIndex}
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="hidden items-center gap-1 text-sm font-medium text-ink-600 hover:text-brand-700 sm:inline-flex"
            aria-label={t('print')}
          >
            <Printer className="h-4 w-4" />
            <span>{t('print')}</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-ink-600 hover:text-brand-700"
          >
            <X className="h-4 w-4" />
            {t('close')}
          </Link>
        </div>
      </header>

      <div
        ref={sourceRef}
        aria-hidden
        className="pointer-events-none absolute left-[-9999px] top-0 h-[650px] w-[460px] overflow-hidden"
      >
        <CatalogPageLeaves pages={pages} />
      </div>

      <div
        aria-hidden
        className="promo-catalog-print"
      >
        <CatalogPageLeaves
          pages={PROMO_CATALOG_PAGES_DENSE.filter((page) => page.id !== 'blank')}
        />
      </div>

      <div className="promo-catalog-chrome flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden px-3 py-2 sm:px-8 sm:py-3">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={!ready || !canPrev}
            className="absolute left-2 z-20 hidden rounded-full bg-white/90 p-2 text-ink-800 shadow-md disabled:opacity-30 sm:inline-flex sm:left-4"
            aria-label={t('prev')}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div ref={stageRef} className="promo-flipbook-stage" />

          <button
            type="button"
            onClick={() => go(1)}
            disabled={!ready || !canNext}
            className="absolute right-2 z-20 hidden rounded-full bg-white/90 p-2 text-ink-800 shadow-md disabled:opacity-30 sm:inline-flex sm:right-4"
            aria-label={t('next')}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-8 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-1 sm:hidden">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={!ready || !canPrev}
            className="rounded-full bg-white p-2 text-ink-800 shadow-md disabled:opacity-30"
            aria-label={t('prev')}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={!ready || !canNext}
            className="rounded-full bg-white p-2 text-ink-800 shadow-md disabled:opacity-30"
            aria-label={t('next')}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
