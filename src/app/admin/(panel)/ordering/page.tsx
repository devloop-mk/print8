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
  basketball: 'Кошарка',
  anime: 'Јапонско аниме',
  typography: 'Стритвер типографија',
  streetwear: 'Стритвер',
  'baby-milestones': 'Беби пресвртници',
  'kids-birthday': 'Детски родендени',
  'couple-packs': 'Парски пакети',
  family: 'Семејни',
  'trending-mk': 'Тренд МК',
  'chemistry-drama': 'Кемија драма',
  'stranger-80s': 'Странџер 80-ти',
  'peaky-era': 'Пики ера',
  'zombie-survival': 'Зомби преживување',
  'cartel-crime': 'Картел криминал',
  'biker-rebel': 'Бајкер бунтовник',
  'neon-retro': 'Неон ретро',
  'vintage-dapper': 'Винтиџ стил',
  'science-core': 'Наука',
  'wild-outdoors': 'Авантура надвор',
  'daily-grind': 'Дневен ритам',
  'mk-slang': 'МК сленг',
  'mk-retro-plates': 'МК ретро таблици',
  'mk-mugs': 'МК шолји',
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
