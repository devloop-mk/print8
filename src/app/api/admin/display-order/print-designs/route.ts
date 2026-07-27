import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { requireAdminApi } from '@/lib/admin/api-auth';
import { savePrintDesignDisplayOrder } from '@/lib/admin/print-design-display-order';
import {
  revalidateDesignCatalogCache,
  revalidateStorefrontDesignListingPaths,
} from '@/lib/catalog/revalidate-design-catalog';
import { PRINT_DESIGN_DISPLAY_ORDER_CACHE_TAG } from '@/lib/cms/display-order';

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

export async function PUT(request: NextRequest) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid print design order' },
        { status: 400 },
      );
    }

    await savePrintDesignDisplayOrder(parsed.data.entries);
    revalidateTag(PRINT_DESIGN_DISPLAY_ORDER_CACHE_TAG, 'max');
    revalidateDesignCatalogCache();
    revalidateStorefrontDesignListingPaths();

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to save print design order';
    const hint =
      message.toLowerCase().includes('cms_print_design_display_order') ||
      (message.toLowerCase().includes('relation') &&
        message.toLowerCase().includes('does not exist'))
        ? 'Run supabase/migrations/add-print-design-display-order.sql in the Supabase SQL Editor.'
        : undefined;
    return NextResponse.json(
      { error: hint ? `${message} ${hint}` : message },
      { status: 500 },
    );
  }
}
