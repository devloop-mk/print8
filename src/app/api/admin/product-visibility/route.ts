import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/admin/api-auth';
import { PRODUCT_VISIBILITY_CACHE_TAG } from '@/lib/cms/product-visibility';
import { productVisibilityDb } from '@/lib/db/product-visibility';
import { products } from '@/lib/data/catalog';

const patchSchema = z.object({
  productId: z.string().min(1),
  active: z.boolean(),
});

export async function GET(request: NextRequest) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  const rows = await productVisibilityDb.list();
  const byId = new Map(rows.map((row) => [row.productId, row.active]));

  const entries = products.map((product) => ({
    productId: product.id,
    active: byId.get(product.id) ?? true,
  }));

  return NextResponse.json({ entries });
}

export async function PATCH(request: NextRequest) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid visibility payload' }, { status: 400 });
    }

    if (!products.some((product) => product.id === parsed.data.productId)) {
      return NextResponse.json({ error: 'Unknown product' }, { status: 404 });
    }

    const saved = await productVisibilityDb.upsert(parsed.data);
    revalidateTag(PRODUCT_VISIBILITY_CACHE_TAG, 'max');
    return NextResponse.json(saved);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to update product visibility';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
