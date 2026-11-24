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
  mugTocRanges,
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
      <div className="promo-cover">
        <div className="promo-cover-deco" aria-hidden>
          <div className="promo-cover-deco-blue" />
          <div className="promo-cover-deco-white" />
          <div className="promo-cover-deco-gray" />
          <div className="promo-cover-deco-vline" />
          <div className="promo-cover-deco-hline" />
        </div>

        <div className="promo-cover-brand">
          <Logo className="promo-cover-logo" />
          <p className="promo-cover-tagline">{t('tagline')}</p>
        </div>

        <div className="promo-cover-title">
          <p className="promo-cover-kicker font-display">{t('kicker')}</p>
          <h1 className="promo-cover-headline font-display">{t('headline')}</h1>
        </div>

        <div className="promo-cover-mosaic">
          <div className="promo-cover-mosaic-grid">
            {PROMO_CATALOG_COVER_IMAGES.map((src) => (
              <div key={src} className="promo-cover-cell">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" />
              </div>
            ))}
          </div>
        </div>

        <div className="promo-cover-foot">
          <div>
            <p className="promo-cover-foot-label">{t('deliveryLabel')}</p>
            <p className="promo-cover-foot-value">{t('delivery')}</p>
          </div>
          <div>
            <p className="promo-cover-foot-label">{t('contactLabel')}</p>
            <p className="promo-cover-foot-value">
              {contact('phoneValue')}
              <br />
              {contact('emailValue')}
            </p>
          </div>
          <div>
            <p className="promo-cover-foot-label">{t('webLabel')}</p>
            <p className="promo-cover-foot-value">print8.mk</p>
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
  const infoPage = catalogPages.find((page) => page.id === 'info');
  const mugPages = catalogPages.filter((page) => page.section === 'mugs');
  const merchPages = catalogPages.filter((page) => page.section === 'merch');
  const calendarPages = catalogPages.filter(
    (page) => page.section === 'calendars',
  );
  const mugRanges = mugTocRanges(catalogPages);
  const merchRanges = merchTocRanges(catalogPages);
  const calendarRanges = calendarTocRanges(catalogPages);

  return (
    <PromoCatalogSheet pageNumber={pageNumber} category={t('contents')}>
      <div className="promo-toc relative flex h-full min-h-0 flex-col px-[8%] pb-[4%] pt-[5%]">
        <div className="promo-toc-watermark" aria-hidden>
          <Logo variant="mark" className="promo-toc-mark" />
        </div>
        <h2 className="promo-toc-title relative w-full shrink-0 text-center font-display font-bold text-ink-900">
          {t('contents')}
        </h2>
        <div className="promo-toc-body">
          <ol className="promo-toc-list promo-toc-info">
            <ContentsLine
              label={t('contentsLines.info')}
              pageNumber={infoPage?.number ?? 3}
            />
          </ol>
          <section className="promo-toc-group">
            <ContentsSectionHeading
              label={t('sectionMugs')}
              pageNumber={mugPages[0]?.number ?? 4}
            />
            <ol className="promo-toc-list">
              {mugRanges.map((range) => (
                <ContentsLine
                  key={range.key}
                  label={t(`contentsLines.${range.key}`)}
                  pageNumber={range.pageNumber}
                  endPage={range.endPage}
                />
              ))}
            </ol>
          </section>
          <section className="promo-toc-group">
            <ContentsSectionHeading
              label={t('sectionMerch')}
              pageNumber={merchPages[0]?.number ?? 5}
            />
            <ol className="promo-toc-list">
              {merchRanges.map((range) => (
                <ContentsLine
                  key={range.key}
                  label={t(`contentsLines.${range.key}`)}
                  pageNumber={range.pageNumber}
                  endPage={range.endPage}
                />
              ))}
            </ol>
          </section>
          <section className="promo-toc-group">
            <ContentsSectionHeading
              label={t('sectionCalendars')}
              pageNumber={calendarPages[0]?.number ?? 12}
            />
            <ol className="promo-toc-list">
              {calendarRanges.map((range) => (
                <ContentsLine
                  key={range.key}
                  label={t(`contentsLines.${range.key}`)}
                  pageNumber={range.pageNumber}
                  endPage={range.endPage}
                />
              ))}
            </ol>
          </section>
        </div>
        <p className="promo-toc-note">{t('contentsNote')}</p>
      </div>
    </PromoCatalogSheet>
  );
}

const INFO_BLOCKS = [
  { title: 'qtyTitle', body: 'qty', extra: 'qtyExample' },
  { title: 'customTitle', body: 'custom' },
  { title: 'embroideryTitle', body: 'embroidery' },
  { title: 'sizesTitle', body: 'sizes' },
  { title: 'combineTitle', body: 'combine' },
] as const;

function InfoPage({ pageNumber }: { pageNumber: number }) {
  const t = useTranslations('promoCatalog');
  const contact = useTranslations('contact');

  return (
    <PromoCatalogSheet pageNumber={pageNumber} category={t('sectionInfo')}>
      <div className="promo-info relative flex h-full min-h-0 flex-col px-[7%] pb-[3%] pt-[4%]">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03]">
          <Logo className="h-[58%] w-auto" />
        </div>
        <h2 className="promo-info-title relative w-full shrink-0 text-center font-display font-bold text-ink-900">
          {t('infoTitle')}
        </h2>
        <ul className="promo-info-list">
          {INFO_BLOCKS.map((block) => (
            <li key={block.title} className="promo-info-item">
              <h3 className="promo-info-heading font-display">
                {t(`info.${block.title}`)}
              </h3>
              <p>{t(`info.${block.body}`)}</p>
              {'extra' in block ? (
                <p className="promo-info-example">{t(`info.${block.extra}`)}</p>
              ) : null}
            </li>
          ))}
        </ul>
        <div className="promo-info-contact">
          <p className="promo-info-heading font-display">{t('contactLabel')}</p>
          <p className="promo-info-contact-value">{contact('phoneValue')}</p>
          <p className="promo-info-contact-value">{contact('emailValue')}</p>
        </div>
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
  const hasApparelXlNote = productIds.some(
    (id) => id === 'tshirt' || id.startsWith('bluzon'),
  );
  const hasEmbroideryNote = productIds.some(
    (id) =>
      id === 'tshirt' || id.startsWith('bluzon') || id.startsWith('polar'),
  );
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
          {hasApparelXlNote ? ` ${t('hoodieXlNote')}` : ''}
          {hasEmbroideryNote ? ` ${t('embroideryQuoteNote')}` : ''}
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
  if (pageId === 'info') return <InfoPage pageNumber={pageNumber} />;
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
