import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';
import {
  LEGAL_PAGE_PATHS,
  type LegalPageKey,
} from '@/lib/legal/pages';
import {
  products,
  getDesignTemplate,
  type ProductType,
  type ProductDesignCategory,
} from '@/lib/data/catalog';
import { buildOgImageUrl, buildPageMetadata } from '@/lib/seo/metadata';

export async function buildProductMetadata(locale: Locale, id: string) {
  const product = products.find((item) => item.id === id);
  if (!product) return null;

  const t = await getTranslations({ locale, namespace: 'products' });
  const tp = await getTranslations({ locale, namespace: 'products.types' });
  const td = await getTranslations({ locale, namespace: 'products.detail' });
  const tm = await getTranslations({ locale, namespace: 'metadata' });

  const productName = tp(product.type);
  const title = `${productName} | Print 8`;
  const description = td('description');

  return buildPageMetadata({
    locale,
    title,
    description,
    path: `/products/${id}`,
    image: buildOgImageUrl({
      locale,
      title: productName,
      description,
      badge: tm('badges.product'),
      image: product.image,
    }),
  });
}

export async function buildProductDesignsMetadata(
  locale: Locale,
  id: string,
  category: ProductDesignCategory,
) {
  const product = products.find((item) => item.id === id);
  if (!product) return null;

  const t = await getTranslations({ locale, namespace: 'products' });
  const tp = await getTranslations({ locale, namespace: 'products.types' });
  const td = await getTranslations({ locale, namespace: 'products.detail' });
  const tm = await getTranslations({ locale, namespace: 'metadata' });

  const productName = tp(product.type);
  const isPhoto = category === 'image-designs';
  const sectionTitle = isPhoto ? td('imageDesigns') : td('textDesigns');
  const description = isPhoto
    ? td('imageDesignsPageHint')
    : td('textDesignsPageHint');
  const title = `${sectionTitle} — ${productName} | Print 8`;
  const path = isPhoto
    ? `/products/${id}/photo-designs`
    : `/products/${id}/text-designs`;

  return buildPageMetadata({
    locale,
    title,
    description,
    path,
    image: buildOgImageUrl({
      locale,
      title: sectionTitle,
      description: productName,
      badge: tm('badges.product'),
      image: product.image,
    }),
  });
}

export async function buildDesignMetadata(locale: Locale, id: string) {
  const template = getDesignTemplate(id);
  if (!template) return null;

  const td = await getTranslations({ locale, namespace: 'designs' });
  const tm = await getTranslations({ locale, namespace: 'metadata' });

  const designName = td(`templates.${template.id}`);
  const categoryName = td(`categories.${template.category}`);
  const title = `${designName} | Print 8`;
  const description = td('subtitle');

  return buildPageMetadata({
    locale,
    title,
    description,
    path: `/designs/${id}`,
    image: buildOgImageUrl({
      locale,
      title: designName,
      description: categoryName,
      badge: tm('badges.design'),
      image: template.image,
    }),
  });
}

export async function buildDesignCustomizeMetadata(locale: Locale, id: string) {
  const template = getDesignTemplate(id);
  if (!template) return null;

  const td = await getTranslations({ locale, namespace: 'designs' });
  const tc = await getTranslations({ locale, namespace: 'designs.customize' });
  const tm = await getTranslations({ locale, namespace: 'metadata' });

  const designName = td(`templates.${template.id}`);
  const title = `${designName} | Print 8`;
  const description = tc('pageSubtitle');

  return buildPageMetadata({
    locale,
    title,
    description,
    path: `/designs/${id}/customize`,
    image: buildOgImageUrl({
      locale,
      title: designName,
      description: tc('badge'),
      badge: tm('badges.customize'),
      image: template.image,
    }),
  });
}

export async function buildSectionMetadata(
  locale: Locale,
  path: string,
  namespace: string,
  badge: string,
) {
  const t = await getTranslations({ locale, namespace });

  const title = `${t('title')} | Print 8`;
  const description = t.has('subtitle') ? t('subtitle') : t('title');

  return buildPageMetadata({
    locale,
    title,
    description,
    path,
    image: buildOgImageUrl({
      locale,
      title: t('title'),
      description,
      badge,
    }),
  });
}

export async function buildProductCustomizeMetadata(
  locale: Locale,
  type: ProductType,
) {
  const tp = await getTranslations({ locale, namespace: 'products.types' });
  const tc = await getTranslations({ locale, namespace: 'products.customizer' });
  const tm = await getTranslations({ locale, namespace: 'metadata' });

  const productName = tp(type);
  const title = `${productName} | Print 8`;
  const description = tc('title');
  const product = products.find((item) => item.type === type);

  return buildPageMetadata({
    locale,
    title,
    description,
    path: `/products/customize/${type}`,
    image: buildOgImageUrl({
      locale,
      title: productName,
      description: tc('title'),
      badge: tm('badges.customize'),
      image: product?.image,
    }),
  });
}

export async function buildLegalMetadata(locale: Locale, documentKey: LegalPageKey) {
  const t = await getTranslations({ locale, namespace: 'legal' });
  const tm = await getTranslations({ locale, namespace: 'metadata' });
  const path = LEGAL_PAGE_PATHS[documentKey];
  const title = `${t(`${documentKey}.title`)} | Print 8`;
  const description = t(`${documentKey}.metaDescription`);

  return buildPageMetadata({
    locale,
    title,
    description,
    path,
    image: buildOgImageUrl({
      locale,
      title: t(`${documentKey}.title`),
      description,
      badge: tm('badges.legal'),
    }),
  });
}

export async function buildNoIndexMetadata(
  locale: Locale,
  path: string,
  namespace: string,
) {
  const t = await getTranslations({ locale, namespace });
  const title = `${t('title')} | Print 8`;
  const description = t.has('subtitle') ? t('subtitle') : t('title');

  return buildPageMetadata({
    locale,
    title,
    description,
    path,
    noIndex: true,
  });
}
