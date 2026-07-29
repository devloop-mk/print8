import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin/api-auth';
import { getAdminOrder } from '@/lib/admin/orders';
import { listSvgPrintFileRefsFromMetadata } from '@/lib/designs/svg-order-assets';
import { listProductPrintPngRefsFromItem } from '@/lib/orders/product-order-assets';
import { listPremadeMasterAssetRefsFromItem } from '@/lib/orders/premade-master-assets';
import { getOrderPrintObject } from '@/lib/storage/object-storage';
import { getPremadeMasterObject } from '@/lib/storage/premade-master-storage';
import { contentDispositionAttachment } from '@/lib/security/sanitize';

export const runtime = 'nodejs';

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
    const side =
      sideRaw === 'front' ||
      sideRaw === 'back' ||
      sideRaw === 'left' ||
      sideRaw === 'right'
        ? sideRaw
        : null;
    const format = request.nextUrl.searchParams.get('format');

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

    if (format === 'master') {
      let masterRefs: Awaited<ReturnType<typeof listPremadeMasterAssetRefsFromItem>>;
      try {
        masterRefs = await listPremadeMasterAssetRefsFromItem(item);
      } catch (refsError) {
        console.error('[admin/orders/print] master refs failed:', refsError);
        return NextResponse.json({ error: 'Master file not found' }, { status: 404 });
      }

      const masterFile = masterRefs.find((entry) => entry.side === side);
      const storagePath =
        masterFile?.masterStoragePath?.trim() ||
        masterFile?.masterUrl?.trim() ||
        '';
      if (!masterFile || !storagePath) {
        return NextResponse.json({ error: 'Master file not found' }, { status: 404 });
      }

      try {
        const stored = await getPremadeMasterObject(
          storagePath,
          masterFile.masterUrl,
        );
        const asDownload = request.nextUrl.searchParams.get('download') === '1';
        return new NextResponse(new Uint8Array(stored.body), {
          headers: {
            'Content-Type': stored.contentType ?? 'image/png',
            'Cache-Control': 'private, no-store',
            'Content-Disposition': asDownload
              ? contentDispositionAttachment(masterFile.filename)
              : 'inline',
            'X-Content-Type-Options': 'nosniff',
          },
        });
      } catch (loadError) {
        console.error('[admin/orders/print] master load failed:', {
          orderId: id,
          itemIndex,
          side,
          storagePath: storagePath,
          masterUrl: masterFile.masterUrl,
          error:
            loadError instanceof Error ? loadError.message : String(loadError),
        });
        return NextResponse.json({ error: 'Master file not found' }, { status: 404 });
      }
    }

    if (format === 'png') {
      const pngFile = listProductPrintPngRefsFromItem(item).find(
        (entry) => entry.side === side,
      );
      if (!pngFile) {
        return NextResponse.json({ error: 'Print file not found' }, { status: 404 });
      }

      if (pngFile.externalUrl) {
        return NextResponse.redirect(pngFile.externalUrl);
      }

      if (pngFile.pngDataUrl) {
        const match = pngFile.pngDataUrl.match(/^data:image\/png;base64,(.+)$/);
        if (!match) {
          return NextResponse.json({ error: 'Print file not found' }, { status: 404 });
        }
        const body = Buffer.from(match[1], 'base64');
        return new NextResponse(new Uint8Array(body), {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'private, no-store',
            'Content-Disposition': contentDispositionAttachment(pngFile.filename),
            'X-Content-Type-Options': 'nosniff',
          },
        });
      }

      if (!pngFile.storedName) {
        return NextResponse.json({ error: 'Print file not found' }, { status: 404 });
      }

      const stored = await getOrderPrintObject(pngFile.storedName);
      return new NextResponse(new Uint8Array(stored.body), {
        headers: {
          'Content-Type': stored.contentType ?? 'image/png',
          'Cache-Control': 'private, no-store',
          'Content-Disposition': contentDispositionAttachment(pngFile.filename),
          'X-Content-Type-Options': 'nosniff',
        },
      });
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
