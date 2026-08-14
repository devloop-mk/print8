import { z } from "zod";

export const ORDER_METADATA_FIELD_MAX = 150;
export const ORDER_PREVIEW_STRING_MAX = 800_000;
export const ORDER_METADATA_LARGE_STRING_MAX = 1_200_000;
export const ORDER_METADATA_DEFAULT_STRING_MAX = 120_000;

const ESSENTIAL_LARGE_METADATA_KEYS = new Set([
  "svgFrontContent",
  "svgBackContent",
]);

export function getOrderMetadataStringMaxLength(key: string): number {
  if (
    ESSENTIAL_LARGE_METADATA_KEYS.has(key) ||
    key === "brandingPackData" ||
    key.endsWith("OverlaySvg")
  ) {
    return ORDER_METADATA_LARGE_STRING_MAX;
  }

  return ORDER_METADATA_DEFAULT_STRING_MAX;
}

const metadataSchema = z
  .record(z.union([z.string(), z.number(), z.boolean()]))
  .superRefine((meta, ctx) => {
    if (Object.keys(meta).length > ORDER_METADATA_FIELD_MAX) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Too many metadata fields",
      });
    }

    for (const [key, value] of Object.entries(meta)) {
      if (typeof value !== "string") continue;
      const maxLength = getOrderMetadataStringMaxLength(key);
      if (value.length > maxLength) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Metadata field "${key}" exceeds maximum size`,
          path: [key],
        });
      }
    }
  })
  .optional();

const previewSchema = z.string().max(ORDER_PREVIEW_STRING_MAX).optional();

export const orderItemSchema = z.object({
  type: z.enum(["service", "design", "product"]),
  name: z.string().min(1).max(300),
  price: z.number().positive().max(500_000),
  quantity: z.number().int().positive().max(99),
  metadata: metadataSchema,
  designPreview: previewSchema,
  backDesignPreview: previewSchema,
  leftDesignPreview: previewSchema,
  rightDesignPreview: previewSchema,
  frontPrintPng: previewSchema,
  backPrintPng: previewSchema,
  leftPrintPng: previewSchema,
  rightPrintPng: previewSchema,
  fileIds: z.array(z.string().max(64)).max(20).optional(),
});

export const checkoutSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100),
    phone: z.string().trim().min(8).max(20),
    email: z.string().trim().email().max(254),
    fulfillmentMethod: z.enum(['cargo', 'pickup']).default('cargo'),
    city: z.string().trim().max(100).default(''),
    address: z.string().trim().max(300).default(''),
    notes: z.string().trim().max(1000).optional(),
    locale: z.enum(['mk', 'en']),
    items: z.array(orderItemSchema).min(1).max(30),
    fileIds: z.array(z.string().max(64)).max(20).optional(),
    uploadToken: z.string().min(16).max(128).optional(),
    newsletterOptIn: z.boolean().optional().default(false),
    couponCode: z
      .string()
      .trim()
      .max(40)
      .optional()
      .transform((value) => (value && value.length > 0 ? value : undefined)),
    pointsToRedeem: z.number().int().min(0).max(1_000_000).optional().default(0),
    turnstileToken: z.string().min(10).max(2048).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillmentMethod !== 'cargo') return;

    if (data.city.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'City is required for cargo delivery',
        path: ['city'],
      });
    }
    if (data.address.trim().length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Address is required for cargo delivery',
        path: ['address'],
      });
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type FulfillmentMethod = CheckoutInput['fulfillmentMethod'];

export const PICKUP_CITY = 'Штип';
export const PICKUP_ADDRESS = 'Подигнување во салон (Print 8)';

export function normalizeCheckoutFulfillment<T extends CheckoutInput>(
  data: T,
): T {
  if (data.fulfillmentMethod !== 'pickup') return data;
  return {
    ...data,
    city: PICKUP_CITY,
    address: PICKUP_ADDRESS,
  };
}
