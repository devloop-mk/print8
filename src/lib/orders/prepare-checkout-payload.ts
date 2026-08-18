import type { CartItem } from '@/lib/cart/types';
import {
  checkoutSchema,
  getOrderMetadataStringMaxLength,
  orderItemSchema,
  ORDER_METADATA_FIELD_MAX,
  ORDER_PREVIEW_STRING_MAX,
  type CheckoutInput,
} from '@/lib/validations/order';
import { isAdvancedMetadataKey } from '@/lib/admin/order-metadata';
import { isDataUrl } from '@/lib/storage/cart-storage';
import {
  PRODUCT_SIDES,
  SIDE_PREVIEW_CART_KEYS,
  getSideMetadataPrefix,
  type SidePreviewCartKey,
} from '@/lib/products/product-sides';

export class CheckoutPrepareError extends Error {
  constructor(
    public readonly code: string,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'CheckoutPrepareError';
  }
}

const MAX_PREVIEW_BYTES = 550_000;
const PREVIEW_COMPRESSION_STEPS = [
  { maxWidth: 960, quality: 0.82 },
  { maxWidth: 720, quality: 0.75 },
  { maxWidth: 540, quality: 0.68 },
  { maxWidth: 420, quality: 0.6 },
] as const;

const CHECKOUT_STRIP_METADATA_KEYS = new Set(['svgState']);

const SIDE_REDUNDANT_WHEN_PREVIEW_SUFFIXES = [
  'PremadeDesignImage',
  'UploadedPreviewUrl',
  'OverlayRaster',
  'OverlaySvg',
  'OverlaySvgPrimary',
  'OverlaySvgSecondary',
] as const;

type CheckoutItem = CheckoutInput['items'][number];

type SidePreviewFields = Pick<
  CartItem,
  | 'designPreview'
  | 'backDesignPreview'
  | 'leftDesignPreview'
  | 'rightDesignPreview'
>;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('load-failed'));
    image.src = src;
  });
}

async function rasterizePreview(
  image: HTMLImageElement,
  maxWidth: number,
  quality: number,
): Promise<string | null> {
  const scale = Math.min(1, maxWidth / image.width);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return null;

  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

async function compressPreviewUrl(src: string): Promise<string | undefined> {
  if (!src) return undefined;
  if (!isDataUrl(src)) return src;

  if (typeof document === 'undefined') {
    return src.length <= ORDER_PREVIEW_STRING_MAX ? src : undefined;
  }

  try {
    const image = await loadImage(src);
    let smallest: string | undefined;

    for (const step of PREVIEW_COMPRESSION_STEPS) {
      const compressed = await rasterizePreview(
        image,
        step.maxWidth,
        step.quality,
      );
      if (!compressed) continue;

      smallest = compressed;
      if (compressed.length <= MAX_PREVIEW_BYTES) {
        return compressed.length <= ORDER_PREVIEW_STRING_MAX
          ? compressed
          : undefined;
      }
    }

    if (!smallest) return undefined;
    return smallest.length <= ORDER_PREVIEW_STRING_MAX ? smallest : undefined;
  } catch {
    return src.length <= ORDER_PREVIEW_STRING_MAX ? src : undefined;
  }
}

function hasSidePreview(
  item: SidePreviewFields,
  side: (typeof PRODUCT_SIDES)[number],
): boolean {
  const key = SIDE_PREVIEW_CART_KEYS[side];
  const value = item[key];
  return typeof value === 'string' && value.length > 0;
}

function shouldStripSideRedundantKey(
  key: string,
  item: SidePreviewFields,
  metadata: Record<string, string | number | boolean>,
): boolean {
  for (const side of PRODUCT_SIDES) {
    const prefix = getSideMetadataPrefix(side);
    if (!key.startsWith(prefix)) continue;
    if (!hasSidePreview(item, side)) continue;

    if (key.endsWith('PremadeDesignImage')) {
      const value = metadata[key];
      if (typeof value === 'string' && !isDataUrl(value)) {
        continue;
      }
    }

    if (
      SIDE_REDUNDANT_WHEN_PREVIEW_SUFFIXES.some((suffix) =>
        key.endsWith(suffix),
      )
    ) {
      return true;
    }
  }

  return false;
}

function stripCheckoutMetadata(
  metadata: Record<string, string | number | boolean>,
  item: SidePreviewFields,
): Record<string, string | number | boolean> {
  const next: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (CHECKOUT_STRIP_METADATA_KEYS.has(key)) continue;
    if (key.startsWith('logo_') && isDataUrl(value)) continue;
    if (shouldStripSideRedundantKey(key, item, metadata)) continue;

    if (
      (key.endsWith('OverlayRaster') ||
        key.endsWith('PremadeDesignImage') ||
        key.endsWith('UploadedPreviewUrl')) &&
      isDataUrl(value)
    ) {
      continue;
    }

    if (typeof value === 'string' && value.length > 2048 && isDataUrl(value)) {
      continue;
    }

    next[key] = value;
  }

  return next;
}

function trimMetadataFieldCount(
  metadata: Record<string, string | number | boolean>,
): Record<string, string | number | boolean> {
  const entries = Object.entries(metadata);
  if (entries.length <= ORDER_METADATA_FIELD_MAX) return metadata;

  const essential = entries.filter(([key]) => !isAdvancedMetadataKey(key));
  const advanced = entries.filter(([key]) => isAdvancedMetadataKey(key));

  const kept = [...essential, ...advanced].slice(0, ORDER_METADATA_FIELD_MAX);
  return Object.fromEntries(kept);
}

function dropOversizedMetadataValues(
  metadata: Record<string, string | number | boolean>,
): Record<string, string | number | boolean> {
  const next: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === 'string') {
      const maxLength = getOrderMetadataStringMaxLength(key);
      if (value.length > maxLength) continue;
    }
    next[key] = value;
  }

  return next;
}

function fitCheckoutItem(item: CheckoutItem): CheckoutItem {
  let fitted: CheckoutItem = { ...item };

  if (fitted.metadata) {
    fitted = {
      ...fitted,
      metadata: trimMetadataFieldCount(
        dropOversizedMetadataValues(fitted.metadata),
      ),
    };
  }

  const parsed = orderItemSchema.safeParse(fitted);
  return parsed.success ? parsed.data : fitted;
}

async function prepareCheckoutItem(
  item: CartItem,
): Promise<CheckoutItem> {
  const previewKeys: SidePreviewCartKey[] = [
    'designPreview',
    'backDesignPreview',
    'leftDesignPreview',
    'rightDesignPreview',
  ];

  const previews = {} as SidePreviewFields;
  const previewResults = await Promise.all(
    previewKeys.map(async (key) => {
      const value = item[key];
      if (typeof value !== 'string' || value.length === 0) return null;
      const compressed = await compressPreviewUrl(value);
      return compressed ? { key, compressed } : null;
    }),
  );
  for (const result of previewResults) {
    if (result) previews[result.key] = result.compressed;
  }

  let metadata = item.metadata
    ? stripCheckoutMetadata(item.metadata, previews)
    : undefined;

  const prepared: CheckoutItem = {
    type: item.type,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    ...previews,
    fileIds: item.fileIds,
    metadata,
  };

  return fitCheckoutItem(prepared);
}

export type CheckoutOrderPayload = Pick<
  CheckoutInput,
  | 'fullName'
  | 'phone'
  | 'email'
  | 'fulfillmentMethod'
  | 'city'
  | 'address'
  | 'notes'
  | 'locale'
  | 'items'
  | 'fileIds'
  | 'uploadToken'
  | 'newsletterOptIn'
  | 'couponCode'
  | 'pointsToRedeem'
>;

export async function prepareCheckoutPayload(input: {
  fullName: string;
  phone: string;
  email: string;
  fulfillmentMethod: CheckoutInput['fulfillmentMethod'];
  city: string;
  address: string;
  notes: string;
  locale: CheckoutInput['locale'];
  items: CartItem[];
  fileIds: string[];
  uploadToken?: string | null;
  newsletterOptIn?: boolean;
  couponCode?: string | null;
  pointsToRedeem?: number;
}): Promise<CheckoutOrderPayload> {
  const items = await Promise.all(
    input.items.map((item) => prepareCheckoutItem(item)),
  );
  const couponCode = input.couponCode?.trim();

  const payload: CheckoutOrderPayload = {
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    fulfillmentMethod: input.fulfillmentMethod,
    city: input.city.trim(),
    address: input.address.trim(),
    ...(input.notes.trim() ? { notes: input.notes.trim() } : {}),
    locale: input.locale,
    items,
    fileIds: input.fileIds,
    ...(input.uploadToken ? { uploadToken: input.uploadToken } : {}),
    newsletterOptIn: Boolean(input.newsletterOptIn),
    ...(couponCode ? { couponCode } : {}),
    pointsToRedeem: Math.max(0, Math.floor(input.pointsToRedeem ?? 0)),
  };

  const parsed = checkoutSchema.safeParse(payload);
  if (!parsed.success) {
    console.error('[checkout] payload validation failed', parsed.error.flatten());
    throw new CheckoutPrepareError('invalid_order_data');
  }

  return parsed.data;
}

