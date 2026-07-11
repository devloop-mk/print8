import { NextRequest, NextResponse } from 'next/server';
import { getMergedProductDesignTemplate } from '@/lib/products/merged-product-designs';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const template = await getMergedProductDesignTemplate(id);
  if (!template) {
    return NextResponse.json({ error: 'Design not found' }, { status: 404 });
  }
  return NextResponse.json(
    { template },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    },
  );
}
