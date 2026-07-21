import { NextRequest, NextResponse } from 'next/server';
import { resolveProductDesignTemplate } from '@/lib/products/resolve-product-design-template';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const template = await resolveProductDesignTemplate(id);
  if (!template) {
    return NextResponse.json({ error: 'Design not found' }, { status: 404 });
  }
  // no-store: customizer must see admin placement updates immediately.
  // Server-side data is already cached via PRODUCT_DESIGNS_CACHE_TAG.
  return NextResponse.json(
    { template },
    {
      headers: {
        'Cache-Control': 'private, no-store',
      },
    },
  );
}
