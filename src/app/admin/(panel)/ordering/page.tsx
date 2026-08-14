import { requireAdminSession } from '@/lib/admin/require-admin';
import { adminStrings } from '@/lib/admin/strings';
import {
  DisplayOrderAdminPanel,
  type DisplayOrderItem,
} from '@/components/admin/DisplayOrderAdminPanel';
import {
  products,
  getProductNameKey,
  type ProductDesignTemplate,
} from '@/lib/data/catalog';
import {
  getDesignDisplayOrderRecord,
  getProductDisplayOrderRecord,
} from '@/lib/cms/display-order';
import { getProductVisibilityRecord } from '@/lib/cms/product-visibility';
import { getMergedProductDesignTemplates } from '@/lib/products/merged-product-designs';
import { sortByDisplayOrder } from '@/lib/products/sort-by-display-order';
import {
  buildPrintDesignOrderItems,
  getPrintDesignCategoryLabelsMk,
} from '@/lib/admin/print-design-display-order';
import mkMessages from '../../../../../messages/mk.json';

const MERCH_COLLECTION_LABELS_MK: Record<string, string> = {
  car: 'Коли',
  basketball: 'Кошарка',
  anime: 'Anime',
  typography: 'Типографија',
  streetwear: 'Streetwear',
  streetwear3: 'Streetwear',
  'baby-milestones': 'Беби пресвртници',
  kids: 'Детски',
  'kids-birthday': 'Роденденски',
  'couple-packs': 'Парски пакети',
  family: 'Семејство',
  'trending-mk': 'МК Trending',
  'chemistry-drama': 'Breaking Bad',
  'stranger-80s': "Stranger 80's",
  'peaky-era': 'Пики ера',
  'zombie-survival': 'Zombie',
  'cartel-crime': 'Crime',
  'biker-rebel': 'Бајкери',
  'neon-retro': 'Неон ретро',
  'vintage-dapper': 'Vintage',
  'science-core': 'Наука',
  'wild-outdoors': 'Авантура',
  'daily-grind': 'Дневен ритам',
  'mk-slang': 'МК Сленг',
  'mk-retro-plates': 'МК Ретро',
  'mk-mugs': 'МК шолји',
  'mk-folk': 'МК Фолклор',
  caps: 'Капи',
  drinkware: 'Шолји / чаши',
};

function designImage(template: ProductDesignTemplate): string | undefined {
  if ('overlayImage' in template && template.overlayImage) {
    return template.overlayImage;
  }
  return undefined;
}

export default async function AdminOrderingPage() {
  await requireAdminSession();

  const productLabels = mkMessages.products;
  const typeLabels = productLabels.types as Record<string, string>;
  const itemLabels = productLabels.items as Record<string, string>;

  const [productOrder, designOrder, productDesigns, printDesigns, productVisibility] =
    await Promise.all([
      getProductDisplayOrderRecord(),
      getDesignDisplayOrderRecord(),
      getMergedProductDesignTemplates(),
      buildPrintDesignOrderItems(),
      getProductVisibilityRecord(),
    ]);

  const productItems: DisplayOrderItem[] = sortByDisplayOrder(
    products,
    productOrder,
  ).map((product) => {
    const nameKey = getProductNameKey(product);
    const title =
      itemLabels[nameKey] ?? typeLabels[product.type] ?? product.id;
    return {
      id: product.id,
      title,
      image: product.image,
      meta: `${product.id} · ${typeLabels[product.type] ?? product.type}`,
      active: productVisibility[product.id] !== false,
    };
  });

  const merchDesignItems: DisplayOrderItem[] = sortByDisplayOrder(
    productDesigns.map((template) => ({
      id: template.id,
      title: template.titleMk || template.titleEn || template.nameKey || template.id,
      image: designImage(template),
      meta: template.collection
        ? `${template.id} · ${MERCH_COLLECTION_LABELS_MK[template.collection] ?? template.collection}`
        : template.id,
      collection: template.collection ?? null,
    })),
    designOrder,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">
          {adminStrings.ordering.title}
        </h1>
        <p className="mt-1 text-sm text-ink-500">{adminStrings.ordering.subtitle}</p>
      </div>

      <DisplayOrderAdminPanel
        products={productItems}
        merchDesigns={merchDesignItems}
        printDesigns={printDesigns}
        merchCollectionLabels={MERCH_COLLECTION_LABELS_MK}
        printCategoryLabels={getPrintDesignCategoryLabelsMk()}
      />
    </div>
  );
}
