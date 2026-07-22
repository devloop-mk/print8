import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/navigation';
import {
  LEGAL_PAGE_PATHS,
  type LegalPageKey,
} from '@/lib/legal/pages';
import {
  isCustomizableDesign,
  products,
  type ProductType,
  type ProductDesignCategory,
  type ProductDesignTemplate,
} from '@/lib/data/catalog';
import { resolveStaticProductDesignTemplate } from '@/lib/products/resolve-product-design-template';
import {
  getDesignDisplayName,
  resolveDesignTemplate,
} from '@/lib/catalog/design-catalog';
import type { ProductNavCategoryId } from '@/lib/products/product-nav';
import {
  buildDesignOgImageUrl,
  resolveCouplePackOgPanels,
  resolveDesignOgPanels,
} from '@/lib/seo/design-og';
import { buildOgImageUrl, buildPageMetadata } from '@/lib/seo/metadata';
import { resolveAssetUrl } from '@/lib/storage/asset-url';
import { getDesignGalleryImage } from '@/lib/designs/design-thumb';
import { getCouplePackTemplate, getCouplePackPartnerDesign } from '@/lib/data/couple-pack';
import { resolveProductDesignDisplayName } from '@/lib/products/design-display-name';

function isSvgAssetPath(value: string) {
  return /\.svg(\?.*)?$/i.test(value);
}

/** Blank PDP og:image — product mockup photo (absolute), never fragile satori `/api/og`. */
function buildBlankProductOgImage(productImage: string | undefined) {
  if (!productImage || isSvgAssetPath(productImage)) return undefined;
  // Prefer the design OG compositor card (same share look as design PDPs)
  // with the blank mockup as a single image panel.
  return buildDesignOgImageUrl([{ kind: 'image', src: productImage }]);
}

export async function buildProductMetadata(locale: Locale, id: string) {
  const product = products.find((item) => item.id === id);
  if (!product) return null;

  const tp = await getTranslations({ locale, namespace: 'products.types' });
  const ti = await getTranslations({ locale, namespace: 'products.items' });
  const td = await getTranslations({ locale, namespace: 'products.detail' });
  const tm = await getTranslations({ locale, namespace: 'metadata' });

  const productName = product.nameKey ? ti(product.nameKey) : tp(product.type);
  const title = `${productName} | Print 8`;
  const description = td('description');
  const image =
    buildBlankProductOgImage(product.image) ??
    buildOgImageUrl({
      locale,
      title: productName,
      description,
      badge: tm('badges.product'),
    });

  return buildPageMetadata({
    locale,
    title,
    description,
    path: `/products/${id}`,
    image,
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
  const ti = await getTranslations({ locale, namespace: 'products.items' });
  const td = await getTranslations({ locale, namespace: 'products.detail' });
  const tm = await getTranslations({ locale, namespace: 'metadata' });

  const productName = product.nameKey ? ti(product.nameKey) : tp(product.type);
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

export async function buildProductPremadeDesignsMetadata(
  locale: Locale,
  id: string,
) {
  const product = products.find((item) => item.id === id);
  if (!product) return null;

  const tp = await getTranslations({ locale, namespace: 'products.types' });
  const ti = await getTranslations({ locale, namespace: 'products.items' });
  const td = await getTranslations({ locale, namespace: 'products.detail' });
  const tm = await getTranslations({ locale, namespace: 'metadata' });

  const productName = product.nameKey ? ti(product.nameKey) : tp(product.type);
  const sectionTitle = td('premadeDesigns');
  const description = td('premadeDesignsPageHint');
  const title = `${sectionTitle} — ${productName} | Print 8`;

  return buildPageMetadata({
    locale,
    title,
    description,
    path: `/products/${id}/designs`,
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
  const template = await resolveDesignTemplate(id);
  if (!template) return null;

  const td = await getTranslations({ locale, namespace: 'designs' });
  const tm = await getTranslations({ locale, namespace: 'metadata' });

  const designName =
    getDesignDisplayName(template, locale) !== template.id
      ? getDesignDisplayName(template, locale)
      : td(`templates.${template.id}`);
  const categoryName = td(`categories.${template.category}`);
  const title = `${designName} | Print 8`;
  const description = td('subtitle');
  // Live SVGs aren't safe for server-side rasterization (satori/resvg) — use
  // the pre-rendered raster gallery thumb when available, same as the catalog UI.
  const previewSource = getDesignGalleryImage(template);

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
      image: previewSource ? resolveAssetUrl(previewSource) : undefined,
    }),
  });
}

export async function buildDesignCustomizeMetadata(locale: Locale, id: string) {
  const template = await resolveDesignTemplate(id);
  if (!template || !isCustomizableDesign(template)) return null;

  const td = await getTranslations({ locale, namespace: 'designs' });
  const tc = await getTranslations({ locale, namespace: 'designs.customize' });
  const tm = await getTranslations({ locale, namespace: 'metadata' });

  const designName =
    getDesignDisplayName(template, locale) !== template.id
      ? getDesignDisplayName(template, locale)
      : td(`templates.${template.id}`);
  const title = `${designName} | Print 8`;
  const description = tc('pageSubtitle');
  // Live SVGs aren't safe for server-side rasterization (satori/resvg) — use
  // the pre-rendered raster gallery thumb when available, same as the catalog UI.
  const previewSource = getDesignGalleryImage(template);

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
      image: previewSource ? resolveAssetUrl(previewSource) : undefined,
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

export async function buildProductCategoryMetadata(
  locale: Locale,
  category: ProductNavCategoryId,
) {
  const tNav = await getTranslations({
    locale,
    namespace: 'nav.productsMenu.categories',
  });
  const tc = await getTranslations({ locale, namespace: 'products.categoryPages' });
  const tm = await getTranslations({ locale, namespace: 'metadata' });
  const title = `${tNav(category)} | Print 8`;
  const description = tc(`${category}.subtitle`);

  return buildPageMetadata({
    locale,
    title,
    description,
    path: `/products/category/${category}`,
    image: buildOgImageUrl({
      locale,
      title: tNav(category),
      description,
      badge: tm('badges.products'),
    }),
  });
}

export async function buildProductTypePageMetadata(
  locale: Locale,
  type: ProductType,
) {
  const tp = await getTranslations({ locale, namespace: 'products.typesPlural' });
  const tt = await getTranslations({ locale, namespace: 'products.typePages' });
  const tm = await getTranslations({ locale, namespace: 'metadata' });
  const productName = tp(type);
  const title = `${productName} | Print 8`;
  const description = tt(`${type}.subtitle`);
  const product = products.find((item) => item.type === type);

  return buildPageMetadata({
    locale,
    title,
    description,
    path: `/products/type/${type}`,
    image: buildOgImageUrl({
      locale,
      title: productName,
      description,
      badge: tm('badges.products'),
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

export async function buildDesignProductMetadata(
  locale: Locale,
  designId: string,
  designOverride?: ProductDesignTemplate | null,
  preferredType?: ProductType,
) {
  const coupleMatch = getCouplePackPartnerDesign(designId);
  const design =
    designOverride ??
    coupleMatch?.design ??
    resolveStaticProductDesignTemplate(designId);
  if (!design) return null;

  const t = await getTranslations({ locale, namespace: 'products' });
  const tdp = await getTranslations({ locale, namespace: 'products.designPdp' });
  const tm = await getTranslations({ locale, namespace: 'metadata' });

  const designName = resolveProductDesignDisplayName(design, locale, (key) =>
    t(key),
  );
  const title = `${designName} | Print 8`;
  const description = tdp('metaDescription', { name: designName });

  // Prefer garment/product + design composition (same idea as the PDP mockup),
  // never bare overlay artwork alone. Respects `?type=` when valid for the design.
  const panels = coupleMatch
    ? resolveCouplePackOgPanels(coupleMatch.pack, preferredType)
    : resolveDesignOgPanels(design, preferredType);

  const image =
    panels.length > 0
      ? buildDesignOgImageUrl(panels)
      : undefined;

  const fallbackProductImage = products.find(
    (item) => item.image && !isSvgAssetPath(item.image),
  )?.image;

  return buildPageMetadata({
    locale,
    title,
    description,
    path: `/products/design/${designId}`,
    image:
      image ??
      (fallbackProductImage
        ? buildDesignOgImageUrl([{ kind: 'image', src: fallbackProductImage }])
        : buildOgImageUrl({
            locale,
            title: designName,
            description,
            badge: tm('badges.product'),
          })),
  });
}

export async function buildCouplePackMetadata(
  locale: Locale,
  packId: string,
  preferredType?: ProductType,
) {
  const pack = getCouplePackTemplate(packId);
  if (!pack) return null;

  const tc = await getTranslations({ locale, namespace: 'products.couplePacks' });
  const tm = await getTranslations({ locale, namespace: 'metadata' });

  const packName = locale === 'mk' ? pack.titleMk : pack.titleEn;
  const title = `${packName} | Print 8`;
  const description = tc('metaDescription', {
    name: packName,
  });

  const panels = resolveCouplePackOgPanels(pack, preferredType);
  const image =
    panels.length > 0
      ? buildDesignOgImageUrl(panels)
      : buildBlankProductOgImage(
          products.find((item) => item.type === pack.productTypes[0])?.image,
        );

  return buildPageMetadata({
    locale,
    title,
    description,
    path: `/products/design/couple/${packId}`,
    image:
      image ??
      buildOgImageUrl({
        locale,
        title: packName,
        description,
        badge: tm('badges.product'),
      }),
  });
}
