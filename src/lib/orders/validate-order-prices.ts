import { resolveDesignTemplate } from '@/lib/catalog/design-catalog';
import { getProductById } from '@/lib/cart/product-cart';
import { getService } from '@/lib/data/catalog';
import { designCategoryPrices } from '@/lib/data/design-order-fields';
import { cmsDb } from '@/lib/db/cms';
import {
  calculateMenuPrintPrice,
  hasMenuPrintOptions,
  parseMenuPrintOptions,
} from '@/lib/designs/menu-print-options';
import {
  calculateBrandingPackTotal,
  parseBrandingPackState,
} from '@/lib/products/branding-pack-state';
import type { CheckoutInput } from '@/lib/validations/order';
import {
  getCustomDesignUnitPrice,
  type CustomDesignCategoryId,
} from '@/lib/data/custom-design-order';
import {
  getTshirtPriceFromMetadata,
  isTshirtProduct,
} from '@/lib/products/tshirt-print-pricing';
import { getPremadeDesignUnitPrice } from '@/lib/products/premade-design-order';
import { getStaticProductDesignTemplates } from '@/lib/products/merged-product-designs';

const STUDIO_DESIGN_UNIT_PRICE = 500;
const PRICE_EPSILON = 0.01;

function unitPricesMatch(client: number, expected: number): boolean {
  return Math.abs(client - expected) <= PRICE_EPSILON;
}

function getServiceUnitPrice(
  serviceId: string,
  cmsServices: Awaited<ReturnType<typeof cmsDb.services.list>>,
): number | null {
  const cmsService = cmsServices.find((service) => service.id === serviceId);
  if (cmsService?.active) {
    return cmsService.startingPrice;
  }

  const service = getService(serviceId);
  return service?.startingPrice ?? null;
}

async function getDesignUnitPrice(
  metadata: Record<string, string | number | boolean> | undefined,
): Promise<number | null> {
  if (!metadata) {
    return STUDIO_DESIGN_UNIT_PRICE;
  }

  if (metadata.orderType === 'custom-design-request') {
    const categoryId = metadata.customDesignCategory;
    if (typeof categoryId === 'string') {
      return getCustomDesignUnitPrice(categoryId as CustomDesignCategoryId);
    }
    return STUDIO_DESIGN_UNIT_PRICE;
  }

  const designTemplateId =
    typeof metadata.designTemplateId === 'string'
      ? metadata.designTemplateId
      : undefined;
  const templateId =
    typeof metadata.templateId === 'string' ? metadata.templateId : undefined;
  const id = designTemplateId ?? templateId;

  if (!id || id === 'custom') {
    return STUDIO_DESIGN_UNIT_PRICE;
  }

  const template = await resolveDesignTemplate(id);
  if (!template) return null;

  const designFee =
    typeof template.customPrice === 'number' && template.customPrice > 0
      ? template.customPrice
      : (designCategoryPrices[template.category] ?? null);

  if (designFee === null) return null;

  // A configured menu is a single cart line priced as print run + cover design,
  // so recompute it from the submitted options instead of trusting the total.
  if (template.category === 'menus' && hasMenuPrintOptions(metadata)) {
    return calculateMenuPrintPrice(parseMenuPrintOptions(metadata), designFee)
      .total;
  }

  return designFee;
}

function getProductUnitPrice(
  metadata: Record<string, string | number | boolean> | undefined,
): number | null {
  if (!metadata) return null;

  if (metadata.isBrandingPack === true) {
    const raw = metadata.brandingPackData;
    if (typeof raw !== 'string') return null;
    const state = parseBrandingPackState(raw);
    if (!state) return null;
    return calculateBrandingPackTotal(state);
  }

  const productId =
    typeof metadata.productId === 'string' ? metadata.productId : undefined;
  if (!productId) return null;

  const product = getProductById(productId);
  if (!product) return null;

  if (isTshirtProduct(product)) {
    const packaged = getTshirtPriceFromMetadata(metadata);
    if (packaged !== null) return packaged;

    // Premade ready-designs / couple packs historically omitted printPackage.
    // Re-derive from the design template when possible.
    if (typeof metadata.designTemplateId === 'string') {
      const design = getStaticProductDesignTemplates().find(
        (template) => template.id === metadata.designTemplateId,
      );
      if (design) return getPremadeDesignUnitPrice(product, design);
      return product.basePrice;
    }

    return null;
  }

  return product.basePrice;
}

export async function validateOrderPrices(
  data: CheckoutInput,
): Promise<
  | { ok: true; totalAmount: number }
  | { ok: false; code: 'invalid_price'; itemIndex: number }
> {
  let totalAmount = 0;
  const hasServiceItems = data.items.some((item) => item.type === 'service');
  const cmsServices = hasServiceItems ? await cmsDb.services.list() : [];

  for (let index = 0; index < data.items.length; index += 1) {
    const item = data.items[index];
    let expectedUnitPrice: number | null = null;

    switch (item.type) {
      case 'service': {
        const serviceId =
          typeof item.metadata?.serviceId === 'string'
            ? item.metadata.serviceId
            : undefined;
        if (!serviceId) {
          return { ok: false, code: 'invalid_price', itemIndex: index };
        }
        expectedUnitPrice = getServiceUnitPrice(serviceId, cmsServices);
        break;
      }
      case 'design':
        expectedUnitPrice = await getDesignUnitPrice(item.metadata);
        break;
      case 'product':
        expectedUnitPrice = getProductUnitPrice(item.metadata);
        break;
      default:
        return { ok: false, code: 'invalid_price', itemIndex: index };
    }

    if (
      expectedUnitPrice === null ||
      expectedUnitPrice < 0 ||
      !unitPricesMatch(item.price, expectedUnitPrice)
    ) {
      return { ok: false, code: 'invalid_price', itemIndex: index };
    }

    totalAmount += expectedUnitPrice * item.quantity;
  }

  return { ok: true, totalAmount };
}
