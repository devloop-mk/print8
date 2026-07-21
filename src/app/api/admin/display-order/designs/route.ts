import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/admin/api-auth';
import { displayOrderDb } from '@/lib/db/display-order';
import { DESIGN_DISPLAY_ORDER_CACHE_TAG } from '@/lib/cms/display-order';

const bodySchema = z.object({
  entries: z
    .array(
      z.object({
        id: z.string().min(1),
        sortOrder: z.number().int().min(0),
      }),
    )
    .max(5000),
});

export async function GET(request: NextRequest) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  const entries = await displayOrderDb.designs.list();
  return NextResponse.json({ entries });
}

export async function PUT(request: NextRequest) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid design order' }, { status: 400 });
    }

    const entries = await displayOrderDb.designs.upsertMany(parsed.data.entries);
    // Only the display-order Data Cache entry actually changed here — the
    // managed product-design records (PRODUCT_DESIGNS_CACHE_TAG) are untouched,
    // and 'catalog-ready-designs' does not tag any unstable_cache entry
    // (getCachedReadyDesignEntriesForType is React-cache only, per-request).
    revalidateTag(DESIGN_DISPLAY_ORDER_CACHE_TAG, 'max');
    return NextResponse.json({ entries });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save design order';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
