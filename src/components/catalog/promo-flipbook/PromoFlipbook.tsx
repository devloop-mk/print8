'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PageFlip } from 'page-flip/dist/js/page-flip.module.js';
import { Link } from '@/i18n/navigation';
import { Logo } from '@/components/brand/Logo';
import { PROMO_CATALOG_PAGES } from '@/lib/catalog/promo-catalog';
import { PromoCatalogPageView } from '@/components/catalog/promo-flipbook/PromoCatalogPages';
import '@/components/catalog/promo-flipbook/promo-flipbook.css';

type FlipPoint = { x: number; y: number };

type FlipController = {
  isPointOnCorners: (pos: FlipPoint) => boolean;
  getBoundsRect: () => { pageWidth: number; width: number; height: number };
  render: { convertToBook: (pos: FlipPoint) => FlipPoint };
};

/** StPageFlip uses ~20% of the page diagonal as the corner hover zone. */
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

export function PromoFlipbook() {
  const t = useTranslations('promoCatalog');
  const pages = PROMO_CATALOG_PAGES;
  const sourceRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<PageFlip | null>(null);
  const [ready, setReady] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(pages.length);

  useEffect(() => {
    const source = sourceRef.current;
    const stage = stageRef.current;
    if (!source || !stage) return;

    const host = document.createElement('div');
    host.className = 'promo-flipbook-book';
    stage.replaceChildren(host);

    const leaves = Array.from(
      source.querySelectorAll<HTMLElement>('[data-catalog-page]'),
    ).map((node) => node.cloneNode(true) as HTMLElement);
    host.replaceChildren(...leaves);

    const portrait = window.matchMedia('(max-width: 860px)').matches;
    let pageFlip: PageFlip;
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
        usePortrait: portrait,
      });
      pageFlip.loadFromHTML(leaves);
      restrictPageFlipCornerHit(pageFlip);
    } catch {
      stage.replaceChildren();
      return undefined;
    }

    pageFlip.on('flip', (event) => {
      setPageIndex(Number(event.data) || 0);
    });

    flipRef.current = pageFlip;
    setPageCount(pageFlip.getPageCount());
    setPageIndex(pageFlip.getCurrentPageIndex());
    setReady(true);

    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => pageFlip.update())
        : null;
    observer?.observe(stage);

    return () => {
      observer?.disconnect();
      pageFlip.off('flip');
      try {
        pageFlip.destroy();
      } catch {
        /* host already detached */
      }
      flipRef.current = null;
      stage.replaceChildren();
    };
  }, []);

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
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const last = pageCount - 1;
  const canPrev = pageIndex > 0;
  const canNext = pageIndex < last;
  const pageLabel =
    pageIndex === 0 || pageIndex >= last
      ? `${pageIndex + 1}`
      : `${pageIndex + 1}–${Math.min(pageIndex + 2, pageCount)}`;

  return (
    <div className="flex h-dvh min-h-0 min-w-0 flex-col overflow-hidden bg-[#d5dde3]">
      <header className="flex items-center justify-between gap-3 border-b border-black/5 bg-white/80 px-4 py-2.5 backdrop-blur">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-7 w-auto" />
        </Link>
        <p className="hidden text-center text-sm font-medium text-ink-700 sm:block">
          {t('title')}
          <span className="ml-3 font-normal tabular-nums text-ink-400">
            {pageLabel}/{pageCount}
          </span>
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-ink-600 hover:text-brand-700"
        >
          <X className="h-4 w-4" />
          {t('close')}
        </Link>
      </header>

      <div
        ref={sourceRef}
        aria-hidden
        className="pointer-events-none absolute left-[-9999px] top-0 h-[650px] w-[460px] overflow-hidden"
      >
        {pages.map((page) => (
          <div
            key={page.id}
            data-catalog-page
            data-density={
              page.id === 'cover' || page.id === 'back' ? 'hard' : 'soft'
            }
            className="promo-flipbook-page h-full w-full"
          >
            <PromoCatalogPageView
              pageId={page.id}
              pageNumber={page.number}
              productIds={page.productIds}
            />
          </div>
        ))}
      </div>

      <div className="relative flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-visible px-3 py-3 sm:px-8">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={!ready || !canPrev}
          className="absolute left-2 z-20 rounded-full bg-white/90 p-2 text-ink-800 shadow-md disabled:opacity-30 sm:left-4"
          aria-label={t('prev')}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div ref={stageRef} className="promo-flipbook-stage" />

        <button
          type="button"
          onClick={() => go(1)}
          disabled={!ready || !canNext}
          className="absolute right-2 z-20 rounded-full bg-white/90 p-2 text-ink-800 shadow-md disabled:opacity-30 sm:right-4"
          aria-label={t('next')}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

    </div>
  );
}
