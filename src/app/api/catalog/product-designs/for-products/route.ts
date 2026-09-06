import { NextRequest, NextResponse } from 'next/server';
import { products } from '@/lib/data/catalog';
import { premadeDesignAppliesToProduct } from '@/lib/products/premade-design-product-match';
import { getMergedProductDesignTemplates } from '@/lib/products/merged-product-designs';

export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get('ids')?.trim();
  if (!idsParam) {
    return NextResponse.json({ error: 'ids required' }, { status: 400 });
  }

  const ids = [...new Set(idsParam.split(',').map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) {
    return NextResponse.json({ byProduct: {} });
  }

  const productsById = new Map(
    products.filter((product) => ids.includes(product.id)).map((product) => [product.id, product]),
  );

  const templates = await getMergedProductDesignTemplates();
  const byProduct: Record<string, typeof templates> = {};

  for (const id of ids) {
    const product = productsById.get(id);
    if (!product) continue;
    byProduct[id] = templates.filter((template) =>
      premadeDesignAppliesToProduct(template, product),
    );
  }

  return NextResponse.json(
    { byProduct },
    {
      headers: {
        'Cache-Control': 'private, no-store',
      },
    },
  );
}
