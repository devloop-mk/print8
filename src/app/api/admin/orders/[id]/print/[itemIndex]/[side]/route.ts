import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin/api-auth';
import { getAdminOrder } from '@/lib/admin/orders';
import { listSvgPrintFileRefsFromMetadata } from '@/lib/designs/svg-order-assets';
import { listProductPrintPngRefsFromItem } from '@/lib/orders/product-order-assets';
import type { OrderItem } from '@/lib/orders/product-order-assets';
import { listPremadeMasterAssetRefsFromItem } from '@/lib/orders/premade-master-assets';
import {
  getOrderPrintObject,
  getUploadObject,
} from '@/lib/storage/object-storage';
import { getPremadeMasterObject } from '@/lib/storage/premade-master-storage';
import { contentDispositionAttachment } from '@/lib/security/sanitize';
import type { ProductSide } from '@/lib/data/catalog';
import { getSideMetadataPrefix } from '@/lib/products/product-sides';
import { getUploadedFile } from '@/lib/upload';

export const runtime = 'nodejs';

function printFileNotFound(message = 'Print file not found') {
  return NextResponse.json({ error: message, code: 'print_file_not_found' }, {
    status: 404,
  });
}

async function loadStoredPrintBody(storedName: string): Promise<Buffer | null> {
  try {
    const stored = await getOrderPrintObject(storedName);
    return stored.body;
  } catch (error) {
    console.error('[admin/orders/print] stored print missing:', {
      storedName,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function loadProductPrintPngBody(
  item: OrderItem,
  side: ProductSide,
): Promise<Buffer | null> {
  const pngFile = listProductPrintPngRefsFromItem(item).find(
    (entry) => entry.side === side,
  );
  if (!pngFile) return null;

  if (pngFile.pngDataUrl) {
    const match = pngFile.pngDataUrl.match(/^data:image\/png;base64,(.+)$/);
    return match ? Buffer.from(match[1], 'base64') : null;
  }

  if (pngFile.storedName) {
    const body = await loadStoredPrintBody(pngFile.storedName);
    if (body) return body;
  }

  const fileIdKey = `${getSideMetadataPrefix(side)}PrintPngFileId`;
  const fileId = item.metadata?.[fileIdKey];
  if (typeof fileId === 'string' && fileId.trim()) {
    try {
      const uploaded = await getUploadedFile(fileId.trim());
      if (uploaded) {
        const sourceName =
          uploaded.originalStoredName ?? uploaded.storedName;
        const { body } = await getUploadObject(sourceName);
        return body;
      }
    } catch (error) {
      console.error('[admin/orders/print] upload fallback failed:', {
        fileId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return null;
}

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
        return printFileNotFound('Master file not found');
      }

      const masterFile = masterRefs.find((entry) => entry.side === side);
      const storagePath =
        masterFile?.masterStoragePath?.trim() ||
        masterFile?.masterUrl?.trim() ||
        '';
      if (!masterFile || !storagePath) {
        return printFileNotFound('Master file not found');
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
          storagePath,
          masterUrl: masterFile.masterUrl,
          error:
            loadError instanceof Error ? loadError.message : String(loadError),
        });
        return printFileNotFound('Master file not found');
      }
    }

    if (format === 'png') {
      const pngFile = listProductPrintPngRefsFromItem(item).find(
        (entry) => entry.side === side,
      );
      if (!pngFile) {
        return printFileNotFound();
      }

      if (pngFile.externalUrl) {
        return NextResponse.redirect(pngFile.externalUrl);
      }

      const body = await loadProductPrintPngBody(item, side);
      if (!body) {
        return printFileNotFound(
          'Print PNG is missing from storage. The file may not have been copied when the order was placed.',
        );
      }

      return new NextResponse(new Uint8Array(body), {
        headers: {
          'Content-Type': 'image/png',
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
      return printFileNotFound();
    }

    let body: Buffer | null = null;
    if (typeof file.svg === 'string' && file.svg.trim()) {
      body = Buffer.from(file.svg, 'utf8');
    } else if (file.storedName) {
      body = await loadStoredPrintBody(file.storedName);
    }

    if (!body) {
      return printFileNotFound(
        'Print SVG is missing from storage. The file may not have been saved when the order was placed.',
      );
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
