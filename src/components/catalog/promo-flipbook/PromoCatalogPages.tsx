'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Logo } from '@/components/brand/Logo';
import {
  PROMO_CATALOG_COVER_IMAGES,
  calendarTocRanges,
  getPromoCatalogProduct,
  isCalendarProductId,
  merchTocRanges,
  type PromoCatalogPage,
  type PromoCatalogPageId,
} from '@/lib/catalog/promo-catalog';
import { PromoCatalogSheet } from '@/components/catalog/promo-flipbook/PromoCatalogSheet';
import { PromoCalendarCard } from '@/components/catalog/promo-flipbook/PromoCalendarCard';
import { PromoProductCard } from '@/components/catalog/promo-flipbook/PromoProductCard';

function CoverPage({ pageNumber }: { pageNumber: number }) {
  const t = useTranslations('promoCatalog');
  const contact = useTranslations('contact');

  return (
    <PromoCatalogSheet variant="cover" pageNumber={pageNumber}>
      <div className="absolute inset-0 bg-white">
        <div className="absolute inset-y-0 left-0 w-[72%] bg-brand-600" />
        <div className="absolute right-0 top-0 h-[38%] w-[28%] bg-white" />
        <div className="absolute bottom-0 right-0 h-[62%] w-[28%] bg-[#e8edf1]" />
        <div className="absolute left-[58%] top-0 h-full w-[1.15%] bg-brand-400/80" />
        <div className="absolute left-0 top-[38%] h-[1.1%] w-[72%] bg-brand-400/70" />

        <div className="absolute left-[8%] top-[8%] max-w-[54%]">
          <Logo className="h-10 w-auto brightness-0 invert sm:h-12" />
          <p className="mt-3 max-w-xs text-[clamp(0.7rem,1.15cqw,0.9rem)] leading-snug text-white/85">
            {t('tagline')}
          </p>
        </div>

        <div className="absolute left-[8%] top-[38%] max-w-[58%] -translate-y-1/2 pt-6">
          <p className="font-display text-[clamp(0.85rem,1.6cqw,1.15rem)] font-medium uppercase tracking-[0.22em] text-white/80">
            {t('kicker')}
          </p>
          <h1 className="mt-2 font-display text-[clamp(1.7rem,4.1cqw,3.35rem)] font-bold uppercase leading-[0.95] tracking-[-0.03em] text-white">
            {t('headline')}
          </h1>
        </div>

        <div className="absolute bottom-[14%] left-[8%] right-[8%] overflow-hidden bg-[#d9e1e8] shadow-[0_18px_40px_rgba(18,43,61,0.22)]">
          <div className="grid grid-cols-3 gap-px bg-brand-200/40 p-2 sm:p-3">
            {PROMO_CATALOG_COVER_IMAGES.map((src) => (
              <div key={src} className="aspect-[5/4] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-contain p-1.5" />
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-[3.5%] left-[8%] right-[32%] grid grid-cols-3 gap-3 text-[clamp(0.62rem,1.05cqw,0.78rem)] text-white">
          <div>
            <p className="font-semibold uppercase tracking-[0.08em] text-brand-100">
              {t('deliveryLabel')}
            </p>
            <p className="mt-1 leading-snug text-white/90">{t('delivery')}</p>
          </div>
          <div>
            <p className="font-semibold uppercase tracking-[0.08em] text-brand-100">
              {t('contactLabel')}
            </p>
            <p className="mt-1 leading-snug text-white/90">
              {contact('phoneValue')}
              <br />
              {contact('emailValue')}
            </p>
          </div>
          <div>
            <p className="font-semibold uppercase tracking-[0.08em] text-brand-100">
              {t('webLabel')}
            </p>
            <p className="mt-1 leading-snug text-white/90">print8.mk</p>
          </div>
        </div>
      </div>
    </PromoCatalogSheet>
  );
}

function catalogPageHref(pageNumber: number) {
  return pageNumber <= 1 ? '?' : `?page=${pageNumber}`;
}

function ContentsLine({
  label,
  pageNumber,
  endPage,
}: {
  label: string;
  pageNumber: number;
  endPage?: number;
}) {
  const pageLabel =
    endPage && endPage !== pageNumber ? `${pageNumber}–${endPage}` : String(pageNumber);
  return (
    <li>
      <a
        href={catalogPageHref(pageNumber)}
        data-catalog-goto={String(pageNumber)}
        className="promo-toc-link"
      >
        <span className="promo-toc-label">{label}</span>
        <span aria-hidden className="promo-toc-dots" />
        <span className="promo-toc-page">{pageLabel}</span>
      </a>
    </li>
  );
}

function ContentsSectionHeading({
  label,
  pageNumber,
}: {
  label: string;
  pageNumber: number;
}) {
  return (
    <a
      href={catalogPageHref(pageNumber)}
      data-catalog-goto={String(pageNumber)}
      className="promo-toc-section font-display"
    >
      {label}
    </a>
  );
}

function ContentsPage({
  pageNumber,
  catalogPages,
}: {
  pageNumber: number;
  catalogPages: PromoCatalogPage[];
}) {
  const t = useTranslations('promoCatalog');
  const mugPages = catalogPages.filter((page) => page.section === 'mugs');
  const merchPages = catalogPages.filter((page) => page.section === 'merch');
  const calendarPages = catalogPages.filter(
    (page) => page.section === 'calendars',
  );
  const merchRanges = merchTocRanges(catalogPages);
  const calendarRanges = calendarTocRanges(catalogPages);

  return (
    <PromoCatalogSheet pageNumber={pageNumber} category={t('contents')}>
      <div className="promo-toc relative flex h-full min-h-0 flex-col px-[7%] pb-[3%] pt-[4%]">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03]">
          <Logo className="h-[58%] w-auto" />
        </div>
        <h2 className="promo-toc-title relative w-full shrink-0 text-center font-display font-bold text-ink-900">
          {t('contents')}
        </h2>
        <div className="promo-toc-body">
          <ContentsSectionHeading
            label={t('sectionMugs')}
            pageNumber={mugPages[0]?.number ?? 3}
          />
          <ol className="promo-toc-list" style={{ flexGrow: 2 }}>
            {mugPages.map((page) => (
              <ContentsLine
                key={page.id}
                label={t(`contentsLines.${page.tocKey ?? page.id}`)}
                pageNumber={page.number}
              />
            ))}
          </ol>
          <ContentsSectionHeading
            label={t('sectionMerch')}
            pageNumber={merchPages[0]?.number ?? 5}
          />
          <ol className="promo-toc-list" style={{ flexGrow: 2 }}>
            {merchRanges.map((range) => (
              <ContentsLine
                key={range.key}
                label={t(`contentsLines.${range.key}`)}
                pageNumber={range.pageNumber}
                endPage={range.endPage}
              />
            ))}
          </ol>
          <ContentsSectionHeading
            label={t('sectionCalendars')}
            pageNumber={calendarPages[0]?.number ?? 12}
          />
          <ol
            className="promo-toc-list"
            style={{ flexGrow: Math.ceil(calendarRanges.length / 2) }}
          >
            {calendarRanges.map((range) => (
              <ContentsLine
                key={range.key}
                label={t(`contentsLines.${range.key}`)}
                pageNumber={range.pageNumber}
                endPage={range.endPage}
              />
            ))}
          </ol>
        </div>
        <p className="promo-toc-note">
          {t('contentsNote')}
        </p>
      </div>
    </PromoCatalogSheet>
  );
}

function sectionLabel(
  t: (key: 'sectionMugs' | 'sectionMerch' | 'sectionCalendars') => string,
  section?: 'mugs' | 'merch' | 'calendars',
) {
  if (section === 'mugs') return t('sectionMugs');
  if (section === 'merch') return t('sectionMerch');
  if (section === 'calendars') return t('sectionCalendars');
  return undefined;
}

function ProductsPage({
  pageNumber,
  productIds,
  section,
}: {
  pageNumber: number;
  productIds: string[];
  section?: 'mugs' | 'merch' | 'calendars';
}) {
  const t = useTranslations('promoCatalog');
  const calendars = productIds.some(isCalendarProductId);
  const count = productIds.length;
  const calendarPageLayout =
    count <= 1 ? 'one' : count === 2 ? 'two' : count === 3 ? 'three' : 'four';
  const calendarCardLayout = count === 1 ? 'one' : 'two';

  return (
    <PromoCatalogSheet pageNumber={pageNumber} category={sectionLabel(t, section)}>
      <div className="flex h-full min-h-0 flex-col px-[4.5%] pb-[1.2%] pt-[2%]">
        {calendars ? (
          <div className={`promo-cal-page promo-cal-page--${calendarPageLayout}`}>
            {productIds.map((id) => {
              const product = getPromoCatalogProduct(id);
              if (!product) return null;
              return (
                <PromoCalendarCard
                  key={id}
                  product={product}
                  name={t(`items.${id}.name`)}
                  specs={t.raw(`items.${id}.specs`) as string[]}
                  layout={calendarCardLayout}
                />
              );
            })}
          </div>
        ) : (
          <div
            className={`promo-products-grid promo-products-grid--${productIds.length}`}
          >
            {productIds.map((id) => {
              const product = getPromoCatalogProduct(id);
              if (!product) return null;
              return (
                <PromoProductCard
                  key={id}
                  product={product}
                  name={t(`items.${id}.name`)}
                  specs={t.raw(`items.${id}.specs`) as string[]}
                />
              );
            })}
          </div>
        )}
        <p className="promo-page-vat">
          {calendars ? t('vatCalendars') : t('vat')}
        </p>
      </div>
    </PromoCatalogSheet>
  );
}

function BackPage({ pageNumber }: { pageNumber: number }) {
  const t = useTranslations('promoCatalog');
  const contact = useTranslations('contact');

  return (
    <PromoCatalogSheet variant="back" pageNumber={pageNumber}>
      <div className="flex h-full flex-col items-center justify-center px-[10%] text-center">
        <div className="mb-8 h-px w-24 bg-brand-600" />
        <Logo className="h-12 w-auto" />
        <h2 className="mt-8 font-display text-[clamp(1.4rem,2.8cqw,2.1rem)] font-bold leading-tight text-ink-900">
          {t('backTitle')}
        </h2>
        <p className="mt-4 max-w-md text-[clamp(0.85rem,1.4cqw,1rem)] leading-relaxed text-ink-600">
          {t('backBody')}
        </p>
        <Link
          href="/contact"
          className="mt-8 inline-flex rounded-none bg-brand-600 px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white hover:bg-brand-700"
        >
          {t('backCta')}
        </Link>
        <div className="mt-10 space-y-1 text-[clamp(0.8rem,1.2cqw,0.95rem)] text-ink-700">
          <p>{contact('phoneValue')}</p>
          <p>{contact('emailValue')}</p>
          <p>print8.mk</p>
        </div>
        <div className="mt-10 h-px w-24 bg-brand-600" />
      </div>
    </PromoCatalogSheet>
  );
}

export function PromoCatalogPageView({
  pageId,
  pageNumber,
  productIds,
  section,
  catalogPages,
}: {
  pageId: PromoCatalogPageId;
  pageNumber: number;
  productIds?: string[];
  section?: 'mugs' | 'merch' | 'calendars';
  catalogPages: PromoCatalogPage[];
}) {
  if (pageId === 'cover') return <CoverPage pageNumber={pageNumber} />;
  if (pageId === 'contents') {
    return <ContentsPage pageNumber={pageNumber} catalogPages={catalogPages} />;
  }
  if (pageId === 'blank') {
    return (
      <PromoCatalogSheet pageNumber={pageNumber}>
        <div className="h-full" />
      </PromoCatalogSheet>
    );
  }
  if (pageId === 'back') return <BackPage pageNumber={pageNumber} />;
  return (
    <ProductsPage
      pageNumber={pageNumber}
      productIds={productIds ?? []}
      section={section}
    />
  );
}
