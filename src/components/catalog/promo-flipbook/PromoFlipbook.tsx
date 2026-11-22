'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Printer, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PageFlip } from 'page-flip/dist/js/page-flip.module.js';
import { Link } from '@/i18n/navigation';
import { Logo } from '@/components/brand/Logo';
import {
  PROMO_CATALOG_PAGES_COMPACT,
  PROMO_CATALOG_PAGES_DENSE,
  mapPromoCatalogPageIndex,
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
  const stopFlip = (event: Event) => {
    if (isFlipbookInteractiveTarget(event.target)) event.stopPropagation();
  };
  const goToListedPage = (event: Event) => {
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

  host.addEventListener('mousedown', stopFlip, true);
  host.addEventListener('touchstart', stopFlip, true);
  host.addEventListener('click', goToListedPage, true);

  return () => {
    host.removeEventListener('mousedown', stopFlip, true);
    host.removeEventListener('touchstart', stopFlip, true);
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

export function PromoFlipbook() {
  const t = useTranslations('promoCatalog');
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
    const sync = () => setCompact(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
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
        drawShadow: true,
        flippingTime: 900,
        maxShadowOpacity: 0.55,
        useMouseEvents: true,
        startZIndex: 1,
        autoSize: true,
        mobileScrollSupport: false,
        swipeDistance: 24,
        clickEventForward: true,
        usePortrait: compact,
        startPage,
      });
      const refit = () => fitPromoProductText(host);
      pageFlip.on('init', refit);
      pageFlip.loadFromHTML(leaves);
      restrictPageFlipCornerHit(pageFlip);
      unbindShortcuts = bindFlipbookPageShortcuts(host, pageFlip);
      if (pageFlip.getCurrentPageIndex() !== startPage) {
        pageFlip.turnToPage(startPage);
      }
      requestAnimationFrame(refit);
      setTimeout(refit, 200);
    } catch (error) {
      console.error('Promo flipbook failed to start', error);
      unbindShortcuts?.();
      stage.replaceChildren();
      return undefined;
    }

    pageFlip.on('flip', (event) => {
      const index = Number(event.data) || 0;
      setPageIndex(index);
      writePromoCatalogPageIndex(index);
      requestAnimationFrame(() => fitPromoProductText(host));
    });

    flipRef.current = pageFlip;
    setPageCount(pageFlip.getPageCount());
    setPageIndex(pageFlip.getCurrentPageIndex());
    setReady(true);

    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            pageFlip.update();
            fitPromoProductText(host);
          })
        : null;
    observer?.observe(stage);

    return () => {
      unbindShortcuts?.();
      observer?.disconnect();
      pageFlip.off('flip');
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

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
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
    <div className="promo-catalog-shell flex h-dvh min-h-0 min-w-0 flex-col overflow-hidden bg-[#d5dde3]">
      <header className="promo-catalog-chrome flex items-center justify-between gap-3 border-b border-black/5 bg-white/80 px-4 py-2.5 backdrop-blur">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-7 w-auto" />
        </Link>
        <p className="text-center text-sm font-medium text-ink-700">
          <span className="hidden sm:inline">{t('title')}</span>
          <span className="font-normal tabular-nums text-ink-400 sm:ml-3">
            {pageLabel}/{pageCount}
          </span>
        </p>
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
        <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-visible px-3 py-2 sm:px-8 sm:py-3">
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
