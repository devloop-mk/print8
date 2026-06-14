import { z } from "zod";

export const orderItemSchema = z.object({
  type: z.enum(["service", "design", "product"]),
  name: z.string().min(1),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  metadata: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  designPreview: z.string().optional(),
  fileIds: z.array(z.string()).optional(),
});

export const checkoutSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().min(8).max(20),
  email: z.string().email().optional().or(z.literal("")),
  city: z.string().min(2).max(100),
  address: z.string().min(5).max(300),
  notes: z.string().max(1000).optional(),
  locale: z.enum(["mk", "en"]),
  items: z.array(orderItemSchema).min(1),
  fileIds: z.array(z.string()).optional(),
  uploadToken: z.string().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
