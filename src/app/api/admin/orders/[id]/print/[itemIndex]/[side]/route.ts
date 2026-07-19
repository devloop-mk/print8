import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin/api-auth';
import { getAdminOrder } from '@/lib/admin/orders';
import { listSvgPrintFileRefsFromMetadata } from '@/lib/designs/svg-order-assets';
import { getOrderPrintObject } from '@/lib/storage/object-storage';
import { contentDispositionAttachment } from '@/lib/security/sanitize';

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string; itemIndex: string; side: string }>;
  },
) {
  const { error } = await requireAdminApi(request);
  if (error) return error;

  try {
    const { id, itemIndex: itemIndexRaw, side: sideRaw } = await params;
    const itemIndex = Number.parseInt(itemIndexRaw, 10);
    const side = sideRaw === 'front' || sideRaw === 'back' ? sideRaw : null;

    if (!Number.isInteger(itemIndex) || itemIndex < 0 || !side) {
      return NextResponse.json({ error: 'Invalid print file path' }, { status: 400 });
    }

    const order = await getAdminOrder(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const item = order.items[itemIndex];
    if (!item) {
      return NextResponse.json({ error: 'Order item not found' }, { status: 404 });
    }

    const file = listSvgPrintFileRefsFromMetadata(item.metadata, item.name).find(
      (entry) => entry.side === side,
    );
    if (!file) {
      return NextResponse.json({ error: 'Print file not found' }, { status: 404 });
    }

    let body: Buffer;
    if (typeof file.svg === 'string' && file.svg.trim()) {
      body = Buffer.from(file.svg, 'utf8');
    } else if (file.storedName) {
      const stored = await getOrderPrintObject(file.storedName);
      body = stored.body;
    } else {
      return NextResponse.json({ error: 'Print file not found' }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(body), {
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'private, no-store',
        'Content-Disposition': contentDispositionAttachment(file.filename),
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    console.error('[admin/orders/print] failed:', err);
    return NextResponse.json(
      { error: 'Failed to serve print file' },
      { status: 500 },
    );
  }
}
