import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/admin/api-auth';
import { displayOrderDb } from '@/lib/db/display-order';
import { PRODUCT_DISPLAY_ORDER_CACHE_TAG } from '@/lib/cms/display-order';

const bodySchema = z.object({
  entries: z
    .array(
      z.object({
        id: z.string().min(1),
        sortOrder: z.number().int().min(0),
      }),
    )
    .max(200),
});

export async function GET(request: NextRequest) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  const entries = await displayOrderDb.products.list();
  return NextResponse.json({ entries });
}

export async function PUT(request: NextRequest) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid product order' }, { status: 400 });
    }

    const entries = await displayOrderDb.products.replaceAll(parsed.data.entries);
    // 'catalog-products' does not tag any unstable_cache entry (it's an unused
    // constant in CATALOG_CACHE_TAGS) — only the display-order cache is real.
    revalidateTag(PRODUCT_DISPLAY_ORDER_CACHE_TAG, 'max');
    return NextResponse.json({ entries });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save product order';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
